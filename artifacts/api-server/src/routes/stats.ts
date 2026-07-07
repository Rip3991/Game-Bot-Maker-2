import { Router } from "express";
import { sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getOnlineCount } from "./users";

const router = Router();

/**
 * Fake online count based on total registered players.
 * Shows ~40–70% of total users as "online", drifting naturally.
 */
function getFakeOnlineCount(totalPlayers: number): number {
  if (totalPlayers <= 0) return 1;
  const now = Date.now();
  // Slow primary wave — cycle every ~7 minutes
  const wave1 = Math.sin((now / 1000 / 420) * 2 * Math.PI);
  // Irregular secondary wave — cycle every ~2.3 minutes
  const wave2 = Math.sin((now / 1000 / 139) * 2 * Math.PI);
  // Per-request jitter
  const jitter = Math.random() * 2 - 1;

  // Target range: 40%–70% of total, centred at ~55%
  const center = totalPlayers * 0.55;
  const spread = totalPlayers * 0.15;
  const raw = center + wave1 * spread * 0.7 + wave2 * spread * 0.3 + jitter;

  const lo = Math.max(1, Math.round(totalPlayers * 0.40));
  const hi = Math.round(totalPlayers * 0.70);
  return Math.round(Math.max(lo, Math.min(hi, raw)));
}

// GET /stats/online — live online player count + totals
router.get("/stats/online", async (_req, res): Promise<void> => {
  const real = getOnlineCount();

  const totals = await db
    .select({
      totalPlayers: sql<number>`count(*)`,
      totalCoins: sql<number>`coalesce(sum(${usersTable.coins}::numeric), 0)`,
    })
    .from(usersTable);

  const totalPlayers = Number(totals[0]?.totalPlayers ?? 0);
  const onlineCount = Math.max(real, getFakeOnlineCount(totalPlayers));

  res.json({
    onlineCount,
    totalPlayers,
    totalCoinsInCirculation: Number(totals[0]?.totalCoins ?? 0),
  });
});

export default router;
