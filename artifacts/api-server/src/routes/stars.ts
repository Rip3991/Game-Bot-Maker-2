import { Router } from "express";
import { eq, sql, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getBotToken } from "../lib/telegram";
import { mintFreeNftFromCase } from "./nfts";

const router = Router();

// ── Stars → Coins packages (players pay real Stars, get in-game Coins) ──────
export const COIN_PACKAGES = [
  { id: "starter",  stars: 15,  coins: 150,  label: "Başlangıç",  bonus: "",           popular: false },
  { id: "popular",  stars: 50,  coins: 600,  label: "Popüler",    bonus: "+%20 Bonus",  popular: true  },
  { id: "value",    stars: 100, coins: 1350, label: "Avantajlı",  bonus: "+%35 Bonus",  popular: false },
  { id: "legend",   stars: 250, coins: 3750, label: "Efsane",     bonus: "+%50 Bonus",  popular: false },
] as const;

export type CoinPackageId = (typeof COIN_PACKAGES)[number]["id"];

// ── Coin Shop items (spend Coins on in-game rewards) ──────────────────────────
export const COIN_SHOP_ITEMS = [
  { id: "extra_spin", coins: 20,  emoji: "🎡", label: "Ekstra Çark Hakkı",   desc: "Çark bekleme süresini sıfırla",      action: "reset_spin"              },
  { id: "tl_mini",    coins: 30,  emoji: "💰", label: "Mini TL Bonusu",      desc: "+500 TL anında bakiyene eklenir",    action: "add_tl",  value: 500   },
  { id: "tl_big",     coins: 80,  emoji: "🏆", label: "Büyük TL Bonusu",     desc: "+2.000 TL anında bakiyene eklenir",  action: "add_tl",  value: 2000  },
  { id: "nft_case",   coins: 120, emoji: "💎", label: "Ücretsiz NFT Kasası", desc: "Rastgele bir Çiftlik Kasası açılır", action: "open_case"               },
  { id: "tl_ultra",   coins: 200, emoji: "🚀", label: "Ultra TL Paketi",     desc: "+6.000 TL anında bakiyene eklenir",  action: "add_tl",  value: 6000  },
] as const;

export type CoinShopItemId = (typeof COIN_SHOP_ITEMS)[number]["id"];

// ── GET /stars/coin-packages ───────────────────────────────────────────────────
router.get("/stars/coin-packages", (_req, res) => {
  res.json(COIN_PACKAGES);
});

// ── GET /stars/coin-shop ───────────────────────────────────────────────────────
router.get("/stars/coin-shop", (_req, res) => {
  res.json(COIN_SHOP_ITEMS);
});

// ── POST /stars/buy-coins — create Telegram Stars invoice ─────────────────────
// Coins are NOT awarded here — they are granted in the webhook successful_payment handler.
router.post("/stars/buy-coins", async (req, res): Promise<void> => {
  const { telegramId, packageId } = req.body as { telegramId?: string; packageId?: string };

  if (!telegramId || !packageId) {
    res.status(400).json({ error: "telegramId and packageId are required" });
    return;
  }

  const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    res.status(400).json({ error: "Geçersiz paket" });
    return;
  }

  const token = getBotToken();

  if (!token) {
    // Dev mode: grant coins immediately without real payment
    await db
      .update(usersTable)
      .set({ coins: sql`${usersTable.coins} + ${pkg.coins}` })
      .where(eq(usersTable.telegramId, telegramId));
    res.json({ success: true, invoiceLink: null, devMode: true, coinsGranted: pkg.coins });
    return;
  }

  let invoiceData: { ok: boolean; result?: string; description?: string };
  try {
    const invoiceRes = await fetch(
      `https://api.telegram.org/bot${token}/createInvoiceLink`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${pkg.coins} Coin`,
          description: `${pkg.label} paketi — ${pkg.coins} Coin kazan!${pkg.bonus ? ` (${pkg.bonus})` : ""}`,
          // Encode: buycoins_{packageId}_{telegramId}
          payload: `buycoins_${packageId}_${telegramId}`,
          currency: "XTR",
          prices: [{ label: `${pkg.coins} Coin`, amount: pkg.stars }],
        }),
      },
    );
    invoiceData = (await invoiceRes.json()) as { ok: boolean; result?: string; description?: string };
  } catch {
    res.status(502).json({ error: "Telegram bağlantı hatası" });
    return;
  }

  if (!invoiceData.ok || !invoiceData.result) {
    res.status(502).json({ error: invoiceData.description ?? "Fatura oluşturulamadı" });
    return;
  }

  res.json({ success: true, invoiceLink: invoiceData.result, coinsToGrant: pkg.coins });
});

// ── POST /stars/coin-shop/buy — spend Coins atomically on a shop item ─────────
router.post("/stars/coin-shop/buy", async (req, res): Promise<void> => {
  const { telegramId, itemId } = req.body as { telegramId?: string; itemId?: string };

  if (!telegramId || !itemId) {
    res.status(400).json({ error: "telegramId and itemId are required" });
    return;
  }

  const item = COIN_SHOP_ITEMS.find((i) => i.id === itemId);
  if (!item) {
    res.status(400).json({ error: "Geçersiz item" });
    return;
  }

  // ── Atomic conditional coin deduction ────────────────────────────────────
  // Single UPDATE with WHERE coins >= cost — prevents race conditions and
  // negative-balance exploits without a separate SELECT.
  const deducted = await db
    .update(usersTable)
    .set({ coins: sql`${usersTable.coins} - ${item.coins}` })
    .where(
      and(
        eq(usersTable.telegramId, telegramId),
        sql`${usersTable.coins} >= ${item.coins}`,
      ),
    )
    .returning({ coins: usersTable.coins });

  if (deducted.length === 0) {
    const exists = await db.query.usersTable.findFirst({
      where: eq(usersTable.telegramId, telegramId),
      columns: { telegramId: true },
    });
    res.status(exists ? 400 : 404).json({
      error: exists ? "Yetersiz Coin bakiyesi" : "Kullanıcı bulunamadı",
    });
    return;
  }

  // ── Apply reward (with refund on failure) ────────────────────────────────
  let extra: Record<string, unknown> = {};

  try {
    if (item.action === "reset_spin") {
      await db
        .update(usersTable)
        .set({ lastSpinAt: null })
        .where(eq(usersTable.telegramId, telegramId));
      extra = { spinReset: true };
    }

    if (item.action === "add_tl" && "value" in item) {
      const tlAmount = (item as typeof item & { value: number }).value;
      await db
        .update(usersTable)
        .set({ balance: sql`${usersTable.balance} + ${tlAmount}` })
        .where(eq(usersTable.telegramId, telegramId));
      extra = { tlAdded: tlAmount };
    }

    if (item.action === "open_case") {
      const nft = await mintFreeNftFromCase(telegramId, "farm_case");
      extra = { nftWon: nft };
    }
  } catch {
    // Reward failed — refund coins to keep economy consistent
    await db
      .update(usersTable)
      .set({ coins: sql`${usersTable.coins} + ${item.coins}` })
      .where(eq(usersTable.telegramId, telegramId));
    res.status(500).json({ error: "İşlem başarısız, Coin iade edildi" });
    return;
  }

  const updated = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
    columns: { coins: true, balance: true },
  });

  res.json({
    success: true,
    itemId,
    coinsSpent: item.coins,
    newCoins: Number(updated?.coins ?? 0),
    newBalance: Number(updated?.balance ?? 0),
    ...extra,
  });
});

export default router;
