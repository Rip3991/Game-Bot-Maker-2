import { Router } from "express";
import { sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getOnlineCount } from "./users";

const router = Router();

/**
 * Realistic-looking fake online count.
 * Drifts slowly with a sine wave (5-min period) + small per-request noise,
 * so it looks like real users joining/leaving naturally.
 * Range: 14–22, centred around 17–18.
 */
function getFakeOnlineCount(): number {
  const now = Date.now();
  // Slow sine wave — full cycle every ~5 minutes
  const wave = Math.sin((now / 1000 / 300) * 2 * Math.PI);
  // Second harmonic for irregularity
  const wave2 = Math.sin((now / 1000 / 113) * 2 * Math.PI);
  // Small random jitter (changes each request)
  const jitter = Math.random() * 2 - 1;

  const base = 17 + wave * 3 + wave2 * 1.5 + jitter;
  return Math.round(Math.max(14, Math.min(22, base)));
}

// GET /stats/online — live online player count + totals
router.get("/stats/online", async (_req, res): Promise<void> => {
  const real = getOnlineCount();
  // Use whichever is higher so real users are never hidden
  const onlineCount = Math.max(real, getFakeOnlineCount());

  const totals = await db
    .select({
      totalPlayers: sql<number>`count(*)`,
      totalCoins: sql<number>`coalesce(sum(${usersTable.coins}::numeric), 0)`,
    })
    .from(usersTable);

  res.json({
    onlineCount,
    totalPlayers: Number(totals[0]?.totalPlayers ?? 0),
    totalCoinsInCirculation: Number(totals[0]?.totalCoins ?? 0),
  });
});

export default router;
