import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

const router = Router();

const ADMIN_KEY = process.env.ADMIN_KEY ?? "sariadmin2024";

function getAdminIds(): string[] {
  return (process.env.ADMIN_TELEGRAM_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

function isAdminTelegramId(id?: string): boolean {
  if (!id) return false;
  return getAdminIds().includes(id);
}

function checkAdmin(req: any, res: any): boolean {
  const key = req.headers["x-admin-key"] ?? req.query.key;
  const tgId = req.headers["x-telegram-id"] as string | undefined;
  if (key !== ADMIN_KEY && !isAdminTelegramId(tgId)) {
    res.status(401).json({ error: "Yetkisiz erişim" });
    return false;
  }
  return true;
}

// GET /admin/auth-check — verify admin access by telegram ID (no password needed for admin IDs)
router.get("/admin/auth-check", (req, res): void => {
  const tgId = req.headers["x-telegram-id"] as string | undefined;
  if (isAdminTelegramId(tgId)) {
    res.json({ isAdmin: true });
  } else {
    res.status(401).json({ isAdmin: false });
  }
});

// GET /admin/users — list all users
router.get("/admin/users", async (req, res): Promise<void> => {
  if (!checkAdmin(req, res)) return;
  const users = await db
    .select({
      telegramId: usersTable.telegramId,
      firstName: usersTable.firstName,
      username: usersTable.username,
      balance: usersTable.balance,
      coins: usersTable.coins,
      streakCount: usersTable.streakCount,
      totalReferrals: usersTable.totalReferrals,
      createdAt: usersTable.createdAt,
      lastLoginAt: usersTable.lastLoginAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.lastLoginAt))
    .limit(200);
  res.json(users);
});

// POST /admin/add-balance — add TL balance to a user
router.post("/admin/add-balance", async (req, res): Promise<void> => {
  if (!checkAdmin(req, res)) return;
  const { telegramId, amount, note } = req.body;
  if (!telegramId || typeof amount !== "number" || amount <= 0) {
    res.status(400).json({ error: "telegramId ve pozitif amount gerekli" });
    return;
  }
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
  });
  if (!user) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
    return;
  }
  const updated = await db
    .update(usersTable)
    .set({ balance: sql`${usersTable.balance} + ${amount}` })
    .where(eq(usersTable.telegramId, telegramId))
    .returning();
  res.json({
    success: true,
    telegramId,
    addedAmount: amount,
    newBalance: Number(updated[0].balance),
    note: note ?? "",
  });
});

// POST /admin/add-coins — add coins to a user
router.post("/admin/add-coins", async (req, res): Promise<void> => {
  if (!checkAdmin(req, res)) return;
  const { telegramId, amount } = req.body;
  if (!telegramId || typeof amount !== "number" || amount <= 0) {
    res.status(400).json({ error: "telegramId ve pozitif amount gerekli" });
    return;
  }
  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
  });
  if (!user) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
    return;
  }
  const updated = await db
    .update(usersTable)
    .set({ coins: sql`${usersTable.coins} + ${amount}` })
    .where(eq(usersTable.telegramId, telegramId))
    .returning();
  res.json({
    success: true,
    telegramId,
    addedAmount: amount,
    newCoins: Number(updated[0].coins),
  });
});

export default router;
