import { pgTable, serial, text, integer, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerTelegramId: text("referrer_telegram_id").notNull(),
  referredTelegramId: text("referred_telegram_id").notNull(),
  coinsEarned: integer("coins_earned").notNull().default(500),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  // Each referred user can only be counted once, preventing double-credit
  referredUnique: uniqueIndex("referrals_referred_unique").on(table.referredTelegramId),
}));

export type Referral = typeof referralsTable.$inferSelect;
