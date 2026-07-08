import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useUser } from '../hooks/use-user';

const API = `${import.meta.env.BASE_URL}api`;

interface TaskDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  reward: { tl: number; coins: number };
  type: string;
  link?: string;
  required?: number;
  completed: boolean;
  progress: number;
  total: number;
  claimable: boolean;
}

function RewardBadge({ tl, coins }: { tl: number; coins: number }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {tl > 0 && (
        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black"
          style={{ background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80' }}>
          💵 +{tl} TL
        </span>
      )}
      {coins > 0 && (
        <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black"
          style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.4)', color: '#fbbf24' }}>
          🪙 +{coins}
        </span>
      )}
    </div>
  );
}

export default function TasksPage() {
  const { telegramId } = useUser();
  const [tasks, setTasks] = useState<TaskDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [totalReferrals, setTotalReferrals] = useState(0);

  const fetchTasks = useCallback(async () => {
    if (!telegramId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/tasks/${telegramId}`);
      const data = await res.json();
      setTasks(data.tasks ?? []);
      setTotalReferrals(data.totalReferrals ?? 0);
    } catch {
      toast.error('Görevler yüklenemedi');
    }
    setLoading(false);
  }, [telegramId]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleClaim = async (task: TaskDef) => {
    if (!task.claimable || claiming) return;

    // For channel tasks, send straight to the channel — the bot verifies membership when claimed
    if (task.type === 'channel_join' && task.link) {
      window.open(task.link, '_blank');
    }

    setClaiming(task.id);
    try {
      const res = await fetch(`${API}/tasks/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, taskId: task.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsJoin) {
          toast.error(data.error ?? 'Önce kanala katıl');
        } else {
          toast.error(data.error ?? 'Hata oluştu');
        }
        return;
      }
      toast.success(data.message ?? '✅ Ödül alındı!');
      await fetchTasks();
    } catch {
      toast.error('Sunucu hatası');
    }
    setClaiming(null);
  };

  const completed = tasks.filter(t => t.completed).length;
  const totalTL = tasks.filter(t => t.completed).reduce((s, t) => s + t.reward.tl, 0);

  return (
    <div className="h-full flex flex-col" style={{ background: 'linear-gradient(180deg, #080c10 0%, #0d1505 100%)', color: 'white' }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="text-xl font-black text-white mb-0.5">📋 Görevler</div>
        <div className="text-white/40 text-xs">Görevleri tamamla, gerçek TL kazan</div>

        {/* Stats strip */}
        <div className="flex gap-2 mt-3">
          <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[10px] text-white/40 font-bold">Tamamlanan</div>
            <div className="text-white font-black">{completed}/{tasks.length}</div>
          </div>
          <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[10px] text-white/40 font-bold">Kazanılan TL</div>
            <div className="text-green-300 font-black">{totalTL} TL</div>
          </div>
          <div className="flex-1 rounded-xl p-2.5 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="text-[10px] text-white/40 font-bold">Davet</div>
            <div className="text-yellow-300 font-black">{totalReferrals} kişi</div>
          </div>
        </div>
      </div>

      {/* Referral TL info banner */}
      <div className="mx-4 mt-3 rounded-2xl p-3 flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(74,222,128,0.1), rgba(34,197,94,0.05))', border: '1px solid rgba(74,222,128,0.25)' }}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">👥</span>
          <div>
            <div className="font-black text-green-300 text-sm">Her davet = 10 TL!</div>
            <div className="text-white/50 text-[11px]">Arkadaşlarını davet et, her katılımda hesabına 10 TL gelir</div>
          </div>
        </div>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
        {loading ? (
          <div className="text-center text-white/30 py-12">Yükleniyor...</div>
        ) : (
          tasks.map((task, i) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-2xl p-4"
              style={task.completed
                ? { background: 'rgba(74,222,128,0.06)', border: '1.5px solid rgba(74,222,128,0.2)' }
                : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <div className="flex items-center gap-3">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl"
                  style={task.completed
                    ? { background: 'rgba(74,222,128,0.15)' }
                    : { background: 'rgba(255,255,255,0.06)' }}>
                  {task.completed ? '✅' : task.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-black text-white text-sm">{task.title}</span>
                    {task.completed && (
                      <span className="text-[9px] bg-green-500/20 border border-green-500/30 text-green-300 rounded-full px-1.5 py-0.5 font-bold">Tamamlandı</span>
                    )}
                  </div>
                  <div className="text-white/40 text-[11px] mt-0.5">{task.description}</div>
                  <div className="mt-1.5">
                    <RewardBadge tl={task.reward.tl} coins={task.reward.coins} />
                  </div>
                  {/* Progress bar for referral / weekly goal tasks */}
                  {(task.type === 'referral' || task.type === 'weekly_goal') && !task.completed && (
                    <div className="mt-2">
                      <div className="flex justify-between text-[10px] text-white/30 mb-1">
                        <span>İlerleme</span>
                        <span>{task.progress}/{task.total}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: 'linear-gradient(90deg, #4ade80, #22c55e)' }}
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (task.progress / task.total) * 100)}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Claim button */}
                <div className="flex-shrink-0">
                  <AnimatePresence mode="wait">
                    {task.completed ? (
                      <motion.div key="done" initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(74,222,128,0.15)' }}>
                        <span className="text-lg">✓</span>
                      </motion.div>
                    ) : task.claimable ? (
                      <motion.button
                        key="claim"
                        onClick={() => handleClaim(task)}
                        disabled={claiming === task.id}
                        whileTap={{ scale: 0.93 }}
                        className="px-3 py-2 rounded-xl font-black text-xs text-white transition-all"
                        style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', minWidth: 64 }}
                      >
                        {claiming === task.id ? '...' : 'Al'}
                      </motion.button>
                    ) : (
                      <div key="locked" className="px-3 py-2 rounded-xl text-xs font-bold text-center"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)', minWidth: 64 }}>
                        {task.type === 'referral' || task.type === 'weekly_goal' ? `${task.progress}/${task.total}` : 'Bekle'}
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
