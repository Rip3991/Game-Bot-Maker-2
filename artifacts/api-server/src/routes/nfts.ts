import { Router } from "express";
import { eq, desc, and, isNull, or, sql, isNotNull } from "drizzle-orm";
import { db, usersTable, nftsTable, nftTradeOffersTable } from "@workspace/db";
import crypto from "crypto";

const router = Router();

// ── 60 NFT Definitions ──────────────────────────────────────────────────────

export const NFT_DEFS = {
  // ─── SIRADAN (Common) ────────────────────────────────────────────────────
  wheat_seed:      { emoji: "🌾", name: "Buğday Tohumu",       rarity: "common" as const,    mintLimit: 50000, sellPrice: 80,   bg: "#4a5568" },
  corn_cob:        { emoji: "🌽", name: "Mısır Koçanı",         rarity: "common" as const,    mintLimit: 45000, sellPrice: 90,   bg: "#4a5568" },
  tomato_vine:     { emoji: "🍅", name: "Domates Dalı",         rarity: "common" as const,    mintLimit: 40000, sellPrice: 110,  bg: "#4a5568" },
  carrot_fresh:    { emoji: "🥕", name: "Taze Havuç",           rarity: "common" as const,    mintLimit: 40000, sellPrice: 100,  bg: "#4a5568" },
  sunflower_seed:  { emoji: "🌻", name: "Ayçiçeği Tohumu",      rarity: "common" as const,    mintLimit: 38000, sellPrice: 120,  bg: "#4a5568" },
  red_apple:       { emoji: "🍎", name: "Kırmızı Elma",         rarity: "common" as const,    mintLimit: 36000, sellPrice: 130,  bg: "#4a5568" },
  cabbage_head:    { emoji: "🥬", name: "Taze Lahana",          rarity: "common" as const,    mintLimit: 35000, sellPrice: 95,   bg: "#4a5568" },
  herb_bunch:      { emoji: "🌿", name: "Şifalı Ot Demeti",     rarity: "common" as const,    mintLimit: 33000, sellPrice: 140,  bg: "#4a5568" },
  wild_mushroom:   { emoji: "🍄", name: "Yabani Mantar",        rarity: "common" as const,    mintLimit: 30000, sellPrice: 160,  bg: "#4a5568" },
  chicken_feather: { emoji: "🪶", name: "Tavuk Tüyü",           rarity: "common" as const,    mintLimit: 28000, sellPrice: 115,  bg: "#4a5568" },
  farm_egg:        { emoji: "🥚", name: "Çiftlik Yumurtası",    rarity: "common" as const,    mintLimit: 26000, sellPrice: 135,  bg: "#4a5568" },
  honey_pot:       { emoji: "🍯", name: "Bal Kovası",           rarity: "common" as const,    mintLimit: 24000, sellPrice: 200,  bg: "#4a5568" },
  seedling:        { emoji: "🌱", name: "Küçük Fide",           rarity: "common" as const,    mintLimit: 22000, sellPrice: 85,   bg: "#4a5568" },
  farm_stone:      { emoji: "🪨", name: "Çiftlik Taşı",         rarity: "common" as const,    mintLimit: 20000, sellPrice: 70,   bg: "#4a5568" },
  bamboo_shoot:    { emoji: "🎋", name: "Bambu Filizi",         rarity: "common" as const,    mintLimit: 18000, sellPrice: 130,  bg: "#4a5568" },
  flower_pot:      { emoji: "🪴", name: "Çiçek Saksısı",        rarity: "common" as const,    mintLimit: 16000, sellPrice: 110,  bg: "#4a5568" },
  rust_key:        { emoji: "🔑", name: "Paslı Anahtar",        rarity: "common" as const,    mintLimit: 15000, sellPrice: 160,  bg: "#4a5568" },
  farm_deed:       { emoji: "📜", name: "Çiftlik Belgesi",       rarity: "common" as const,    mintLimit: 14000, sellPrice: 180,  bg: "#4a5568" },
  wooden_bucket:   { emoji: "🪣", name: "Ahşap Kova",           rarity: "common" as const,    mintLimit: 13000, sellPrice: 130,  bg: "#4a5568" },
  farm_lantern:    { emoji: "🏮", name: "Çiftlik Feneri",        rarity: "common" as const,    mintLimit: 12000, sellPrice: 220,  bg: "#4a5568" },

  // ─── NADİR (Rare) ────────────────────────────────────────────────────────
  sapphire_stone:  { emoji: "💎", name: "Safir Taş",            rarity: "rare" as const,      mintLimit: 5000,  sellPrice: 1500, bg: "#1e3a5f" },
  silver_moon:     { emoji: "🌙", name: "Gümüş Ay Parçası",     rarity: "rare" as const,      mintLimit: 4500,  sellPrice: 1800, bg: "#1e3a5f" },
  crystal_butterfly:{ emoji:"🦋", name: "Kristal Kelebek",      rarity: "rare" as const,      mintLimit: 4000,  sellPrice: 2000, bg: "#1e3a5f" },
  golden_bee:      { emoji: "🐝", name: "Altın Arı",            rarity: "rare" as const,      mintLimit: 3500,  sellPrice: 2400, bg: "#1e3a5f" },
  silver_fox:      { emoji: "🦊", name: "Gümüş Tilki",          rarity: "rare" as const,      mintLimit: 3000,  sellPrice: 2800, bg: "#1e3a5f" },
  rare_shell:      { emoji: "🐚", name: "Nadide Deniz Kabuğu",  rarity: "rare" as const,      mintLimit: 2800,  sellPrice: 2200, bg: "#1e3a5f" },
  thunder_gem:     { emoji: "⚡", name: "Yıldırım Taşı",        rarity: "rare" as const,      mintLimit: 2500,  sellPrice: 3000, bg: "#1e3a5f" },
  oracle_orb:      { emoji: "🔮", name: "Kehanet Küresi",       rarity: "rare" as const,      mintLimit: 2200,  sellPrice: 3300, bg: "#1e3a5f" },
  rainbow_flower:  { emoji: "🌈", name: "Gökkuşağı Çiçeği",    rarity: "rare" as const,      mintLimit: 2000,  sellPrice: 2900, bg: "#1e3a5f" },
  tropical_parrot: { emoji: "🦜", name: "Tropikal Papağan",     rarity: "rare" as const,      mintLimit: 1800,  sellPrice: 3600, bg: "#1e3a5f" },
  golden_turtle:   { emoji: "🐢", name: "Altın Kaplumbağa",     rarity: "rare" as const,      mintLimit: 1600,  sellPrice: 3900, bg: "#1e3a5f" },
  dragon_flower:   { emoji: "🌺", name: "Ejder Çiçeği",         rarity: "rare" as const,      mintLimit: 1400,  sellPrice: 4200, bg: "#1e3a5f" },
  lucky_clover:    { emoji: "🍀", name: "Dört Yapraklı Yonca",  rarity: "rare" as const,      mintLimit: 1200,  sellPrice: 4500, bg: "#1e3a5f" },
  evil_eye_charm:  { emoji: "🪬", name: "Göz Nazarlık",         rarity: "rare" as const,      mintLimit: 1000,  sellPrice: 4800, bg: "#1e3a5f" },
  ice_crystal:     { emoji: "🧊", name: "Saf Buz Kristali",     rarity: "rare" as const,      mintLimit: 900,   sellPrice: 5100, bg: "#1e3a5f" },
  cherry_blossom:  { emoji: "🌸", name: "Kiraz Çiçeği",         rarity: "rare" as const,      mintLimit: 800,   sellPrice: 5400, bg: "#1e3a5f" },
  eagle_feather:   { emoji: "🦅", name: "Kartal Tüyü",          rarity: "rare" as const,      mintLimit: 700,   sellPrice: 5700, bg: "#1e3a5f" },
  magic_cactus:    { emoji: "🌵", name: "Sihirli Kaktüs",       rarity: "rare" as const,      mintLimit: 600,   sellPrice: 6000, bg: "#1e3a5f" },
  sea_trident:     { emoji: "🔱", name: "Deniz Mızrağı",        rarity: "rare" as const,      mintLimit: 500,   sellPrice: 6500, bg: "#1e3a5f" },
  phoenix_feather: { emoji: "🔥", name: "Anka Kuşu Tüyü",       rarity: "rare" as const,      mintLimit: 400,   sellPrice: 7000, bg: "#1e3a5f" },

  // ─── EFSANEVİ (Legendary) ────────────────────────────────────────────────
  golden_crown:    { emoji: "👑", name: "Altın Taç",            rarity: "legendary" as const, mintLimit: 300,   sellPrice: 25000,  bg: "#5c3a00" },
  dragon_egg:      { emoji: "🥚", name: "Ejder Yumurtası",      rarity: "legendary" as const, mintLimit: 250,   sellPrice: 30000,  bg: "#5c3a00" },
  legend_sword:    { emoji: "⚔️",  name: "Efsane Kılıcı",       rarity: "legendary" as const, mintLimit: 220,   sellPrice: 38000,  bg: "#5c3a00" },
  supernova:       { emoji: "💥", name: "Süpernova Parçası",    rarity: "legendary" as const, mintLimit: 200,   sellPrice: 42000,  bg: "#5c3a00" },
  poseidon_spear:  { emoji: "🌊", name: "Poseidon Mızrağı",     rarity: "legendary" as const, mintLimit: 180,   sellPrice: 48000,  bg: "#5c3a00" },
  unicorn_crystal: { emoji: "🦄", name: "Unicorn Kristali",     rarity: "legendary" as const, mintLimit: 160,   sellPrice: 55000,  bg: "#5c3a00" },
  volcano_heart:   { emoji: "🌋", name: "Volkan Kalbi",         rarity: "legendary" as const, mintLimit: 140,   sellPrice: 65000,  bg: "#5c3a00" },
  eternal_eye:     { emoji: "👁️",  name: "Sonsuz Göz",          rarity: "legendary" as const, mintLimit: 120,   sellPrice: 78000,  bg: "#5c3a00" },
  falling_star:    { emoji: "💫", name: "Düşen Yıldız",         rarity: "legendary" as const, mintLimit: 100,   sellPrice: 90000,  bg: "#5c3a00" },
  eternal_key:     { emoji: "🗝️",  name: "Ebedi Anahtar",       rarity: "legendary" as const, mintLimit: 90,    sellPrice: 105000, bg: "#5c3a00" },
  golden_vase:     { emoji: "🏺", name: "Antik Altın Vazo",     rarity: "legendary" as const, mintLimit: 80,    sellPrice: 120000, bg: "#5c3a00" },
  magic_wand:      { emoji: "🪄", name: "Sihirli Değnek",       rarity: "legendary" as const, mintLimit: 70,    sellPrice: 140000, bg: "#5c3a00" },
  galaxy_stone:    { emoji: "🌌", name: "Galaksi Taşı",         rarity: "legendary" as const, mintLimit: 60,    sellPrice: 165000, bg: "#5c3a00" },
  ice_goddess:     { emoji: "❄️",  name: "Buz Tanrıçası",       rarity: "legendary" as const, mintLimit: 50,    sellPrice: 200000, bg: "#5c3a00" },
  lightning_lord:  { emoji: "⚡", name: "Şimşek Efendisi",     rarity: "legendary" as const, mintLimit: 45,    sellPrice: 240000, bg: "#5c3a00" },
  black_hole:      { emoji: "🕳️",  name: "Kara Delik Parçası",  rarity: "legendary" as const, mintLimit: 40,    sellPrice: 290000, bg: "#5c3a00" },
  dragon_heart:    { emoji: "🐲", name: "Ejder Kalbi",          rarity: "legendary" as const, mintLimit: 35,    sellPrice: 350000, bg: "#5c3a00" },
  sun_stone:       { emoji: "☀️",  name: "Güneş Taşı",          rarity: "legendary" as const, mintLimit: 30,    sellPrice: 420000, bg: "#5c3a00" },
  world_crystal:   { emoji: "🌐", name: "Dünya Kristali",       rarity: "legendary" as const, mintLimit: 20,    sellPrice: 600000, bg: "#5c3a00" },
  farm_god:        { emoji: "🌟", name: "Çiftlik Tanrısı",      rarity: "legendary" as const, mintLimit: 10,    sellPrice: 1000000,bg: "#5c3a00" },
} as const;

