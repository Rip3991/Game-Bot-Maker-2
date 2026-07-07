import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerTelegramId: text("referrer_telegram_id").notNull(),
  referredTelegramId: text("referred_telegram_id").notNull(),
  coinsEarned: integer("coins_earned").notNull().default(500),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Referral = typeof referralsTable.$inferSelect;
