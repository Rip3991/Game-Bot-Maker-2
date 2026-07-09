import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable, referralsTable, achievementsTable } from "@workspace/db";
import { grantNft } from "./nfts";
import {
  InitUserBody,
  GetUserParams,
  SaveFarmStateBody,
  GetAchievementsParams,
} from "@workspace/api-zod";
import { notifyUser, getBotUsername, getGameUrl } from "../lib/telegram";

const router = Router();

const REFERRAL_COINS = 25;          // coins to referrer
const REFERRAL_TL = 10;             // TL to referrer (real money reward)
const REFERRAL_BONUS_FOR_REFERRED = 10; // coins to invited user
const SECOND_TIER_REFERRAL_TL = 2;  // TL to the referrer's referrer (chain bonus)

// Streak TL milestones — { day: TL, achievementKey }
const STREAK_TL_MILESTONES = [
  { day: 7,  tl: 3,  key: "streak_tl_7"  },
  { day: 14, tl: 5,  key: "streak_tl_14" },
  { day: 30, tl: 15, key: "streak_tl_30" },
  { day: 60, tl: 30, key: "streak_tl_60" },
];

const ACHIEVEMENT_DEFINITIONS = [
  { key: "first_upgrade", title: "İlk Mahsul", description: "İlk çiftlik yükseltmeni yap", icon: "🌾" },
  { key: "coin_collector", title: "Para Basmak", description: "1000 coin kazan", icon: "🪙" },
  { key: "social_farmer_1", title: "Sosyal Çiftçi", description: "1 arkadaş davet et", icon: "👥" },
  { key: "social_farmer_5", title: "Lider Çiftçi", description: "5 arkadaş davet et", icon: "👑" },
  { key: "social_farmer_10", title: "Efsane Çiftçi", description: "10 arkadaş davet et", icon: "🏆" },
  { key: "weekly_streak", title: "Haftalık Seri", description: "7 gün üst üste giriş yap", icon: "🔥" },
  { key: "jackpot", title: "Büyük Kazanan", description: "Çarkta jackpot çevir", icon: "🎰" },
  { key: "first_withdraw", title: "İlk Çekim", description: "İlk para çekimini yap", icon: "💸" },
];

