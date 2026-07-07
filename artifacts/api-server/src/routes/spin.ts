import { Router } from "express";
import { eq, sql, and, or, lt, isNull } from "drizzle-orm";
import { db, usersTable, achievementsTable } from "@workspace/db";
import { DailySpinBody } from "@workspace/api-zod";

const router = Router();

const SPIN_SEGMENTS = [
  { label: "50 Coin", prizeType: "coins" as const, coinsEarned: 50, segmentIndex: 0 },
  { label: "100 Coin", prizeType: "coins" as const, coinsEarned: 100, segmentIndex: 1 },
  { label: "2x Boost 1 Saat", prizeType: "boost" as const, coinsEarned: 0, segmentIndex: 2 },
  { label: "200 Coin", prizeType: "coins" as const, coinsEarned: 200, segmentIndex: 3 },
  { label: "Şansını Zorla", prizeType: "miss" as const, coinsEarned: 0, segmentIndex: 4 },
  { label: "500 Coin", prizeType: "coins" as const, coinsEarned: 500, segmentIndex: 5 },
  { label: "JACKPOT 1000", prizeType: "jackpot" as const, coinsEarned: 1000, segmentIndex: 6 },
  { label: "75 Coin", prizeType: "coins" as const, coinsEarned: 75, segmentIndex: 7 },
];

const WEIGHTS = [15, 20, 8, 15, 15, 15, 2, 10];

function weightedRandom(): number {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < WEIGHTS.length; i++) {
    rand -= WEIGHTS[i];
    if (rand <= 0) return i;
  }
  return WEIGHTS.length - 1;
}

// POST /spin
router.post("/spin", async (req, res): Promise<void> => {
  const parsed = DailySpinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { telegramId } = parsed.data;
  const now = new Date();
  const cooldownCutoff = new Date(now.getTime() - 24 * 3600 * 1000);

  // Atomic cooldown check: only update if lastSpinAt IS NULL or older than 24h.
  // This collapses the read + write into one statement, preventing race conditions.
  const segmentIndex = weightedRandom();
  const segment = SPIN_SEGMENTS[segmentIndex];

  // We need streak info — read user first, but only to get streakCount (non-critical for race)
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
    columns: { streakCount: true, lastSpinAt: true, coins: true },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const streakBonus =
    segment.prizeType === "coins"
      ? Math.floor(segment.coinsEarned * Math.min(user.streakCount * 0.1, 0.5))
      : 0;
  const totalCoins = segment.coinsEarned + streakBonus;

  // Conditional UPDATE: only proceeds when cooldown has expired (atomic, no separate read needed)
  const updated = await db
    .update(usersTable)
    .set({
      lastSpinAt: now,
      coins: totalCoins > 0 ? sql`${usersTable.coins} + ${totalCoins}` : usersTable.coins,
    })
    .where(
      and(
        eq(usersTable.telegramId, telegramId),
        or(isNull(usersTable.lastSpinAt), lt(usersTable.lastSpinAt, cooldownCutoff)),
      ),
    )
    .returning({ coins: usersTable.coins, lastSpinAt: usersTable.lastSpinAt });

  // If no row was updated, cooldown is still active
  if (!updated[0]) {
    const canSpinAgainAt = new Date(user.lastSpinAt!.getTime() + 24 * 3600 * 1000);
    const hoursRemaining = (canSpinAgainAt.getTime() - now.getTime()) / 3600000;
    res.status(429).json({
      canSpinAgainAt: canSpinAgainAt.toISOString(),
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    });
    return;
  }

  const newTotal = Number(updated[0].coins);

  // Grant achievements (non-critical path, ignore errors)
  try {
    if (segment.prizeType === "jackpot") await grantAchievement(telegramId, "jackpot");
    if (newTotal >= 1000) await grantAchievement(telegramId, "coin_collector");
  } catch { /* best-effort */ }

  const canSpinAgainAt = new Date(now.getTime() + 24 * 3600 * 1000);

  res.json({
    prize: segment.label,
    prizeType: segment.prizeType,
    coinsEarned: totalCoins,
    newCoinsTotal: newTotal,
    segmentIndex,
    canSpinAgainAt: canSpinAgainAt.toISOString(),
    streakBonus: streakBonus > 0 ? streakBonus : null,
  });
});

async function grantAchievement(telegramId: string, key: string) {
  const existing = await db.query.achievementsTable.findFirst({
    where: (t, { and }) =>
      and(eq(t.userTelegramId, telegramId), eq(t.achievementKey, key)),
  });
  if (!existing) {
    await db
      .insert(achievementsTable)
      .values({ userTelegramId: telegramId, achievementKey: key })
      .onConflictDoNothing();
  }
}

export default router;