export type NftType = keyof typeof NFT_DEFS;

// ── Case Definitions ──────────────────────────────────────────────────────────

export const CASE_DEFS = {
  farm_case: {
    name: "Çiftlik Kasası",
    emoji: "📦",
    price: 75,
    description: "Temel çiftlik NFT'leri",
    bgGradient: "linear-gradient(135deg, #2d5a1b, #4a8c2a)",
    drops: { common: 0.70, rare: 0.25, legendary: 0.05 },
  },
  crystal_case: {
    name: "Kristal Kasa",
    emoji: "💠",
    price: 350,
    description: "Nadir ve değerli NFT'ler",
    bgGradient: "linear-gradient(135deg, #1a3a6b, #2d6bb5)",
    drops: { common: 0.30, rare: 0.55, legendary: 0.15 },
  },
  legend_case: {
    name: "Efsane Kasası",
    emoji: "🏆",
    price: 1500,
    description: "En nadir efsanevi NFT'ler",
    bgGradient: "linear-gradient(135deg, #5c3000, #b8860b)",
    drops: { common: 0.10, rare: 0.35, legendary: 0.55 },
  },
} as const;

export type CaseType = keyof typeof CASE_DEFS;

// ── In-memory Market Price Simulation ────────────────────────────────────────

const HISTORY_LEN = 24;

