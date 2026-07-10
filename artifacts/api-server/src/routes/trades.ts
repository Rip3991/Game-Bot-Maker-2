import { Router } from "express";
import { eq, and, desc, ne } from "drizzle-orm";
import { db, tradeListingsTable, usersTable } from "@workspace/db";

const router = Router();

function parseCreateListing(body: unknown) {
  const b = body as Record<string, unknown>;
  if (!b) return null;
  const { sellerId, sellerName, itemId, itemEmoji, itemName, quantity, priceCoins, isSpecial } = b;
  if (typeof sellerId !== "string" || !sellerId) return null;
  if (typeof sellerName !== "string" || !sellerName) return null;
  if (typeof itemId !== "string" || !itemId) return null;
  if (typeof itemEmoji !== "string" || !itemEmoji) return null;
  if (typeof itemName !== "string" || !itemName) return null;
  const qty = Number(quantity);
  const price = Number(priceCoins);
  if (!Number.isInteger(qty) || qty <= 0 || qty > 1000) return null;
  if (!Number.isInteger(price) || price <= 0 || price > 100_000_000) return null;
  return { sellerId, sellerName, itemId, itemEmoji, itemName, quantity: qty, priceCoins: price, isSpecial: Boolean(isSpecial) };
}

function parseBuyListing(body: unknown) {
  const b = body as Record<string, unknown>;
  if (!b) return null;
  const { buyerId, buyerName } = b;
  if (typeof buyerId !== "string" || !buyerId) return null;
  if (typeof buyerName !== "string" || !buyerName) return null;
  return { buyerId, buyerName };
}

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
  const d = parseCreateListing(req.body);
  if (!d) { res.status(400).json({ error: "Geçersiz veri" }); return; }
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
  const d = parseBuyListing(req.body);
  if (!d) { res.status(400).json({ error: "Geçersiz veri" }); return; }
  const { buyerId, buyerName } = d;

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
