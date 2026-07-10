import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, usersTable, achievementsTable } from "@workspace/db";
import { sendTelegramRequest } from "../lib/telegram";

const router = Router();

export function getAnnouncementChannel(): string {
  const raw = process.env.ANNOUNCEMENT_CHANNEL ?? "sarinoyunciftligi";
  return raw.replace(/^@/, "");
}

// Task definitions — claimable once per user
// Reward amounts tightened 2026-07-10 (operator request: task payouts should
// be small and hard-earned, both in Coins and real TL — previous amounts
// let a handful of tasks pay out real money too easily).
export const TASK_DEFS = [
  {
    id: "task_channel_join",
    title: "Kanala Katıl",
    description: `@${getAnnouncementChannel()} kanalına katıl`,
    icon: "📢",
    reward: { tl: 2, coins: 0 },
    type: "channel_join",     // verified server-side via getChatMember
    link: `https://t.me/${getAnnouncementChannel()}`,
  },
  {
    id: "task_ref_1",
    title: "İlk Davet",
    description: "1 arkadaşını davet et",
    icon: "👥",
    reward: { tl: 1, coins: 0 },
    type: "referral",
    required: 1,
  },
  {
    id: "task_ref_5",
    title: "5 Davet",
    description: "5 arkadaşını davet et",
    icon: "🤝",
    reward: { tl: 5, coins: 0 },
    type: "referral",
    required: 5,
  },
  {
    id: "task_ref_10",
    title: "10 Davet",
    description: "10 arkadaşını davet et",
    icon: "🏅",
    reward: { tl: 10, coins: 100 },
    type: "referral",
    required: 10,
  },
  {
    id: "task_ref_25",
    title: "25 Davet",
    description: "25 arkadaşını davet et",
    icon: "🥇",
    reward: { tl: 30, coins: 400 },
    type: "referral",
    required: 25,
  },
  {
    id: "task_share",
    title: "Oyunu Paylaş",
    description: "Oyunu arkadaşlarınla paylaş (Davet sayfasındaki paylaş butonu)",
    icon: "📤",
    reward: { tl: 0, coins: 20 },
    type: "share",
  },
  {
    id: "task_weekly_goal",
    title: "Haftalık Hedef",
    description: "7 gün üst üste giriş yap ve en az 3 görev tamamla",
    icon: "🏆",
    reward: { tl: 4, coins: 0 },
    type: "weekly_goal",
    requiredStreak: 7,
    requiredTasks: 3,
  },
] as const;

const OTHER_TASK_IDS = TASK_DEFS
  .filter(t => t.type !== "weekly_goal")
  .map(t => t.id);

// Grants the channel-join reward automatically (e.g. from a Telegram chat_member
// webhook event) without requiring the user to open the app and press "claim".
// Returns the granted reward, or null if the user doesn't exist or already claimed it.
export async function autoGrantChannelJoinReward(
  telegramId: string,
): Promise<{ tl: number; coins: number } | null> {
  const task = TASK_DEFS.find(t => t.id === "task_channel_join");
  if (!task) return null;

  const user = await db.query.usersTable.findFirst({
    where: eq(usersTable.telegramId, telegramId),
  });
  if (!user) return null;

  const alreadyClaimed = await db.query.achievementsTable.findFirst({
    where: and(
      eq(achievementsTable.userTelegramId, telegramId),
      eq(achievementsTable.achievementKey, task.id),
    ),
  });
  if (alreadyClaimed) return null;

  const updates: Record<string, unknown> = {};
  if (task.reward.tl > 0)    updates.balance = sql`${usersTable.balance} + ${task.reward.tl}`;
  if (task.reward.coins > 0) updates.coins   = sql`${usersTable.coins} + ${task.reward.coins}`;

  if (Object.keys(updates).length > 0) {
    await db.update(usersTable).set(updates).where(eq(usersTable.telegramId, telegramId));
  }

  await db.insert(achievementsTable).values({
    userTelegramId: telegramId,
    achievementKey: task.id,
  });

  return task.reward;
}

