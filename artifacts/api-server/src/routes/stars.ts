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
// NOTE: the old tl_mini/tl_big/tl_ultra "instant TL bonus" items were removed —
// they paid out 500-6,000 TL for as little as 30-200 Coins (a few Telegram
// Stars' worth), which meant the house lost real money on every use. Coins can
// still be turned into TL through the dedicated, margin-safe converter below
// (see COIN_TO_TL_RATE / POST /stars/convert-coins-to-tl).
export const COIN_SHOP_ITEMS = [
  { id: "extra_spin", coins: 20,  emoji: "🎡", label: "Ekstra Çark Hakkı",   desc: "Çark bekleme süresini sıfırla",                   action: "reset_spin"     },
  { id: "auto_sell",  coins: 75,  emoji: "🤖", label: "Otomatik Satış",      desc: "Ürünler 30 sn'de bir otomatik satılır — kalıcı!", action: "unlock_auto_sell" },
  { id: "nft_case",   coins: 500, emoji: "💎", label: "Ücretsiz NFT Kasası", desc: "Rastgele bir Çiftlik Kasası açılır (Yaygın eşya)", action: "open_case"      },
] as const;

export type CoinShopItemId = (typeof COIN_SHOP_ITEMS)[number]["id"];

// ── Coin → TL conversion (the safe, margin-aware alternative to fixed TL items) ─
//
// Rate set per operator request: 1.000 Coin ≈ 50 TL.
//
// ⚠️ ECONOMICS WARNING: at this rate, a user who buys the cheapest Coin package
// (Efsane: 250 Stars → 3.750 Coins, 15 Coins/Star) and immediately converts gets
// 3.750 × 0.05 = 187,5 TL for 250 Stars — i.e. you need to net at least ~0,75 TL
// per Star just to break even on that path (and more than that to keep any
// margin). If your real net TL-per-Star (after Telegram's cut) is lower than
// that, the house loses money on every purchase→convert cycle, same as the old
// tl_ultra item. Please confirm your real net-per-Star figure and adjust
// COIN_TO_TL_RATE below if needed — it's the single number driving this feature.
export const COIN_TO_TL_RATE = 0.05; // TL per Coin (1.000 Coin = 50 TL)
export const MIN_COIN_CONVERT = 500; // smallest amount convertible in one go

// ── GET /stars/coin-convert-rate ────────────────────────────────────────────
router.get("/stars/coin-convert-rate", (_req, res) => {
  res.json({ rate: COIN_TO_TL_RATE, minCoins: MIN_COIN_CONVERT });
});

// ── POST /stars/convert-coins-to-tl — turn Coins into withdrawable TL balance ─
router.post("/stars/convert-coins-to-tl", async (req, res): Promise<void> => {
  const { telegramId, coins } = req.body as { telegramId?: string; coins?: number };

  if (
    !telegramId ||
    typeof coins !== "number" ||
    !Number.isFinite(coins) ||
    coins <= 0 ||
    coins > Number.MAX_SAFE_INTEGER
  ) {
    res.status(400).json({ error: "telegramId ve geçerli bir coins değeri gerekli" });
    return;
  }

  const coinsToConvert = Math.floor(coins);
  if (coinsToConvert < MIN_COIN_CONVERT) {
    res.status(400).json({ error: `En az ${MIN_COIN_CONVERT} Coin çevirebilirsin` });
    return;
  }

  const tlToCredit = Math.floor(coinsToConvert * COIN_TO_TL_RATE * 100) / 100;

  const deducted = await db
    .update(usersTable)
    .set({
      coins: sql`${usersTable.coins} - ${coinsToConvert}`,
      balance: sql`${usersTable.balance} + ${tlToCredit}`,
    })
    .where(
      and(
        eq(usersTable.telegramId, telegramId),
        sql`${usersTable.coins} >= ${coinsToConvert}`,
      ),
    )
    .returning({ coins: usersTable.coins, balance: usersTable.balance });

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

  res.json({
    success: true,
    coinsConverted: coinsToConvert,
    tlReceived: tlToCredit,
    newCoins: Number(deducted[0].coins),
    newBalance: Number(deducted[0].balance),
  });
});

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

    if (item.action === "open_case") {
      const nft = await mintFreeNftFromCase(telegramId, "farm_case");
      extra = { nftWon: nft };
    }

    if (item.action === "unlock_auto_sell") {
      extra = { autoSellUnlocked: true };
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
