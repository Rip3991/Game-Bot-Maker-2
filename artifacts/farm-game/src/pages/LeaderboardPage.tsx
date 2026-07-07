import React, { useState } from 'react';
import { useUser } from '../hooks/use-user';
import { useGetLeaderboard } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'wouter';
import mascotAvatar from '../assets/mascot-avatar.png';

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_STYLES = [
  // Gold #1
  {
    height: 128,
    bg: 'linear-gradient(180deg, #f5c842 0%, #c4832e 100%)',
    border: '#fbbf24',
    glow: 'rgba(251,191,36,0.55)',
    avatarBg: 'linear-gradient(135deg, #fde68a, #f59e0b)',
    avatarBorder: '#fbbf24',
    textColor: '#78350f',
    rank: '#1',
  },
  // Silver #2
  {
    height: 96,
    bg: 'linear-gradient(180deg, #d1d5db 0%, #6b7280 100%)',
    border: '#9ca3af',
    glow: 'rgba(156,163,175,0.4)',
    avatarBg: 'linear-gradient(135deg, #e5e7eb, #9ca3af)',
    avatarBorder: '#d1d5db',
    textColor: '#1f2937',
    rank: '#2',
  },
  // Bronze #3
  {
    height: 76,
    bg: 'linear-gradient(180deg, #fb923c 0%, #c2410c 100%)',
    border: '#f97316',
    glow: 'rgba(249,115,22,0.4)',
    avatarBg: 'linear-gradient(135deg, #fed7aa, #f97316)',
    avatarBorder: '#fb923c',
    textColor: '#7c2d12',
    rank: '#3',
  },
];
// Podium order: 2nd, 1st, 3rd
const PODIUM_ORDER = [1, 0, 2];