// POST /users/init
router.post("/users/init", async (req, res): Promise<void> => {
  const parsed = InitUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { telegramId, firstName, username, referredBy: rawReferredBy } = parsed.data;
  const now = new Date();

  // Strip "ref_" prefix from referral param (link format: ?start=ref_<telegramId>)
  const referredBy = rawReferredBy
    ? rawReferredBy.startsWith("ref_")
      ? rawReferredBy.slice(4)
      : rawReferredBy
    : null;

  // Update online heartbeat
  onlineHeartbeats.set(telegramId, now);

  let existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
  });

  const hadExistingUser = !!existing;

  if (!existing) {
    // New user — look up referrer first so we can gate invited-user bonus
    // on referrer existence (avoids granting coins for phantom referral codes)
    let referrer = null;
    if (referredBy && referredBy !== telegramId) {
      referrer = await db.query.usersTable.findFirst({
        where: eq(usersTable.telegramId, referredBy),
      });
    }

    const startCoins = referrer ? REFERRAL_BONUS_FOR_REFERRED : 0;

    const inserted = await db
      .insert(usersTable)
      .values({
        telegramId,
        firstName,
        username: username ?? null,
        coins: startCoins.toString(),
        referredBy: referrer ? referredBy : null,
        lastLoginAt: now,
        streakCount: 1,
      })
      .returning();

    existing = inserted[0];

    // Credit referrer
    if (referredBy && referredBy !== telegramId) {
      if (referrer) {
        await db
          .update(usersTable)
          .set({
            coins: sql`${usersTable.coins} + ${REFERRAL_COINS}`,
            balance: sql`${usersTable.balance} + ${REFERRAL_TL}`,
            totalReferrals: sql`${usersTable.totalReferrals} + 1`,
          })
          .where(eq(usersTable.telegramId, referredBy));

        await db.insert(referralsTable).values({
          referrerTelegramId: referredBy,
          referredTelegramId: telegramId,
          coinsEarned: REFERRAL_COINS,
        });

        const updatedReferrer = await db.query.usersTable.findFirst({
          where: eq(usersTable.telegramId, referredBy),
        });
        if (updatedReferrer) {
          await checkAndGrantReferralAchievements(referredBy, updatedReferrer.totalReferrals);

          // 2nd-tier chain bonus — reward whoever invited the referrer, encouraging
          // active recruiters to keep growing their own network rather than just inviting once.
          if (updatedReferrer.referredBy && updatedReferrer.referredBy !== referredBy && updatedReferrer.referredBy !== telegramId) {
            const grandReferrer = await db.query.usersTable.findFirst({
              where: eq(usersTable.telegramId, updatedReferrer.referredBy),
            });
            if (grandReferrer) {
              await db
                .update(usersTable)
                .set({ balance: sql`${usersTable.balance} + ${SECOND_TIER_REFERRAL_TL}` })
                .where(eq(usersTable.telegramId, grandReferrer.telegramId));

              notifyUser(
                grandReferrer.telegramId,
                `🔗 <b>Zincir Bonusu!</b>\n\nDavet ettiğin biri de birini davet etti!\n💵 <b>${SECOND_TIER_REFERRAL_TL} TL</b> hesabına eklendi!`,
              ).catch(() => { /* non-critical */ });
            }
          }
        }

        // --- Telegram notifications (fire-and-forget) ---
        const gameUrl = getGameUrl();
        const botUsername = getBotUsername();
        const appUrl = gameUrl || `https://t.me/${botUsername}`;

        // Notify referrer
        notifyUser(
          referredBy,
          `🎉 <b>Davetinden biri katıldı!</b>\n\n👤 <b>${firstName}</b> davet linkinle katıldı.\n🪙 <b>${REFERRAL_COINS} Coin</b> + 💵 <b>${REFERRAL_TL} TL</b> bakiyene eklendi!\n\nToplam davet: <b>${(updatedReferrer?.totalReferrals ?? 1)}</b> kişi`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🚜 Çiftliğe Git", web_app: { url: appUrl } }],
              ],
            },
          },
        ).catch(() => { /* non-critical */ });

        // Notify invited user
        notifyUser(
          telegramId,
          `🌾 <b>Davet bonusu kazandın!</b>\n\nDavet linki aracılığıyla katıldığın için bakiyene <b>${REFERRAL_BONUS_FOR_REFERRED} Coin</b> eklendi!\n\nİyi oyunlar! 🪙`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: "🚜 Çiftliğe Git", web_app: { url: appUrl } }],
              ],
            },
          },
        ).catch(() => { /* non-critical */ });
      }
    }
  } else {
    // Existing user — update streak
    const lastLogin = existing.lastLoginAt;
    let newStreak = existing.streakCount;

    if (lastLogin) {
      // Compare calendar days (UTC), not rolling hour windows. A rolling
      // "hours since last open" comparison breaks when a user opens the app
      // more than once in a day — each open resets the anchor time, so a
      // legitimate next-day login can be <24h after the last (later) open
      // and silently fail to increment the streak.
      const diffDays = Math.round((utcDayStart(now) - utcDayStart(lastLogin)) / 86400000);
      if (diffDays === 1) {
        newStreak = existing.streakCount + 1; // consecutive calendar day
      } else if (diffDays >= 2) {
        newStreak = 1; // missed a day — streak broken
      }
      // diffDays === 0 (or negative, e.g. clock skew) — same day, no change
    }

    await db
      .update(usersTable)
      .set({ firstName, username: username ?? null, lastLoginAt: now, streakCount: newStreak })
      .where(eq(usersTable.telegramId, telegramId));

    existing = { ...existing, firstName, username: username ?? null, streakCount: newStreak };

    if (newStreak >= 7) {
      await grantAchievement(telegramId, "weekly_streak");
    }

    // Streak TL milestones — grant each only once
    for (const milestone of STREAK_TL_MILESTONES) {
      if (newStreak >= milestone.day) {
        const alreadyGranted = await db.query.achievementsTable.findFirst({
          where: (t, { and, eq: eq2 }) =>
            and(eq2(t.userTelegramId, telegramId), eq2(t.achievementKey, milestone.key)),
        });
        if (!alreadyGranted) {
          await db.update(usersTable)
            .set({ balance: sql`${usersTable.balance} + ${milestone.tl}` })
            .where(eq(usersTable.telegramId, telegramId));
          await db.insert(achievementsTable).values({
            userTelegramId: telegramId,
            achievementKey: milestone.key,
          });
          notifyUser(
            telegramId,
            `🔥 <b>${milestone.day} Günlük Seri Bonusu!</b>\n\n${milestone.day} gün üst üste giriş yaptın!\n💵 <b>${milestone.tl} TL</b> hesabına eklendi!`,
          ).catch(() => {});
        }
      }
    }
  }

  res.json({ ...formatUser(existing), isNewUser: !hadExistingUser });
});

