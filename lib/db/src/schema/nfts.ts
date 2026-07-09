import { pgTable, text, integer, boolean, timestamp, pgEnum, numeric } from "drizzle-orm/pg-core";

export const nftRarityEnum = pgEnum("nft_rarity", ["common", "rare", "epic", "special", "legendary"]);
export const tradeStatusEnum = pgEnum("trade_status", ["pending", "accepted", "rejected", "cancelled"]);

export const nftsTable = pgTable("nfts", {
  id: text("id").primaryKey(),
  ownerTelegramId: text("owner_telegram_id").notNull(),
  nftType: text("nft_type").notNull(),
  rarity: nftRarityEnum("rarity").notNull(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  mintNumber: integer("mint_number").notNull().default(0),
  isListedForTrade: boolean("is_listed_for_trade").notNull().default(false),
  listPrice: integer("list_price"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const nftTradeOffersTable = pgTable("nft_trade_offers", {
  id: text("id").primaryKey(),
  offererTelegramId: text("offerer_telegram_id").notNull(),
  offeredNftId: text("offered_nft_id").notNull(),
  targetTelegramId: text("target_telegram_id"),
  wantedNftType: text("wanted_nft_type"),
  status: tradeStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export type Nft = typeof nftsTable.$inferSelect;
export type NftTradeOffer = typeof nftTradeOffersTable.$inferSelect;
