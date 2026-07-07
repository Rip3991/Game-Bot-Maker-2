import { pgTable, text, numeric, integer, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  telegramId: text("telegram_id").primaryKey(),
  firstName: text("first_name").notNull(),
  username: text("username"),
  coins: numeric("coins", { precision: 18, scale: 2 }).notNull().default("0"),
  balance: numeric("balance", { precision: 18, scale: 2 }).notNull().default("54.11"),
  farmState: jsonb("farm_state").$type<{ wheat: number; chicken: number; cow: number }>().default({ wheat: 1, chicken: 1, cow: 1 }),
  streakCount: integer("streak_count").notNull().default(0),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  lastSpinAt: timestamp("last_spin_at", { withTimezone: true }),
  totalReferrals: integer("total_referrals").notNull().default(0),
  referredBy: text("referred_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