interface PricePoint { price: number; ts: number }

// Initialize price history for each NFT type with 24 starting points
const priceHistory = new Map<NftType, PricePoint[]>(
  (Object.entries(NFT_DEFS) as [NftType, typeof NFT_DEFS[NftType]][]).map(([key, def]) => {
    const base = def.sellPrice;
    const now = Date.now();
    const history: PricePoint[] = [];
    let price: number = base;
    for (let i = HISTORY_LEN - 1; i >= 0; i--) {
      const drift = (Math.random() - 0.48) * 0.06; // slight upward bias
      price = Math.max(1, Math.round(price * (1 + drift)));
      history.push({ price, ts: now - i * 20000 });
    }
    return [key, history];
  })
);

// Fluctuate prices every 15 seconds
setInterval(() => {
  (Object.keys(NFT_DEFS) as NftType[]).forEach(key => {
    const hist = priceHistory.get(key)!;
    const last = hist[hist.length - 1].price;
    const drift = (Math.random() - 0.48) * 0.08;
    const newPrice = Math.max(1, Math.round(last * (1 + drift)));
    hist.push({ price: newPrice, ts: Date.now() });
    if (hist.length > HISTORY_LEN) hist.shift();
  });
}, 15000);

function getCurrentPrice(key: NftType): number {
  const hist = priceHistory.get(key)!;
  return hist[hist.length - 1].price;
}

