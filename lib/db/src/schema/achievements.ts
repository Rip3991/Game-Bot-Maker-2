import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const achievementsTable = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userTelegramId: text("user_telegram_id").notNull(),
  achievementKey: text("achievement_key").notNull(),
  earnedAt: timestamp("earned_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Achievement = typeof achievementsTable.$inferSelect;