// GET /users/:telegramId/balance — lightweight poll endpoint (balance + coins only)
router.get("/users/:telegramId/balance", async (req, res): Promise<void> => {
  const telegramId = req.params.telegramId;
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
  });
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ balance: Number(user.balance), coins: Number(user.coins) });
});

// GET /users/:telegramId
router.get("/users/:telegramId", async (req, res): Promise<void> => {
  const parsed = GetUserParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, parsed.data.telegramId),
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(formatUser(user));
});

// PUT /users/:telegramId/farm-state
router.put("/users/:telegramId/farm-state", async (req, res): Promise<void> => {
  const telegramId = Array.isArray(req.params.telegramId)
    ? req.params.telegramId[0]
    : req.params.telegramId;

  const parsed = SaveFarmStateBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { balance, prevBalance, coins: coinsDelta, prevCoins, farmState } = parsed.data;

  // Check for first upgrade achievement
  const maxLevel = Math.max(farmState.wheat, farmState.chicken, farmState.cow);
  if (maxLevel > 1) {
    await grantAchievement(telegramId, "first_upgrade");
  }

  // Check coin achievements
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
    columns: { coins: true },
  });
  if (user && Number(user.coins) >= 1000) {
    await grantAchievement(telegramId, "coin_collector");
  }

  // Grant NFTs on farm max-level milestones (non-critical, swallow errors)
  try {
    if (farmState.wheat   >= 10) await grantNft(telegramId, "golden_bee");
    if (farmState.chicken >= 10) await grantNft(telegramId, "tropical_parrot");
    if (farmState.cow     >= 10) await grantNft(telegramId, "golden_turtle");
    if (farmState.wheat   >= 1 && farmState.chicken >= 1 && farmState.cow >= 1) {
      await grantNft(telegramId, "lucky_clover");
    }
  } catch { /* non-critical */ }

  // Delta-based balance update — preserves admin-credited funds without blocking
  // legitimate spending.
  //
  // When `prevBalance` is provided (normal case after first session):
  //   new_db = GREATEST(0, db_current + (balance - prevBalance))
  //   • balance=150, prevBalance=100 → delta=+50 (earned TL)           ✓
  //   • balance=50,  prevBalance=100 → delta=−50 (spent TL)            ✓
  //   • admin added while local was idle: delta=0, DB keeps admin money ✓
  //   • admin added AND user earned 50: delta=+50, DB = admin+50        ✓
  //
  // When `prevBalance` is absent (first save or legacy client):
  //   fall back to absolute write to avoid blocking legitimate first saves.
  const balanceUpdate =
    prevBalance !== undefined && prevBalance !== null
      ? sql`GREATEST(0, ${usersTable.balance} + (${balance.toString()}::numeric - ${prevBalance.toString()}::numeric))`
      : sql`${balance.toString()}::numeric`;

  // Same delta pattern as balance, applied to Coins earned by selling harvested
  // goods in the farm loop. Coins are otherwise credited server-side (Stars
  // purchases, referrals, coin shop) — the delta avoids clobbering those.
  //
  // Coins can be converted to real TL (/stars/convert-coins-to-tl), so this is
  // the highest-value client-trusted field in this route. As defense-in-depth
  // against a tampered client submitting an inflated delta, clamp the applied
  // delta to what's plausible in one 30s save interval — generously above the
  // max legitimate yield (highest-tier section, maxed out, max level) so real
  // play is never blocked. This does not replace real auth (see note below);
  // it only bounds the damage a single forged request can do.
  const MAX_COIN_DELTA_PER_SAVE = 2_000_000;
  const coinsUpdate =
    coinsDelta !== undefined && coinsDelta !== null && prevCoins !== undefined && prevCoins !== null
      ? sql`GREATEST(0, ${usersTable.coins} + LEAST(${MAX_COIN_DELTA_PER_SAVE}, ${coinsDelta.toString()}::numeric - ${prevCoins.toString()}::numeric))`
      : undefined;

  const updated = await db
    .update(usersTable)
    .set({ balance: balanceUpdate, farmState, ...(coinsUpdate ? { coins: coinsUpdate } : {}) })
    .where(eq(usersTable.telegramId, telegramId))
    .returning();

  if (!updated[0]) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(formatUser(updated[0]));
});

