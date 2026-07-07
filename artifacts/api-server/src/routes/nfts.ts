import { Router } from "express";
import { eq, desc, and, isNull, or, ne } from "drizzle-orm";
import { db, usersTable, nftsTable, nftTradeOffersTable, achievementsTable } from "@workspace/db";
import crypto from "crypto";

const router = Router();

// NFT definitions — earned via milestones
export const NFT_DEFS = {
  golden_wheat:     { emoji: "🌾", name: "Golden Wheat",     rarity: "rare"      as const, mintLimit: 1000 },
  diamond_chicken:  { emoji: "🐔", name: "Diamond Chicken",  rarity: "special"   as const, mintLimit: 500  },
  royal_cow:        { emoji: "🐄", name: "Royal Cow",        rarity: "legendary" as const, mintLimit: 100  },
  lucky_coin:       { emoji: "🍀", name: "Lucky Coin",       rarity: "rare"      as const, mintLimit: 2000 },
  referral_king:    { emoji: "👑", name: "Referral King",    rarity: "special"   as const, mintLimit: 500  },
  farm_pioneer:     { emoji: "🌟", name: "Farm Pioneer",     rarity: "common"    as const, mintLimit: 10000},
  jackpot_master:   { emoji: "🎰", name: "Jackpot Master",   rarity: "rare"      as const, mintLimit: 2000 },
  vault_hoarder:    { emoji: "💎", name: "Vault Hoarder",    rarity: "special"   as const, mintLimit: 500  },
} as const;

export type NftType = keyof typeof NFT_DEFS;

// Grant an NFT to a user (idempotent — max 1 per type per user)
export async function grantNft(telegramId: string, nftType: NftType): Promise<void> {
  const existing = await db.query.nftsTable.findFirst({
    where: and(
      eq(nftsTable.ownerTelegramId, telegramId),
      eq(nftsTable.nftType, nftType),
    ),
  });
  if (existing) return;

  const def = NFT_DEFS[nftType];
  const id = crypto.randomUUID();
  const mintNumber = Math.floor(Math.random() * def.mintLimit) + 1;

  await db.insert(nftsTable).values({
    id,
    ownerTelegramId: telegramId,
    nftType,
    rarity: def.rarity,
    name: def.name,
    emoji: def.emoji,
    mintNumber,
    isListedForTrade: false,
  }).onConflictDoNothing();
}

// GET /nfts/user/:telegramId
router.get("/user/:telegramId", async (req, res): Promise<void> => {
  const { telegramId } = req.params;

  const nfts = await db.query.nftsTable.findMany({
    where: eq(nftsTable.ownerTelegramId, telegramId),
    orderBy: [desc(nftsTable.createdAt)],
  });

  res.json(nfts.map(n => ({
    id: n.id,
    ownerTelegramId: n.ownerTelegramId,
    nftType: n.nftType,
    rarity: n.rarity,
    name: n.name,
    emoji: n.emoji,
    mintNumber: n.mintNumber,
    isListedForTrade: n.isListedForTrade,
    createdAt: n.createdAt.toISOString(),
  })));
});

// POST /nfts/list-trade
router.post("/list-trade", async (req, res): Promise<void> => {
  const { telegramId, nftId, list } = req.body as {
    telegramId: string;
    nftId: string;
    list: boolean;
  };

  if (!telegramId || !nftId || typeof list !== "boolean") {
    res.status(400).json({ error: "telegramId, nftId, list required" });
    return;
  }

  const nft = await db.query.nftsTable.findFirst({
    where: and(eq(nftsTable.id, nftId), eq(nftsTable.ownerTelegramId, telegramId)),
  });

  if (!nft) {
    res.status(404).json({ error: "NFT not found or not owned by user" });
    return;
  }

  const updated = await db
    .update(nftsTable)
    .set({ isListedForTrade: list })
    .where(eq(nftsTable.id, nftId))
    .returning();

  res.json({
    id: updated[0].id,
    ownerTelegramId: updated[0].ownerTelegramId,
    nftType: updated[0].nftType,
    rarity: updated[0].rarity,
    name: updated[0].name,
    emoji: updated[0].emoji,
    mintNumber: updated[0].mintNumber,
    isListedForTrade: updated[0].isListedForTrade,
    createdAt: updated[0].createdAt.toISOString(),
  });
});

// GET /nfts/market
router.get("/market", async (req, res): Promise<void> => {
  const listed = await db.query.nftsTable.findMany({
    where: eq(nftsTable.isListedForTrade, true),
    orderBy: [desc(nftsTable.createdAt)],
    limit: 100,
  });

  res.json(listed.map(n => ({
    id: n.id,
    ownerTelegramId: n.ownerTelegramId,
    nftType: n.nftType,
    rarity: n.rarity,
    name: n.name,
    emoji: n.emoji,
    mintNumber: n.mintNumber,
    isListedForTrade: n.isListedForTrade,
    createdAt: n.createdAt.toISOString(),
  })));
});