export default function LeaderboardPage() {
  const { telegramId } = useUser();
  const [, navigate] = useLocation();
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 100 });
  const [mascotVisible, setMascotVisible] = useState(true);

  const top3 = leaderboard?.slice(0, 3) || [];
  const rest = leaderboard?.slice(3) || [];
  const myRank = leaderboard?.findIndex(u => u.telegramId === telegramId);

  return (
    <div className="flex flex-col h-full overflow-hidden relative"
      style={{ background: 'linear-gradient(180deg, #0d1b2a 0%, #1a2e1a 55%, #2d4a1a 100%)' }}>

      {/* ── Stars ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {Array.from({ length: 22 }).map((_, i) => (
          <motion.div key={i}
            className="absolute rounded-full bg-white"
            style={{ width: 1 + Math.random() * 2, height: 1 + Math.random() * 2, top: `${Math.random() * 45}%`, left: `${Math.random() * 100}%` }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ repeat: Infinity, duration: 2 + Math.random() * 3, delay: Math.random() * 4 }}
          />
        ))}
      </div>

      {/* ── Header ── */}
      <div className="flex-shrink-0 z-10 px-4 pt-6 pb-2 flex items-center gap-3">
        {/* Mascot */}
        <motion.div className="relative flex-shrink-0" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
          <img src={mascotAvatar} alt="Sarı"
            className="w-12 h-12 rounded-full object-cover"
            style={{ border: '3px solid #fbbf24', boxShadow: '0 0 14px rgba(251,191,36,0.5)', background: '#f5c842' }} />
        </motion.div>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-white drop-shadow">Sıralama</h1>
          <p className="text-white/45 text-xs font-bold">En iyi çiftçiler yarışıyor 🏆</p>
        </div>
        {myRank != null && myRank >= 0 && (
          <div className="bg-yellow-400/15 border border-yellow-400/40 rounded-xl px-3 py-1.5 text-center">
            <div className="text-yellow-300 font-black text-lg leading-none">#{myRank + 1}</div>
            <div className="text-yellow-400/70 text-[9px] font-bold">Sıran</div>
          </div>
        )}
      </div>

      {/* ── Mascot encouragement ── */}
      <AnimatePresence>
        {mascotVisible && !isLoading && (
          <motion.div
            className="flex-shrink-0 z-10 mx-4 mb-1"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <div className="relative rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1a3d08, #2a5c14)', border: '1.5px solid rgba(100,210,50,0.35)' }}>
              <span className="text-lg flex-shrink-0">💬</span>
              <p className="text-green-200 text-xs font-bold flex-1 leading-snug">
                {top3[0]
                  ? `En tepede ${top3[0].firstName} var! Sen de coin kazan, sıralamaya gir! 🌾`
                  : 'Daha fazla coin kazan ve sıralamaya gir! 🌾'}
              </p>
              <button onClick={() => setMascotVisible(false)}
                className="flex-shrink-0 w-5 h-5 rounded-full bg-white/10 text-white/50 text-xs flex items-center justify-center active:opacity-70">
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Podium ── */}
      {isLoading ? (
        <div className="flex-shrink-0 h-52 flex items-center justify-center z-10">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            className="w-8 h-8 rounded-full border-3 border-t-yellow-400 border-white/20" style={{ border: '3px solid rgba(255,255,255,0.15)', borderTopColor: '#fbbf24' }} />
        </div>
      ) : (
        <div className="flex-shrink-0 z-10 px-3 pb-3">
          <div className="flex items-end justify-center gap-2">
            {PODIUM_ORDER.map((dataIdx, visualIdx) => {
              const user = top3[dataIdx];
              if (!user) return <div key={visualIdx} className="flex-1 max-w-[110px]" />;
              const s = PODIUM_STYLES[dataIdx];
              const isFirst = dataIdx === 0;
              return (
                <motion.div key={user.telegramId}
                  className="flex flex-col items-center flex-1 max-w-[120px] cursor-pointer"
                  initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: visualIdx * 0.1, type: 'spring', damping: 20 }}
                  onClick={() => navigate(`/profile/${user.telegramId}`)}>

                  {/* Crown / medal */}
                  <div className="text-2xl mb-[-6px] relative z-10">
                    {isFirst ? '👑' : MEDALS[dataIdx]}
                  </div>

                  {/* Avatar */}
                  <motion.div
                    className="rounded-full flex items-center justify-center font-black shadow-xl flex-shrink-0 relative z-10"
                    style={{
                      width: isFirst ? 56 : 44,
                      height: isFirst ? 56 : 44,
                      background: s.avatarBg,
                      border: `3px solid ${s.avatarBorder}`,
                      boxShadow: `0 0 16px ${s.glow}`,
                      color: s.textColor,
                      fontSize: isFirst ? 22 : 18,
                    }}
                    animate={isFirst ? { boxShadow: [`0 0 12px ${s.glow}`, `0 0 28px ${s.glow}`, `0 0 12px ${s.glow}`] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {user.firstName.charAt(0).toUpperCase()}
                  </motion.div>

                  {/* Podium block */}
                  <div className="w-full rounded-t-xl flex flex-col items-center pt-2 pb-1 px-1 mt-1 shadow-xl"
                    style={{ height: s.height, background: s.bg, border: `2px solid ${s.border}`, borderBottom: 'none', boxShadow: `0 -4px 14px ${s.glow}` }}>
                    <span className="font-black text-white drop-shadow text-base leading-none">{s.rank}</span>
                    <span className="text-xs font-bold text-white/90 text-center truncate w-full px-1 mt-0.5 leading-tight">
                      {user.firstName}
                    </span>
                    <div className="mt-1 bg-black/20 rounded-full px-2 py-0.5 flex items-center gap-1">
                      <span className="text-[9px]">🪙</span>
                      <span className="text-[10px] font-black text-white">{fmtNum(user.coins)}</span>
                    </div>
                    {user.streakCount > 0 && (
                      <div className="mt-0.5 flex items-center gap-0.5">
                        <span className="text-[9px]">🔥</span>
                        <span className="text-white/80 font-bold text-[9px]">{user.streakCount}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Rest of list ── */}
      <div className="flex-1 z-10 flex flex-col overflow-hidden"
        style={{ background: 'rgba(0,0,0,0.45)', borderTop: '2px solid rgba(255,255,255,0.08)', borderRadius: '24px 24px 0 0' }}>

        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-2 mb-1 flex-shrink-0" />

        <div className="flex-1 overflow-y-auto pb-24" style={{ scrollbarWidth: 'none' }}>
          {!isLoading && rest.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-white/40 text-sm font-bold">
              <span className="text-3xl">🏆</span>
              Henüz yeterli oyuncu yok.
            </div>
          )}
          {!isLoading && rest.map((user, index) => {
            const rank = index + 4;
            const isMe = user.telegramId === telegramId;
            return (
              <motion.div
                key={user.telegramId}
                initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => navigate(`/profile/${user.telegramId}`)}
                className="flex items-center mx-3 mb-2 rounded-xl cursor-pointer active:scale-[0.98] transition-all"
                style={isMe
                  ? { background: 'linear-gradient(135deg, rgba(196,131,46,0.35), rgba(139,92,30,0.25))', border: '1.5px solid #f5c842', boxShadow: '0 0 12px rgba(251,191,36,0.2)', padding: '10px 12px' }
                  : { background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.08)', padding: '10px 12px' }}
              >
                {/* Rank badge */}
                <div className="w-8 flex-shrink-0 text-center">
                  <span className={`font-black text-sm ${isMe ? 'text-yellow-400' : 'text-white/40'}`}>
                    {rank <= 10 ? `#${rank}` : `${rank}`}
                  </span>
                </div>

                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-base flex-shrink-0 ml-1 mr-3 shadow"
                  style={isMe
                    ? { background: 'linear-gradient(135deg, #f5c842, #c4832e)', color: '#78350f', border: '2px solid #fbbf24' }
                    : { background: 'rgba(255,255,255,0.12)', color: 'white', border: '1.5px solid rgba(255,255,255,0.15)' }}>
                  {user.firstName.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col min-w-0">
                  <span className={`font-bold text-sm truncate leading-none ${isMe ? 'text-yellow-300' : 'text-white'}`}>
                    {user.firstName}{isMe ? ' 👈 Sen' : ''}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-yellow-400 font-black text-[10px]">🪙 {fmtNum(user.coins)}</span>
                    {user.streakCount > 0 && (
                      <span className="text-orange-400 font-bold text-[10px]">🔥 {user.streakCount}</span>
                    )}
                    {user.totalReferrals > 0 && (
                      <span className="text-blue-400 font-bold text-[10px]">👥 {user.totalReferrals}</span>
                    )}
                  </div>
                </div>

                {/* Arrow hint */}
                <span className="text-white/20 text-sm flex-shrink-0 ml-1">›</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
