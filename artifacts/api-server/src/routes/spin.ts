import { Router } from "express";
import { eq, sql } from "drizzle-orm";
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

// Weighted random: jackpot 2%, boost 8%, miss 15%, rest proportional
const WEIGHTS = [15, 20, 8, 15, 15, 15, 2, 10]; // must sum to 100

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

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const now = new Date();

  // Check cooldown (24h)
  if (user.lastSpinAt) {
    const hoursSince = (now.getTime() - user.lastSpinAt.getTime()) / 3600000;
    if (hoursSince < 24) {
      const canSpinAgainAt = new Date(user.lastSpinAt.getTime() + 24 * 3600 * 1000);
      const hoursRemaining = 24 - hoursSince;
      res.status(429).json({
        canSpinAgainAt: canSpinAgainAt.toISOString(),
        hoursRemaining: Math.round(hoursRemaining * 10) / 10,
      });
      return;
    }
  }

  const segmentIndex = weightedRandom();
  const segment = SPIN_SEGMENTS[segmentIndex];

  // Streak bonus: +10% coins per streak day (max 50%)
  const streakBonus = segment.prizeType === "coins"
    ? Math.floor(segment.coinsEarned * Math.min(user.streakCount * 0.1, 0.5))
    : 0;

  const totalCoins = segment.coinsEarned + streakBonus;

  const updated = await db
    .update(usersTable)
    .set({
      lastSpinAt: now,
      coins: totalCoins > 0 ? sql`${usersTable.coins} + ${totalCoins}` : usersTable.coins,
    })
    .where(eq(usersTable.telegramId, telegramId))
    .returning();

  // Grant jackpot achievement
  if (segment.prizeType === "jackpot") {
    const existing = await db.query.achievementsTable.findFirst({
      where: (t, { and }) =>
        and(eq(t.userTelegramId, telegramId), eq(t.achievementKey, "jackpot")),
    });
    if (!existing) {
      await db.insert(achievementsTable).values({
        userTelegramId: telegramId,
        achievementKey: "jackpot",
      });
    }
  }

  // Grant coin_collector achievement
  const newTotal = Number(updated[0]?.coins ?? 0);
  if (newTotal >= 1000) {
    const existing = await db.query.achievementsTable.findFirst({
      where: (t, { and }) =>
        and(eq(t.userTelegramId, telegramId), eq(t.achievementKey, "coin_collector")),
    });
    if (!existing) {
      await db.insert(achievementsTable).values({
        userTelegramId: telegramId,
        achievementKey: "coin_collector",
      });
    }
  }

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

export default router;