// ── Helper: grant an NFT ─────────────────────────────────────────────────────

export async function grantNft(telegramId: string, nftType: NftType): Promise<void> {
  const existing = await db.query.nftsTable.findFirst({
    where: and(eq(nftsTable.ownerTelegramId, telegramId), eq(nftsTable.nftType, nftType)),
  });
  if (existing) return;
  const def = NFT_DEFS[nftType];
  await db.insert(nftsTable).values({
    id: crypto.randomUUID(),
    ownerTelegramId: telegramId,
    nftType,
    rarity: def.rarity,
    name: def.name,
    emoji: def.emoji,
    mintNumber: Math.floor(Math.random() * def.mintLimit) + 1,
    isListedForTrade: false,
    listPrice: null,
  }).onConflictDoNothing();
}

function pickRandomNft(rarity: "common" | "rare" | "legendary"): NftType {
  const pool = (Object.entries(NFT_DEFS) as [NftType, typeof NFT_DEFS[NftType]][])
    .filter(([, def]) => def.rarity === rarity)
    .map(([key]) => key);
  return pool[Math.floor(Math.random() * pool.length)];
}

function rollRarity(drops: { common: number; rare: number; legendary: number }): "common" | "rare" | "legendary" {
  const r = Math.random();
  if (r < drops.legendary) return "legendary";
  if (r < drops.legendary + drops.rare) return "rare";
  return "common";
}

