import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, usersTable, achievementsTable } from "@workspace/db";
import { sendTelegramRequest } from "../lib/telegram";

const router = Router();

function getAnnouncementChannel(): string {
  const raw = process.env.ANNOUNCEMENT_CHANNEL ?? "sarinoyunçiftligi";
  return raw.replace(/^@/, "");
}

// Task definitions — claimable once per user
export const TASK_DEFS = [
  {
    id: "task_channel_join",
    title: "Kanala Katıl",
    description: `@${getAnnouncementChannel()} kanalına katıl`,
    icon: "📢",
    reward: { tl: 10, coins: 0 },
    type: "channel_join",     // verified server-side via getChatMember
    link: `https://t.me/${getAnnouncementChannel()}`,
  },
  {
    id: "task_ref_1",
    title: "İlk Davet",
    description: "1 arkadaşını davet et",
    icon: "👥",
    reward: { tl: 5, coins: 0 },
    type: "referral",
    required: 1,
  },
  {
    id: "task_ref_5",
    title: "5 Davet",
    description: "5 arkadaşını davet et",
    icon: "🤝",
    reward: { tl: 25, coins: 0 },
    type: "referral",
    required: 5,
  },
  {
    id: "task_ref_10",
    title: "10 Davet",
    description: "10 arkadaşını davet et",
    icon: "🏅",
    reward: { tl: 50, coins: 500 },
    type: "referral",
    required: 10,
  },
  {
    id: "task_ref_25",
    title: "25 Davet",
    description: "25 arkadaşını davet et",
    icon: "🥇",
    reward: { tl: 150, coins: 2000 },
    type: "referral",
    required: 25,
  },
] as const;

// GET /tasks/:telegramId — returns tasks with completion status
router.get("/:telegramId", async (req, res): Promise<void> => {
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

  const tasks = TASK_DEFS.map(t => {
    const completed = earnedKeys.has(t.id);
    let progress = 0;
    if (t.type === "referral") {
      progress = Math.min(user.totalReferrals, t.required);
    }
    return {
      ...t,
      completed,
      progress: t.type === "referral" ? progress : (completed ? 1 : 0),
      total: t.type === "referral" ? t.required : 1,
      claimable: !completed && (t.type === "channel_join" || (t.type === "referral" && user.totalReferrals >= t.required)),
    };
  });

  res.json({ tasks, totalReferrals: user.totalReferrals });
});

// POST /tasks/claim — claim a task reward
router.post("/claim", async (req, res): Promise<void> => {
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
});

export default router;
