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

const router = Router();

// 50 coins per referral (changed from 500 — keeps costs reasonable for owner)
const REFERRAL_COINS = 50;
const REFERRAL_BONUS_FOR_REFERRED = 25;

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

  if (!existing) {
    // New user — grant referral bonus if applicable
    let startCoins = 0;
    if (referredBy && referredBy !== telegramId) {
      startCoins = REFERRAL_BONUS_FOR_REFERRED;
    }

    const inserted = await db
      .insert(usersTable)
      .values({
        telegramId,
        firstName,
        username: username ?? null,
        coins: startCoins.toString(),
        referredBy: referredBy ?? null,
        lastLoginAt: now,
        streakCount: 1,
      })
      .returning();

    existing = inserted[0];

    // Credit referrer
    if (referredBy && referredBy !== telegramId) {
      const referrer = await db.query.usersTable.findFirst({
        where: eq(usersTable.telegramId, referredBy),
      });
      if (referrer) {
        await db
          .update(usersTable)
          .set({
            coins: sql`${usersTable.coins} + ${REFERRAL_COINS}`,
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
          await checkAndGrantReferralAchievements(referredBy, updatedReferrer.totalReferrals + 1);
        }
      }
    }
  } else {
    // Existing user — update streak
    const lastLogin = existing.lastLoginAt;
    let newStreak = existing.streakCount;

    if (lastLogin) {
      const hoursSince = (now.getTime() - lastLogin.getTime()) / 3600000;
      if (hoursSince >= 24 && hoursSince < 48) {
        newStreak = existing.streakCount + 1;
      } else if (hoursSince >= 48) {
        newStreak = 1; // streak broken
      }
    }

    await db
      .update(usersTable)
      .set({ firstName, username: username ?? null, lastLoginAt: now, streakCount: newStreak })
      .where(eq(usersTable.telegramId, telegramId));

    existing = { ...existing, firstName, username: username ?? null, streakCount: newStreak };

    if (newStreak >= 7) {
      await grantAchievement(telegramId, "weekly_streak");
    }
  }

  res.json(formatUser(existing));
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

  const { balance, farmState } = parsed.data;

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
    if (farmState.wheat  >= 10) await grantNft(telegramId, "golden_wheat");
    if (farmState.chicken >= 10) await grantNft(telegramId, "diamond_chicken");
    if (farmState.cow    >= 10) await grantNft(telegramId, "royal_cow");
    if (farmState.wheat  >= 1 && farmState.chicken >= 1 && farmState.cow >= 1) {
      await grantNft(telegramId, "farm_pioneer");
    }
  } catch { /* non-critical */ }

  const updated = await db
    .update(usersTable)
    .set({ balance: balance.toString(), farmState })
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
}

export default router;
