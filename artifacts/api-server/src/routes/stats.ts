import { Router } from "express";
import { sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getOnlineCount } from "./users";

const router = Router();

// GET /stats/online — live online player count + totals
router.get("/stats/online", async (_req, res): Promise<void> => {
  const online = getOnlineCount();

  const totals = await db
    .select({
      totalPlayers: sql<number>`count(*)`,
      totalCoins: sql<number>`coalesce(sum(${usersTable.coins}::numeric), 0)`,
    })
    .from(usersTable);

  res.json({
    onlineCount: Math.max(online, 1), // minimum 1 when server is alive
    totalPlayers: Number(totals[0]?.totalPlayers ?? 0),
    totalCoinsInCirculation: Number(totals[0]?.totalCoins ?? 0),
  });
});

export default router;
