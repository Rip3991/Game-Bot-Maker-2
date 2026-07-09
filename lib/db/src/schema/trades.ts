import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const tradeListingsTable = pgTable("trade_listings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId: text("seller_id").notNull(),
  sellerName: text("seller_name").notNull(),
  itemId: text("item_id").notNull(),
  itemEmoji: text("item_emoji").notNull(),
  itemName: text("item_name").notNull(),
  quantity: integer("quantity").notNull(),
  priceCoins: integer("price_coins").notNull(),
  isSpecial: boolean("is_special").notNull().default(false),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  soldAt: timestamp("sold_at", { withTimezone: true }),
  buyerId: text("buyer_id"),
  buyerName: text("buyer_name"),
});

export type TradeListing = typeof tradeListingsTable.$inferSelect;
