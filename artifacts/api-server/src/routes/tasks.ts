import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db, usersTable, achievementsTable } from "@workspace/db";

const router = Router();

// Task definitions — claimable once per user
export const TASK_DEFS = [
  {
    id: "task_channel_join",
    title: "Kanala Katıl",
    description: "@sarınoyunçiftliği kanalına katıl",
    icon: "📢",
    reward: { tl: 10, coins: 0 },
    type: "claim",     // user just presses claim (honor system)
    link: "https://t.me/sarınoyunçiftliği",
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
router.get("/tasks/:telegramId", async (req, res): Promise<void> => {
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
      claimable: !completed && (t.type === "claim" || (t.type === "referral" && user.totalReferrals >= t.required)),
    };
  });

  res.json({ tasks, totalReferrals: user.totalReferrals });
});

// POST /tasks/claim — claim a task reward
router.post("/tasks/claim", async (req, res): Promise<void> => {
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