// POST /nfts/trade/offer
router.post("/trade/offer", async (req, res): Promise<void> => {
  const { offererTelegramId, offeredNftId, targetTelegramId, wantedNftType } = req.body as {
    offererTelegramId: string;
    offeredNftId: string;
    targetTelegramId?: string;
    wantedNftType?: string;
  };

  if (!offererTelegramId || !offeredNftId) {
    res.status(400).json({ error: "offererTelegramId and offeredNftId required" });
    return;
  }

  // Verify ownership
  const nft = await db.query.nftsTable.findFirst({
    where: and(
      eq(nftsTable.id, offeredNftId),
      eq(nftsTable.ownerTelegramId, offererTelegramId),
    ),
  });

  if (!nft) {
    res.status(404).json({ error: "NFT not found or not owned by you" });
    return;
  }

  const id = crypto.randomUUID();

  await db.insert(nftTradeOffersTable).values({
    id,
    offererTelegramId,
    offeredNftId,
    targetTelegramId: targetTelegramId ?? null,
    wantedNftType: wantedNftType ?? null,
    status: "pending",
  });

  res.json({
    id,
    offererTelegramId,
    offeredNftId,
    targetTelegramId: targetTelegramId ?? null,
    wantedNftType: wantedNftType ?? null,
    status: "pending",
    createdAt: new Date().toISOString(),
    offeredNft: {
      id: nft.id,
      ownerTelegramId: nft.ownerTelegramId,
      nftType: nft.nftType,
      rarity: nft.rarity,
      name: nft.name,
      emoji: nft.emoji,
      mintNumber: nft.mintNumber,
      isListedForTrade: nft.isListedForTrade,
      createdAt: nft.createdAt.toISOString(),
    },
  });
});

// GET /nfts/trade/offers/:telegramId
router.get("/trade/offers/:telegramId", async (req, res): Promise<void> => {
  const { telegramId } = req.params;

  // Offers targeting this user, or public offers for their listed NFTs
  const offers = await db.query.nftTradeOffersTable.findMany({
    where: and(
      eq(nftTradeOffersTable.status, "pending"),
      or(
        eq(nftTradeOffersTable.targetTelegramId, telegramId),
        isNull(nftTradeOffersTable.targetTelegramId),
      ),
    ),
    orderBy: [desc(nftTradeOffersTable.createdAt)],
    limit: 50,
  });

  // Enrich with offered NFT details
  const enriched = await Promise.all(
    offers.map(async (o) => {
      const offeredNft = await db.query.nftsTable.findFirst({
        where: eq(nftsTable.id, o.offeredNftId),
      });
      return {
        id: o.id,
        offererTelegramId: o.offererTelegramId,
        offeredNftId: o.offeredNftId,
        targetTelegramId: o.targetTelegramId,
        wantedNftType: o.wantedNftType,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        offeredNft: offeredNft ? {
          id: offeredNft.id,
          ownerTelegramId: offeredNft.ownerTelegramId,
          nftType: offeredNft.nftType,
          rarity: offeredNft.rarity,
          name: offeredNft.name,
          emoji: offeredNft.emoji,
          mintNumber: offeredNft.mintNumber,
          isListedForTrade: offeredNft.isListedForTrade,
          createdAt: offeredNft.createdAt.toISOString(),
        } : null,
      };
    }),
  );

  res.json(enriched);
});

// POST /nfts/trade/accept
router.post("/trade/accept", async (req, res): Promise<void> => {
  const { telegramId, offerId, acceptorNftId } = req.body as {
    telegramId: string;
    offerId: string;
    acceptorNftId: string;
  };

  if (!telegramId || !offerId || !acceptorNftId) {
    res.status(400).json({ error: "telegramId, offerId, acceptorNftId required" });
    return;
  }

  const offer = await db.query.nftTradeOffersTable.findFirst({
    where: and(
      eq(nftTradeOffersTable.id, offerId),
      eq(nftTradeOffersTable.status, "pending"),
    ),
  });

  if (!offer) {
    res.status(404).json({ error: "Offer not found or expired" });
    return;
  }

  // Verify acceptor owns the NFT they're giving
  const acceptorNft = await db.query.nftsTable.findFirst({
    where: and(
      eq(nftsTable.id, acceptorNftId),
      eq(nftsTable.ownerTelegramId, telegramId),
    ),
  });

  if (!acceptorNft) {
    res.status(404).json({ error: "Your NFT not found" });
    return;
  }

  // Swap ownership
  await db.transaction(async (tx) => {
    await tx
      .update(nftsTable)
      .set({ ownerTelegramId: telegramId, isListedForTrade: false })
      .where(eq(nftsTable.id, offer.offeredNftId));

    await tx
      .update(nftsTable)
      .set({ ownerTelegramId: offer.offererTelegramId, isListedForTrade: false })
      .where(eq(nftsTable.id, acceptorNftId));

    await tx
      .update(nftTradeOffersTable)
      .set({ status: "accepted", resolvedAt: new Date() })
      .where(eq(nftTradeOffersTable.id, offerId));
  });

  res.json({ success: true });
});

export default router;