function serializeNft(n: typeof nftsTable.$inferSelect) {
  const def = NFT_DEFS[n.nftType as NftType];
  return {
    id: n.id,
    ownerTelegramId: n.ownerTelegramId,
    nftType: n.nftType,
    rarity: n.rarity,
    name: n.name,
    emoji: n.emoji,
    mintNumber: n.mintNumber,
    isListedForTrade: n.isListedForTrade,
    listPrice: n.listPrice ?? null,
    sellPrice: def?.sellPrice ?? 10,
    marketPrice: getCurrentPrice(n.nftType as NftType),
    createdAt: n.createdAt.toISOString(),
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

// GET /nfts/cases
router.get("/cases", (_req, res): void => {
  const result = (Object.entries(CASE_DEFS) as [CaseType, typeof CASE_DEFS[CaseType]][]).map(([id, def]) => ({
    id,
    ...def,
    nftPool: {
      common:    (Object.entries(NFT_DEFS) as [NftType, typeof NFT_DEFS[NftType]][]).filter(([, d]) => d.rarity === "common").map(([key, d]) => ({ key, ...d })),
      rare:      (Object.entries(NFT_DEFS) as [NftType, typeof NFT_DEFS[NftType]][]).filter(([, d]) => d.rarity === "rare").map(([key, d]) => ({ key, ...d })),
      legendary: (Object.entries(NFT_DEFS) as [NftType, typeof NFT_DEFS[NftType]][]).filter(([, d]) => d.rarity === "legendary").map(([key, d]) => ({ key, ...d })),
    },
  }));
  res.json(result);
});

// GET /nfts/market/prices — current prices + history for all NFT types
router.get("/market/prices", (_req, res): void => {
  const result = (Object.entries(NFT_DEFS) as [NftType, typeof NFT_DEFS[NftType]][]).map(([key, def]) => {
    const hist = priceHistory.get(key)!;
    const current = hist[hist.length - 1].price;
    const prev = hist[hist.length - 2]?.price ?? current;
    const change = prev > 0 ? ((current - prev) / prev) * 100 : 0;
    const allTimeHigh = Math.max(...hist.map(h => h.price));
    const allTimeLow = Math.min(...hist.map(h => h.price));
    return {
      nftType: key,
      emoji: def.emoji,
      name: def.name,
      rarity: def.rarity,
      basePrice: def.sellPrice,
      currentPrice: current,
      change: Math.round(change * 100) / 100,
      history: hist.map(h => h.price),
      allTimeHigh,
      allTimeLow,
    };
  });
  res.json(result);
});

// POST /nfts/cases/open
router.post("/cases/open", async (req, res): Promise<void> => {
  const { telegramId, caseType } = req.body as { telegramId: string; caseType: CaseType };
  if (!telegramId || !caseType || !CASE_DEFS[caseType]) {
    res.status(400).json({ error: "telegramId and valid caseType required" });
    return;
  }
  const caseDef = CASE_DEFS[caseType];
  const rarity = rollRarity(caseDef.drops);
  const nftType = pickRandomNft(rarity);
  const nftDef = NFT_DEFS[nftType];
  const mintNumber = Math.floor(Math.random() * nftDef.mintLimit) + 1;
  const nftId = crypto.randomUUID();
  const now = new Date();
  let nftResult: typeof nftsTable.$inferSelect | null = null;
  try {
    await db.transaction(async (tx) => {
      const updated = await tx
        .update(usersTable)
        .set({ balance: sql`${usersTable.balance} - ${caseDef.price}` })
        .where(and(eq(usersTable.telegramId, telegramId), sql`${usersTable.balance} >= ${caseDef.price}`))
        .returning({ telegramId: usersTable.telegramId });
      if (updated.length === 0) {
        const user = await tx.query.usersTable.findFirst({ where: eq(usersTable.telegramId, telegramId), columns: { telegramId: true } });
        throw new Error(user ? "INSUFFICIENT_BALANCE" : "USER_NOT_FOUND");
      }
      const inserted = await tx.insert(nftsTable).values({
        id: nftId, ownerTelegramId: telegramId, nftType, rarity: nftDef.rarity,
        name: nftDef.name, emoji: nftDef.emoji, mintNumber, isListedForTrade: false, listPrice: null,
      }).returning();
      nftResult = inserted[0];
    });
  } catch (e: any) {
    if (e.message === "USER_NOT_FOUND") res.status(404).json({ error: "Kullanıcı bulunamadı" });
    else if (e.message === "INSUFFICIENT_BALANCE") res.status(402).json({ error: "Yetersiz TL bakiyesi. Çiftliğini geliştir!" });
    else res.status(500).json({ error: "Kasa açılamadı" });
    return;
  }
  res.json({ id: nftId, ownerTelegramId: telegramId, nftType, rarity: nftDef.rarity, name: nftDef.name, emoji: nftDef.emoji, mintNumber, isListedForTrade: false, listPrice: null, sellPrice: nftDef.sellPrice, marketPrice: getCurrentPrice(nftType), createdAt: now.toISOString() });
});

// POST /nfts/sell — sell to system for fixed price
router.post("/sell", async (req, res): Promise<void> => {
  const { telegramId, nftId } = req.body as { telegramId: string; nftId: string };
  if (!telegramId || !nftId) { res.status(400).json({ error: "required" }); return; }
  let earnedTl = 0; let nftType = "";
  try {
    await db.transaction(async (tx) => {
      const deleted = await tx.delete(nftsTable)
        .where(and(eq(nftsTable.id, nftId), eq(nftsTable.ownerTelegramId, telegramId)))
        .returning();
      if (deleted.length === 0) throw new Error("NOT_FOUND");
      const nft = deleted[0];
      const def = NFT_DEFS[nft.nftType as NftType];
      earnedTl = def?.sellPrice ?? 10; nftType = nft.nftType;
      await tx.update(usersTable).set({ balance: sql`${usersTable.balance} + ${earnedTl}` }).where(eq(usersTable.telegramId, telegramId));
    });
  } catch (e: any) {
    if (e.message === "NOT_FOUND") res.status(404).json({ error: "NFT bulunamadı" });
    else res.status(500).json({ error: "Satış başarısız" });
    return;
  }
  res.json({ success: true, earnedTl, nftType });
});

// POST /nfts/list-for-sale — list NFT on exchange with a TL price
router.post("/list-for-sale", async (req, res): Promise<void> => {
  const { telegramId, nftId, price } = req.body as { telegramId: string; nftId: string; price: number | null };
  if (!telegramId || !nftId) { res.status(400).json({ error: "required" }); return; }
  const nft = await db.query.nftsTable.findFirst({ where: and(eq(nftsTable.id, nftId), eq(nftsTable.ownerTelegramId, telegramId)) });
  if (!nft) { res.status(404).json({ error: "NFT bulunamadı" }); return; }
  const listPrice = price && price > 0 ? Math.round(price) : null;
  const updated = await db.update(nftsTable)
    .set({ listPrice, isListedForTrade: listPrice !== null })
    .where(eq(nftsTable.id, nftId))
    .returning();
  res.json(serializeNft(updated[0]));
});

// POST /nfts/buy — buy a market-listed NFT with TL
router.post("/buy", async (req, res): Promise<void> => {
  const { telegramId, nftId } = req.body as { telegramId: string; nftId: string };
  if (!telegramId || !nftId) { res.status(400).json({ error: "required" }); return; }
  let paidTl = 0;
  try {
    await db.transaction(async (tx) => {
      const nft = await tx.query.nftsTable.findFirst({ where: and(eq(nftsTable.id, nftId), isNotNull(nftsTable.listPrice)) });
      if (!nft || !nft.listPrice) throw new Error("NOT_LISTED");
      if (nft.ownerTelegramId === telegramId) throw new Error("OWN_NFT");
      paidTl = nft.listPrice;
      // Deduct buyer balance
      const deducted = await tx.update(usersTable)
        .set({ balance: sql`${usersTable.balance} - ${paidTl}` })
        .where(and(eq(usersTable.telegramId, telegramId), sql`${usersTable.balance} >= ${paidTl}`))
        .returning({ telegramId: usersTable.telegramId });
      if (deducted.length === 0) throw new Error("INSUFFICIENT_BALANCE");
      // Credit seller
      await tx.update(usersTable)
        .set({ balance: sql`${usersTable.balance} + ${paidTl}` })
        .where(eq(usersTable.telegramId, nft.ownerTelegramId));
      // Transfer NFT
      await tx.update(nftsTable)
        .set({ ownerTelegramId: telegramId, isListedForTrade: false, listPrice: null })
        .where(eq(nftsTable.id, nftId));
      // Update market price (sale price influences market)
      const hist = priceHistory.get(nft.nftType as NftType);
      if (hist) {
        hist.push({ price: paidTl, ts: Date.now() });
        if (hist.length > HISTORY_LEN) hist.shift();
      }
    });
  } catch (e: any) {
    if (e.message === "NOT_LISTED") res.status(404).json({ error: "Bu NFT satışta değil" });
    else if (e.message === "OWN_NFT") res.status(400).json({ error: "Kendi NFT'ini satın alamazsın" });
    else if (e.message === "INSUFFICIENT_BALANCE") res.status(402).json({ error: "Yetersiz TL bakiyesi" });
    else res.status(500).json({ error: "Satın alma başarısız" });
    return;
  }
  res.json({ success: true, paidTl });
});

// GET /nfts/user/:telegramId
router.get("/user/:telegramId", async (req, res): Promise<void> => {
  const nfts = await db.query.nftsTable.findMany({
    where: eq(nftsTable.ownerTelegramId, req.params.telegramId),
    orderBy: [desc(nftsTable.createdAt)],
  });
  res.json(nfts.map(serializeNft));
});

// POST /nfts/list-trade (legacy — keep for backward compat)
router.post("/list-trade", async (req, res): Promise<void> => {
  const { telegramId, nftId, list } = req.body as { telegramId: string; nftId: string; list: boolean };
  if (!telegramId || !nftId || typeof list !== "boolean") { res.status(400).json({ error: "required" }); return; }
  const nft = await db.query.nftsTable.findFirst({ where: and(eq(nftsTable.id, nftId), eq(nftsTable.ownerTelegramId, telegramId)) });
  if (!nft) { res.status(404).json({ error: "NFT not found" }); return; }
  const updated = await db.update(nftsTable).set({ isListedForTrade: list, listPrice: list ? nft.listPrice : null }).where(eq(nftsTable.id, nftId)).returning();
  res.json(serializeNft(updated[0]));
});

// GET /nfts/market — all NFTs listed for sale on exchange
router.get("/market", async (_req, res): Promise<void> => {
  const listed = await db.query.nftsTable.findMany({
    where: isNotNull(nftsTable.listPrice),
    orderBy: [desc(nftsTable.createdAt)],
    limit: 200,
  });
  res.json(listed.map(serializeNft));
});

// POST /nfts/trade/offer
router.post("/trade/offer", async (req, res): Promise<void> => {
  const { offererTelegramId, offeredNftId, targetTelegramId, wantedNftType } = req.body as { offererTelegramId: string; offeredNftId: string; targetTelegramId?: string; wantedNftType?: string };
  if (!offererTelegramId || !offeredNftId) { res.status(400).json({ error: "required" }); return; }
  const nft = await db.query.nftsTable.findFirst({ where: and(eq(nftsTable.id, offeredNftId), eq(nftsTable.ownerTelegramId, offererTelegramId)) });
  if (!nft) { res.status(404).json({ error: "NFT not found" }); return; }
  const id = crypto.randomUUID();
  await db.insert(nftTradeOffersTable).values({ id, offererTelegramId, offeredNftId, targetTelegramId: targetTelegramId ?? null, wantedNftType: wantedNftType ?? null, status: "pending" });
  res.json({ id, offererTelegramId, offeredNftId, targetTelegramId: targetTelegramId ?? null, wantedNftType: wantedNftType ?? null, status: "pending", createdAt: new Date().toISOString(), offeredNft: serializeNft(nft) });
});

// GET /nfts/trade/offers/:telegramId
router.get("/trade/offers/:telegramId", async (req, res): Promise<void> => {
  const { telegramId } = req.params;
  const offers = await db.query.nftTradeOffersTable.findMany({ where: and(eq(nftTradeOffersTable.status, "pending"), or(eq(nftTradeOffersTable.targetTelegramId, telegramId), isNull(nftTradeOffersTable.targetTelegramId))), orderBy: [desc(nftTradeOffersTable.createdAt)], limit: 50 });
  const enriched = await Promise.all(offers.map(async (o) => {
    const offeredNft = await db.query.nftsTable.findFirst({ where: eq(nftsTable.id, o.offeredNftId) });
    return { id: o.id, offererTelegramId: o.offererTelegramId, offeredNftId: o.offeredNftId, targetTelegramId: o.targetTelegramId, wantedNftType: o.wantedNftType, status: o.status, createdAt: o.createdAt.toISOString(), offeredNft: offeredNft ? serializeNft(offeredNft) : null };
  }));
  res.json(enriched);
});

// POST /nfts/trade/accept
router.post("/trade/accept", async (req, res): Promise<void> => {
  const { telegramId, offerId, acceptorNftId } = req.body as { telegramId: string; offerId: string; acceptorNftId: string };
  if (!telegramId || !offerId || !acceptorNftId) { res.status(400).json({ error: "required" }); return; }
  const offer = await db.query.nftTradeOffersTable.findFirst({ where: and(eq(nftTradeOffersTable.id, offerId), eq(nftTradeOffersTable.status, "pending")) });
  if (!offer) { res.status(404).json({ error: "Offer not found" }); return; }
  const acceptorNft = await db.query.nftsTable.findFirst({ where: and(eq(nftsTable.id, acceptorNftId), eq(nftsTable.ownerTelegramId, telegramId)) });
  if (!acceptorNft) { res.status(404).json({ error: "Your NFT not found" }); return; }
  await db.transaction(async (tx) => {
    await tx.update(nftsTable).set({ ownerTelegramId: telegramId, isListedForTrade: false, listPrice: null }).where(eq(nftsTable.id, offer.offeredNftId));
    await tx.update(nftsTable).set({ ownerTelegramId: offer.offererTelegramId, isListedForTrade: false, listPrice: null }).where(eq(nftsTable.id, acceptorNftId));
    await tx.update(nftTradeOffersTable).set({ status: "accepted", resolvedAt: new Date() }).where(eq(nftTradeOffersTable.id, offerId));
  });
  res.json({ success: true });
});

export default router;
