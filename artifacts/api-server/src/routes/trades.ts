import { Router } from "express";
import { eq, and, desc, ne } from "drizzle-orm";
import { db, tradeListingsTable, usersTable } from "@workspace/db";
import { z } from "zod/v4";

const router = Router();

const CreateListingBody = z.object({
  sellerId: z.string(),
  sellerName: z.string(),
  itemId: z.string(),
  itemEmoji: z.string(),
  itemName: z.string(),
  quantity: z.number().int().positive().max(1000),
  priceCoins: z.number().int().positive().max(100_000_000),
  isSpecial: z.boolean().optional().default(false),
});

const BuyListingBody = z.object({
  buyerId: z.string(),
  buyerName: z.string(),
});

// GET /api/trades — active listings (optionally excluding caller's own)
router.get("/", async (req, res): Promise<void> => {
  const { excludeId } = req.query as { excludeId?: string };
  try {
    const listings = await db
      .select()
      .from(tradeListingsTable)
      .where(
        excludeId
          ? and(eq(tradeListingsTable.status, "active"), ne(tradeListingsTable.sellerId, excludeId))
          : eq(tradeListingsTable.status, "active")
      )
      .orderBy(desc(tradeListingsTable.createdAt))
      .limit(100);
    res.json({ listings });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// GET /api/trades/mine?sellerId=xxx — caller's active listings
router.get("/mine", async (req, res): Promise<void> => {
  const { sellerId } = req.query as { sellerId?: string };
  if (!sellerId) { res.status(400).json({ error: "sellerId required" }); return; }
  try {
    const listings = await db
      .select()
      .from(tradeListingsTable)
      .where(and(eq(tradeListingsTable.sellerId, sellerId), eq(tradeListingsTable.status, "active")))
      .orderBy(desc(tradeListingsTable.createdAt));
    res.json({ listings });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// POST /api/trades — create a listing
router.post("/", async (req, res): Promise<void> => {
  const parsed = CreateListingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Geçersiz veri" }); return; }
  const d = parsed.data;
  try {
    const [listing] = await db.insert(tradeListingsTable).values({
      sellerId: d.sellerId,
      sellerName: d.sellerName,
      itemId: d.itemId,
      itemEmoji: d.itemEmoji,
      itemName: d.itemName,
      quantity: d.quantity,
      priceCoins: d.priceCoins,
      isSpecial: d.isSpecial,
      status: "active",
    }).returning();
    res.json({ listing });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// POST /api/trades/:id/buy — purchase a listing
router.post("/:id/buy", async (req, res): Promise<void> => {
  const { id } = req.params;
  const parsed = BuyListingBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Geçersiz veri" }); return; }
  const { buyerId, buyerName } = parsed.data;

  try {
    const [listing] = await db.select().from(tradeListingsTable).where(eq(tradeListingsTable.id, id));
    if (!listing || listing.status !== "active") {
      res.status(404).json({ error: "İlan bulunamadı veya zaten satıldı" }); return;
    }
    if (listing.sellerId === buyerId) {
      res.status(400).json({ error: "Kendi ilanınızı satın alamazsınız" }); return;
    }

    const [buyer] = await db.select().from(usersTable).where(eq(usersTable.telegramId, buyerId));
    if (!buyer) { res.status(404).json({ error: "Kullanıcı bulunamadı" }); return; }

    const buyerCoins = Number(buyer.coins);
    if (buyerCoins < listing.priceCoins) {
      res.status(400).json({ error: "Yetersiz coin" }); return;
    }

    // Transfer coins: buyer → seller
    await db.update(usersTable)
      .set({ coins: String(buyerCoins - listing.priceCoins) })
      .where(eq(usersTable.telegramId, buyerId));

    const [sellerRow] = await db.select({ coins: usersTable.coins }).from(usersTable).where(eq(usersTable.telegramId, listing.sellerId));
    const sellerCoins = Number(sellerRow?.coins ?? 0);
    await db.update(usersTable)
      .set({ coins: String(sellerCoins + listing.priceCoins) })
      .where(eq(usersTable.telegramId, listing.sellerId));

    await db.update(tradeListingsTable)
      .set({ status: "sold", soldAt: new Date(), buyerId, buyerName })
      .where(eq(tradeListingsTable.id, id));

    res.json({
      success: true,
      itemId: listing.itemId,
      itemEmoji: listing.itemEmoji,
      itemName: listing.itemName,
      quantity: listing.quantity,
      isSpecial: listing.isSpecial,
      coinsSpent: listing.priceCoins,
    });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

// DELETE /api/trades/:id?sellerId=xxx — cancel and return items
router.delete("/:id", async (req, res): Promise<void> => {
  const { id } = req.params;
  const { sellerId } = req.query as { sellerId?: string };
  if (!sellerId) { res.status(400).json({ error: "sellerId required" }); return; }

  try {
    const [listing] = await db.select().from(tradeListingsTable).where(eq(tradeListingsTable.id, id));
    if (!listing) { res.status(404).json({ error: "İlan bulunamadı" }); return; }
    if (listing.sellerId !== sellerId) { res.status(403).json({ error: "Yetkisiz" }); return; }
    if (listing.status !== "active") { res.status(400).json({ error: "İlan aktif değil" }); return; }

    await db.update(tradeListingsTable)
      .set({ status: "cancelled" })
      .where(eq(tradeListingsTable.id, id));

    res.json({
      success: true,
      itemId: listing.itemId,
      itemEmoji: listing.itemEmoji,
      itemName: listing.itemName,
      quantity: listing.quantity,
      isSpecial: listing.isSpecial,
    });
  } catch {
    res.status(500).json({ error: "DB error" });
  }
});

export default router;
