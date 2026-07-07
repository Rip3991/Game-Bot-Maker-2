import { pgTable, text, numeric, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const vaultStatusEnum = pgEnum("vault_status", ["locked", "mature", "claimed"]);

export const vaultDepositsTable = pgTable("vault_deposits", {
  id: text("id").primaryKey(),
  userTelegramId: text("user_telegram_id").notNull(),
  coinsDeposited: numeric("coins_deposited", { precision: 18, scale: 0 }).notNull(),
  lockDays: integer("lock_days").notNull(), // 3, 7, 14, 30
  multiplier: numeric("multiplier", { precision: 4, scale: 2 }).notNull(), // 1.10, 1.25, 1.50, 2.00
  coinsToReceive: numeric("coins_to_receive", { precision: 18, scale: 0 }).notNull(),
  maturesAt: timestamp("matures_at", { withTimezone: true }).notNull(),
  status: vaultStatusEnum("status").notNull().default("locked"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
});

export type VaultDeposit = typeof vaultDepositsTable.$inferSelect;
