import { Router } from "express";
import { desc } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router = Router();

// GET /leaderboard
router.get("/leaderboard", async (req, res): Promise<void> => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) ?? "20", 10), 50);

    const users = await db
      .select()
      .from(usersTable)
      .orderBy(desc(usersTable.coins))
      .limit(limit);

    const entries = users.map((user, i) => ({
      rank: i + 1,
      telegramId: user.telegramId,
      firstName: user.firstName,
      username: user.username ?? null,
      coins: Number(user.coins),
      totalReferrals: user.totalReferrals,
      streakCount: user.streakCount,
    }));

    res.json(entries);
  } catch (err) {
    req.log.error({ err }, "leaderboard fetch failed");
    res.status(500).json({ error: "Sıralama yüklenemedi" });
  }
});

export default router;