// GET /users/:telegramId/achievements
router.get("/users/:telegramId/achievements", async (req, res): Promise<void> => {
  const parsed = GetAchievementsParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }

  const earned = await db.query.achievementsTable.findMany({
    where: eq(achievementsTable.userTelegramId, parsed.data.telegramId),
  });

  const earnedKeys = new Set(earned.map((a) => a.achievementKey));

  const result = ACHIEVEMENT_DEFINITIONS.map((def) => {
    const record = earned.find((e) => e.achievementKey === def.key);
    return {
      key: def.key,
      title: def.title,
      description: def.description,
      icon: def.icon,
      earnedAt: record ? record.earnedAt.toISOString() : "",
      unlocked: earnedKeys.has(def.key),
    };
  });

  res.json(result);
});

// GET /referrals/stats/:telegramId
router.get("/referrals/stats/:telegramId", async (req, res): Promise<void> => {
  const telegramId = Array.isArray(req.params.telegramId)
    ? req.params.telegramId[0]
    : req.params.telegramId;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
  });
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const referrals = await db.query.referralsTable.findMany({
    where: eq(referralsTable.referrerTelegramId, telegramId),
    orderBy: [desc(referralsTable.createdAt)],
    limit: 10,
  });

  // Use BOT_USERNAME env var — set to MemberGobot in production
  const botUsername = process.env.BOT_USERNAME ?? "MemberGobot";
  // ?start= triggers /start webhook which responds with game URL containing ?startapp=
  const referralLink = `https://t.me/${botUsername}?start=ref_${telegramId}`;
  const totalCoins = referrals.reduce((s, r) => s + r.coinsEarned, 0);

  const recentReferrals = await Promise.all(
    referrals.map(async (r) => {
      const referred = await db.query.usersTable.findFirst({
        where: eq(usersTable.telegramId, r.referredTelegramId),
      });
      return {
        firstName: referred?.firstName ?? "Anonim",
        joinedAt: r.createdAt.toISOString(),
        coinsEarned: r.coinsEarned,
      };
    }),
  );

  res.json({
    telegramId,
    totalReferrals: user.totalReferrals,
    coinsFromReferrals: totalCoins,
    referralLink,
    recentReferrals,
  });
});

// --- Online heartbeat tracking (in-memory, resets on server restart) ---
export const onlineHeartbeats = new Map<string, Date>();
const ONLINE_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function getOnlineCount(): number {
  const cutoff = new Date(Date.now() - ONLINE_WINDOW_MS);
  let count = 0;
  for (const ts of onlineHeartbeats.values()) {
    if (ts >= cutoff) count++;
  }
  return count;
}

// --- Helpers ---

// Midnight (UTC) timestamp for the calendar day a given Date falls on —
// used to compare "days" instead of rolling 24h windows.
function utcDayStart(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

function formatUser(user: typeof usersTable.$inferSelect) {
  return {
    telegramId: user.telegramId,
    firstName: user.firstName,
    username: user.username ?? null,
    coins: Number(user.coins),
    balance: Number(user.balance),
    farmState: user.farmState ?? { wheat: 1, chicken: 1, cow: 1 },
    streakCount: user.streakCount,
    totalReferrals: user.totalReferrals,
    lastSpinAt: user.lastSpinAt ? user.lastSpinAt.toISOString() : null,
    createdAt: user.createdAt.toISOString(),
    // isNewUser is always false here; the init route overrides it to true for new accounts
    isNewUser: false,
  };
}

async function grantAchievement(telegramId: string, key: string) {
  const existing = await db.query.achievementsTable.findFirst({
    where: (t, { and }) =>
      and(eq(t.userTelegramId, telegramId), eq(t.achievementKey, key)),
  });
  if (!existing) {
    await db.insert(achievementsTable).values({ userTelegramId: telegramId, achievementKey: key });
  }
}

async function checkAndGrantReferralAchievements(telegramId: string, count: number) {
  if (count >= 1) await grantAchievement(telegramId, "social_farmer_1");
  if (count >= 5) await grantAchievement(telegramId, "social_farmer_5");
  if (count >= 10) await grantAchievement(telegramId, "social_farmer_10");

  // NFT milestone rewards for invite events
  if (count === 1) {
    await grantNft(telegramId, "mystic_seal").catch(() => {});
  }
  if (count === 5) {
    await grantNft(telegramId, "ancient_temple").catch(() => {});
  }
  if (count === 10) {
    await grantNft(telegramId, "titan_axe").catch(() => {});
  }
  if (count === 25) {
    await grantNft(telegramId, "dragon_tower").catch(() => {});
  }
  if (count === 50) {
    await grantNft(telegramId, "fate_lock").catch(() => {});
  }
}

export default router;
