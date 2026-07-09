import { Router } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
import { db, usersTable, withdrawalsTable, achievementsTable } from "@workspace/db";
import { RequestWithdrawalBody } from "@workspace/api-zod";
import crypto from "crypto";

const router = Router();

// Tiered withdrawal amounts — lets users cash out smaller wins sooner while
// keeping a meaningful ceiling per request.
export const ALLOWED_WITHDRAW_AMOUNTS = [350, 500, 750] as const;
const MIN_ACCOUNT_AGE_DAYS_FOR_FIRST_WITHDRAW = 3;

// POST /withdraw/request
router.post("/withdraw/request", async (req, res): Promise<void> => {
  const parsed = RequestWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: `Geçersiz istek. Seçenekler: ${ALLOWED_WITHDRAW_AMOUNTS.join(" / ")} TL` });
    return;
  }

  const { telegramId, amount, method } = parsed.data;

  // Enforce tiered amounts explicitly (generated schema has no enum)
  if (!ALLOWED_WITHDRAW_AMOUNTS.includes(amount as typeof ALLOWED_WITHDRAW_AMOUNTS[number])) {
    res.status(400).json({ error: `Tutar şu seçeneklerden biri olmalı: ${ALLOWED_WITHDRAW_AMOUNTS.join(" / ")} TL` });
    return;
  }

  const validMethods = ["papara", "iban", "crypto"];
  if (!validMethods.includes(method)) {
    res.status(400).json({ error: "Geçersiz ödeme yöntemi" });
    return;
  }

  // Anti-fraud: first-ever withdrawal requires the account to be active for a
  // minimum number of days — deters throwaway/bot accounts from cashing out instantly.
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
    columns: { createdAt: true },
  });
  if (!user) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
    return;
  }

  const hasAnyPriorWithdrawal = await db.query.withdrawalsTable.findFirst({
    where: eq(withdrawalsTable.userTelegramId, telegramId),
  });
  if (!hasAnyPriorWithdrawal) {
    const accountAgeDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (accountAgeDays < MIN_ACCOUNT_AGE_DAYS_FOR_FIRST_WITHDRAW) {
      res.status(400).json({
        error: `İlk çekim için hesabın en az ${MIN_ACCOUNT_AGE_DAYS_FOR_FIRST_WITHDRAW} gündür aktif olması gerekiyor. Biraz daha bekle 🙂`,
      });
      return;
    }
  }

  // Run everything in a single transaction for atomicity
  let newBalance: number;
  let requestId: string;

  try {
    await db.transaction(async (tx) => {
      // Check for already-pending withdrawal (filter by status=pending to avoid
      // blocking user forever after any past withdrawal)
      const pending = await tx.query.withdrawalsTable.findFirst({
        where: and(
          eq(withdrawalsTable.userTelegramId, telegramId),
          eq(withdrawalsTable.status, "pending"),
        ),
      });

      if (pending) {
        throw new Error("PENDING_EXISTS");
      }

      // Conditionally deduct balance in SQL — guards against race conditions
      // (only succeeds if balance is still sufficient at the moment of update)
      const updated = await tx
        .update(usersTable)
        .set({ balance: sql`${usersTable.balance} - ${amount}` })
        .where(
          and(
            eq(usersTable.telegramId, telegramId),
            sql`${usersTable.balance} >= ${amount}`,
          ),
        )
        .returning({ balance: usersTable.balance });

      if (!updated[0]) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      newBalance = Number(updated[0].balance);
      requestId = crypto.randomUUID();

      await tx.insert(withdrawalsTable).values({
        id: requestId,
        userTelegramId: telegramId,
        amount: amount.toString(),
        method,
        status: "pending",
      });
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "UNKNOWN";
    if (msg === "PENDING_EXISTS") {
      res.status(400).json({ error: "Bekleyen bir çekim talebiniz var. İşlenene kadar bekleyin." });
    } else if (msg === "INSUFFICIENT_BALANCE") {
      res.status(400).json({ error: `Yetersiz bakiye. Seçtiğin tutar: ${amount} TL` });
    } else {
      res.status(500).json({ error: "İşlem sırasında bir hata oluştu" });
    }
    return;
  }

  // Grant first_withdraw achievement (outside transaction — non-critical)
  const existingAch = await db.query.achievementsTable.findFirst({
    where: and(
      eq(achievementsTable.userTelegramId, telegramId),
      eq(achievementsTable.achievementKey, "first_withdraw"),
    ),
  });
  if (!existingAch) {
    await db.insert(achievementsTable).values({
      userTelegramId: telegramId,
      achievementKey: "first_withdraw",
    }).onConflictDoNothing();
  }

  res.json({
    success: true,
    requestId: requestId!,
    amount,
    status: "pending",
    message: `${amount} TL çekim talebiniz alındı. 24 saat içinde işleme alınacaktır.`,
    newBalance: newBalance!,
  });
});

// GET /withdraw/history/:telegramId
router.get("/withdraw/history/:telegramId", async (req, res): Promise<void> => {
  const telegramId = Array.isArray(req.params.telegramId)
    ? req.params.telegramId[0]
    : req.params.telegramId;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
    columns: { telegramId: true },
  });
  if (!user) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
    return;
  }

  const history = await db.query.withdrawalsTable.findMany({
    where: eq(withdrawalsTable.userTelegramId, telegramId),
    orderBy: [desc(withdrawalsTable.createdAt)],
    limit: 20,
  });

  res.json(
    history.map((w) => ({
      id: w.id,
      amount: Number(w.amount),
      method: w.method,
      status: w.status,
      createdAt: w.createdAt.toISOString(),
    })),
  );
});

export default router;
