import { eq, and, sql } from "drizzle-orm";
import { db, usersTable, achievementsTable } from "@workspace/db";
import { notifyUser } from "./telegram";

// Small, escalating coin rewards — badges stay the primary reward, the
// coins are a modest "thank you" so payouts don't meaningfully move the
// real-money economy (in-game coins convert to withdrawable TL).
export const ACHIEVEMENT_DEFINITIONS = [
  { key: "first_upgrade",    title: "İlk Mahsul",      description: "İlk çiftlik yükseltmeni yap", icon: "🌾", coins: 50 },
  { key: "social_farmer_1",  title: "Sosyal Çiftçi",   description: "1 arkadaş davet et",          icon: "👥", coins: 80 },
  { key: "jackpot",          title: "Büyük Kazanan",   description: "Çarkta jackpot çevir",        icon: "🎰", coins: 100 },
  { key: "coin_collector",   title: "Para Basmak",     description: "1000 coin kazan",             icon: "🪙", coins: 120 },
  { key: "weekly_streak",    title: "Haftalık Seri",   description: "7 gün üst üste giriş yap",    icon: "🔥", coins: 150 },
  { key: "first_withdraw",   title: "İlk Çekim",       description: "İlk para çekimini yap",       icon: "💸", coins: 200 },
  { key: "social_farmer_5",  title: "Lider Çiftçi",    description: "5 arkadaş davet et",           icon: "👑", coins: 250 },
  { key: "social_farmer_10", title: "Efsane Çiftçi",   description: "10 arkadaş davet et",          icon: "🏆", coins: 400 },
] as const;

const REWARD_BY_KEY = new Map(ACHIEVEMENT_DEFINITIONS.map(d => [d.key, d.coins]));
const TITLE_BY_KEY = new Map(ACHIEVEMENT_DEFINITIONS.map(d => [d.key, d.title]));
const ICON_BY_KEY = new Map(ACHIEVEMENT_DEFINITIONS.map(d => [d.key, d.icon]));

/**
 * Grants an achievement exactly once. If it carries a coin reward (see
 * ACHIEVEMENT_DEFINITIONS above) the coins are credited and a Telegram
 * notification is sent, matching the pattern used for streak/task rewards.
 * Safe to call repeatedly — no-ops if already earned.
 */
export async function grantAchievement(
  telegramId: string,
  key: string,
): Promise<{ granted: boolean; coins: number }> {
  const existing = await db.query.achievementsTable.findFirst({
    where: (t, { and: and2 }) =>
      and2(eq(t.userTelegramId, telegramId), eq(t.achievementKey, key)),
  });
  if (existing) return { granted: false, coins: 0 };

  const coins = REWARD_BY_KEY.get(key) ?? 0;

  await db.insert(achievementsTable)
    .values({ userTelegramId: telegramId, achievementKey: key })
    .onConflictDoNothing();

  if (coins > 0) {
    await db.update(usersTable)
      .set({ coins: sql`${usersTable.coins} + ${coins}` })
      .where(eq(usersTable.telegramId, telegramId));

    const title = TITLE_BY_KEY.get(key) ?? "Başarım";
    const icon = ICON_BY_KEY.get(key) ?? "🏅";
    notifyUser(
      telegramId,
      `${icon} <b>Başarım Kazandın: ${title}!</b>\n\n🪙 <b>+${coins} coin</b> hesabına eklendi!`,
    ).catch(() => {});
  }

  return { granted: true, coins };
}
