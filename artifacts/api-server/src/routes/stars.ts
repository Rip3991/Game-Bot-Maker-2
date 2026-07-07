import { Router } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { PurchaseStarsBody } from "@workspace/api-zod";

const router = Router();

const STAR_PACKAGES = [
  { id: "starter", stars: 50, coinsRequired: 500, label: "Başlangıç", popular: false },
  { id: "popular", stars: 110, coinsRequired: 1000, label: "Popüler", popular: true },
  { id: "value", stars: 300, coinsRequired: 2500, label: "Avantajlı", popular: false },
  { id: "premium", stars: 650, coinsRequired: 5000, label: "Premium", popular: false },
];

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// GET /stars/packages
router.get("/stars/packages", async (_req, res): Promise<void> => {
  res.json(STAR_PACKAGES);
});

// POST /stars/purchase
router.post("/stars/purchase", async (req, res): Promise<void> => {
  const parsed = PurchaseStarsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { telegramId, packageId } = parsed.data;

  const pkg = STAR_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    res.status(400).json({ error: "Invalid package" });
    return;
  }

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
    columns: { coins: true },
  });

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (Number(user.coins) < pkg.coinsRequired) {
    res.status(400).json({ error: "Yetersiz coin bakiyesi" });
    return;
  }

  // Step 1: Create the Telegram invoice FIRST — before touching coins
  let invoiceLink = "";
  if (BOT_TOKEN) {
    let invoiceData: { ok: boolean; result?: string };
    try {
      const invoiceRes = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${pkg.stars} Telegram Stars`,
            description: `${pkg.label} paketi — ${pkg.stars} Telegram Stars`,
            payload: `stars_${packageId}_${telegramId}`,
            currency: "XTR",
            prices: [{ label: `${pkg.stars} Stars`, amount: pkg.stars }],
          }),
        },
      );
      invoiceData = (await invoiceRes.json()) as { ok: boolean; result?: string };
    } catch (networkErr) {
      res.status(502).json({ error: "Telegram bağlantı hatası" });
      return;
    }

    // Strict validation — both ok AND result must be present
    if (!invoiceData.ok || !invoiceData.result) {
      res.status(502).json({ error: "Fatura oluşturulamadı" });
      return;
    }
    invoiceLink = invoiceData.result;
  } else {
    // Dev mode
    invoiceLink = `https://t.me/invoice/demo_${packageId}_${Date.now()}`;
  }

  // Step 2: Invoice confirmed — now atomically deduct coins
  const updated = await db
    .update(usersTable)
    .set({ coins: sql`${usersTable.coins} - ${pkg.coinsRequired}` })
    .where(eq(usersTable.telegramId, telegramId))
    .returning({ coins: usersTable.coins });

  if (!updated[0]) {
    res.status(404).json({ error: "User not found during deduction" });
    return;
  }

  res.json({
    success: true,
    invoiceLink,
    starsAwarded: pkg.stars,
    coinsSpent: pkg.coinsRequired,
    newCoinsTotal: Number(updated[0].coins),
  });
});

export default router;
