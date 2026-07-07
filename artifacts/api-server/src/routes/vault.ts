import { Router } from "express";
import { eq, desc, and, sql, lt } from "drizzle-orm";
import { db, usersTable, vaultDepositsTable } from "@workspace/db";
import crypto from "crypto";

const router = Router();

const VAULT_OPTIONS = [
  { days: 3,  multiplier: 1.10 },
  { days: 7,  multiplier: 1.25 },
  { days: 14, multiplier: 1.50 },
  { days: 30, multiplier: 2.00 },
] as const;

const MIN_DEPOSIT = 100; // coins

// POST /vault/deposit
router.post("/deposit", async (req, res): Promise<void> => {
  const { telegramId, coins, lockDays } = req.body as {
    telegramId: string;
    coins: number;
    lockDays: number;
  };

  if (!telegramId || typeof coins !== "number" || typeof lockDays !== "number") {
    res.status(400).json({ error: "telegramId, coins, lockDays required" });
    return;
  }

  if (coins < MIN_DEPOSIT) {
    res.status(400).json({ error: `Minimum deposit is ${MIN_DEPOSIT} coins` });
    return;
  }

  const option = VAULT_OPTIONS.find(o => o.days === lockDays);
  if (!option) {
    res.status(400).json({ error: "Invalid lockDays. Choose 3, 7, 14, or 30" });
    return;
  }

  const coinsToReceive = Math.floor(coins * option.multiplier);

  // Deduct coins atomically (only if user has enough)
  const updated = await db
    .update(usersTable)
    .set({ coins: sql`${usersTable.coins} - ${coins}` })
    .where(
      and(
        eq(usersTable.telegramId, telegramId),
        sql`${usersTable.coins} >= ${coins}`,
      ),
    )
    .returning({ coins: usersTable.coins });

  if (!updated[0]) {
    res.status(400).json({ error: "Insufficient coins" });
    return;
  }

  const maturesAt = new Date(Date.now() + lockDays * 24 * 3600 * 1000);
  const id = crypto.randomUUID();

  await db.insert(vaultDepositsTable).values({
    id,
    userTelegramId: telegramId,
    coinsDeposited: coins.toString(),
    lockDays,
    multiplier: option.multiplier.toString(),
    coinsToReceive: coinsToReceive.toString(),
    maturesAt,
    status: "locked",
  });

  res.json({
    id,
    coinsDeposited: coins,
    coinsToReceive,
    multiplier: option.multiplier,
    maturesAt: maturesAt.toISOString(),
    lockDays,
  });
});

// GET /vault/:telegramId
router.get("/:telegramId", async (req, res): Promise<void> => {
  const { telegramId } = req.params;
  const now = new Date();

  // Mature locked deposits that have passed their maturity date
  await db
    .update(vaultDepositsTable)
    .set({ status: "mature" })
    .where(
      and(
        eq(vaultDepositsTable.userTelegramId, telegramId),
        eq(vaultDepositsTable.status, "locked"),
        lt(vaultDepositsTable.maturesAt, now),
      ),
    );

  const deposits = await db.query.vaultDepositsTable.findMany({
    where: eq(vaultDepositsTable.userTelegramId, telegramId),
    orderBy: [desc(vaultDepositsTable.createdAt)],
    limit: 50,
  });

  res.json(
    deposits.map(d => ({
      id: d.id,
      coinsDeposited: Number(d.coinsDeposited),
      coinsToReceive: Number(d.coinsToReceive),
      multiplier: Number(d.multiplier),
      lockDays: d.lockDays,
      maturesAt: d.maturesAt.toISOString(),
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
  );
});

// POST /vault/claim
router.post("/claim", async (req, res): Promise<void> => {
  const { telegramId, depositId } = req.body as {
    telegramId: string;
    depositId: string;
  };

  if (!telegramId || !depositId) {
    res.status(400).json({ error: "telegramId and depositId required" });
    return;
  }

  // Verify the deposit belongs to user and is mature
  const deposit = await db.query.vaultDepositsTable.findFirst({
    where: and(
      eq(vaultDepositsTable.id, depositId),
      eq(vaultDepositsTable.userTelegramId, telegramId),
    ),
  });

  if (!deposit) {
    res.status(404).json({ error: "Deposit not found" });
    return;
  }

  // Auto-mature if time has passed (handle edge case)
  const now = new Date();
  const isMature = deposit.status === "mature" || deposit.maturesAt <= now;

  if (!isMature) {
    const hoursLeft = Math.ceil((deposit.maturesAt.getTime() - now.getTime()) / 3600000);
    res.status(400).json({ error: `Deposit matures in ${hoursLeft} hours` });
    return;
  }

  if (deposit.status === "claimed") {
    res.status(400).json({ error: "Already claimed" });
    return;
  }

  const coinsToReceive = Number(deposit.coinsToReceive);

  // Credit coins + mark claimed atomically
  const [, userRow] = await Promise.all([
    db
      .update(vaultDepositsTable)
      .set({ status: "claimed", claimedAt: now })
      .where(eq(vaultDepositsTable.id, depositId)),
    db
      .update(usersTable)
      .set({ coins: sql`${usersTable.coins} + ${coinsToReceive}` })
      .where(eq(usersTable.telegramId, telegramId))
      .returning({ coins: usersTable.coins }),
  ]);

  res.json({
    coinsReceived: coinsToReceive,
    newCoinTotal: Number(userRow[0]?.coins ?? 0),
  });
});

export default router;