// GET /tasks/:telegramId — returns tasks with completion status
router.get("/:telegramId", async (req, res): Promise<void> => {
  try {
    const { telegramId } = req.params;
    if (!telegramId) { res.status(400).json({ error: "telegramId required" }); return; }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.telegramId, telegramId),
    });
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    const earned = await db.query.achievementsTable.findMany({
      where: eq(achievementsTable.userTelegramId, telegramId),
    });
    const earnedKeys = new Set(earned.map(a => a.achievementKey));
    const completedOtherTasksCount = OTHER_TASK_IDS.filter(id => earnedKeys.has(id)).length;

    const tasks = TASK_DEFS.map(t => {
      const completed = earnedKeys.has(t.id);

      if (t.type === "referral") {
        const progress = Math.min(user.totalReferrals, t.required);
        return {
          ...t, completed, progress, total: t.required,
          claimable: !completed && user.totalReferrals >= t.required,
        };
      }
      if (t.type === "weekly_goal") {
        const streakProgress = Math.min(user.streakCount, t.requiredStreak);
        const tasksProgress = Math.min(completedOtherTasksCount, t.requiredTasks);
        return {
          ...t, completed,
          progress: streakProgress === t.requiredStreak ? tasksProgress : streakProgress,
          total: streakProgress === t.requiredStreak ? t.requiredTasks : t.requiredStreak,
          claimable: !completed && user.streakCount >= t.requiredStreak && completedOtherTasksCount >= t.requiredTasks,
        };
      }
      // channel_join, share
      return {
        ...t, completed, progress: completed ? 1 : 0, total: 1,
        claimable: !completed,
      };
    });

    res.json({ tasks, totalReferrals: user.totalReferrals });
  } catch (err) {
    req.log.error({ err }, "tasks fetch failed");
    res.status(500).json({ error: "Görevler yüklenemedi" });
  }
});

// POST /tasks/claim — claim a task reward
router.post("/claim", async (req, res): Promise<void> => {
  try {
    const { telegramId, taskId } = req.body as { telegramId?: string; taskId?: string };
    if (!telegramId || !taskId) { res.status(400).json({ error: "telegramId ve taskId gerekli" }); return; }

    const task = TASK_DEFS.find(t => t.id === taskId);
    if (!task) { res.status(404).json({ error: "Görev bulunamadı" }); return; }

    const user = await db.query.usersTable.findFirst({
      where: eq(usersTable.telegramId, telegramId),
    });
    if (!user) { res.status(404).json({ error: "Kullanıcı bulunamadı" }); return; }

    // Already claimed?
    const alreadyClaimed = await db.query.achievementsTable.findFirst({
      where: and(
        eq(achievementsTable.userTelegramId, telegramId),
        eq(achievementsTable.achievementKey, taskId),
      ),
    });
    if (alreadyClaimed) { res.status(409).json({ error: "Bu görev zaten tamamlandı" }); return; }

    // Check referral requirement
    if (task.type === "referral" && user.totalReferrals < task.required) {
      res.status(400).json({ error: `Henüz ${task.required} davet tamamlanmadı (${user.totalReferrals}/${task.required})` });
      return;
    }

    // Check weekly goal requirement (streak + other completed tasks)
    if (task.type === "weekly_goal") {
      const earned = await db.query.achievementsTable.findMany({
        where: eq(achievementsTable.userTelegramId, telegramId),
      });
      const earnedKeys = new Set(earned.map(a => a.achievementKey));
      const completedOtherTasksCount = OTHER_TASK_IDS.filter(id => earnedKeys.has(id)).length;

      if (user.streakCount < task.requiredStreak || completedOtherTasksCount < task.requiredTasks) {
        res.status(400).json({
          error: `Henüz hedef tamamlanmadı (Seri: ${user.streakCount}/${task.requiredStreak}, Görev: ${completedOtherTasksCount}/${task.requiredTasks})`,
        });
        return;
      }
    }

    // Channel join is verified server-side via Telegram's getChatMember — no honor system
    if (task.type === "channel_join") {
      const channel = getAnnouncementChannel();
      const memberRes = await sendTelegramRequest("getChatMember", {
        chat_id: `@${channel}`,
        user_id: Number(telegramId),
      }) as { ok?: boolean; result?: { status?: string } } | null;

      const status = memberRes?.result?.status;
      const isMember = memberRes?.ok && status && !["left", "kicked"].includes(status);

      if (!isMember) {
        res.status(400).json({
          error: "Henüz kanala katılmadın. Katıl ve tekrar dene 📢",
          needsJoin: true,
          channelLink: `https://t.me/${channel}`,
        });
        return;
      }
    }

    // Grant reward
    const updates: Record<string, unknown> = {};
    if (task.reward.tl > 0)    updates.balance = sql`${usersTable.balance} + ${task.reward.tl}`;
    if (task.reward.coins > 0) updates.coins   = sql`${usersTable.coins} + ${task.reward.coins}`;

    if (Object.keys(updates).length > 0) {
      await db.update(usersTable).set(updates).where(eq(usersTable.telegramId, telegramId));
    }

    await db.insert(achievementsTable).values({
      userTelegramId: telegramId,
      achievementKey: taskId,
    });

    res.json({
      success: true,
      taskId,
      reward: task.reward,
      message: `✅ ${task.title} tamamlandı!`,
    });
  } catch (err) {
    req.log.error({ err }, "task claim failed");
    res.status(500).json({ error: "Sunucu hatası, tekrar dene" });
  }
});

export default router;
