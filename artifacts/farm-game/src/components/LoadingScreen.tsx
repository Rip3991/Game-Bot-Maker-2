import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mascotFull from '../assets/mascot-full.png';

const PHASES = [
  {
    msgs: [
      "🌾 Tarlalar hazırlanıyor...",
      "🐄 İnekler sağılıyor...",
      "🌽 Mısırlar hasat ediliyor...",
    ],
    emoji: '🚜',
    mascotAnim: { y: [0, -10, 0], rotate: [0, 0, 0] },
    mascotDur: 1.8,
  },
  {
    msgs: [
      "🐔 Tavuklar yumurtluyor...",
      "🐑 Koyunlar ağıla alınıyor...",
      "🍀 Şans getiriliyor...",
    ],
    emoji: '🌟',
    mascotAnim: { y: [0, -14, 2, -10, 0], rotate: [-8, 8, -8, 8, 0] },
    mascotDur: 1.2,
  },
  {
    msgs: [
      "☀️ Güneş doğuyor...",
      "🎉 Çiftlik açılıyor!",
      "🚀 Hazır olun!",
    ],
    emoji: '🎊',
    mascotAnim: { y: [0, -18, 0, -18, 0], scale: [1, 1.08, 1, 1.08, 1] },
    mascotDur: 0.9,
  },
];

// Floating sparkle particles
function Sparkle({ x, y, delay, size }: { x: string; y: string; delay: number; size: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: x, top: y, fontSize: size }}
      initial={{ opacity: 0, scale: 0, y: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1, 0], y: [-20, -60] }}
      transition={{ repeat: Infinity, duration: 2.2, delay, ease: 'easeOut' }}
    >
      ✨
    </motion.div>
  );
}

const SPARKLES = [
  { x: '20%',  y: '42%', delay: 0,    size: 14 },
  { x: '75%',  y: '38%', delay: 0.7,  size: 10 },
  { x: '55%',  y: '50%', delay: 1.4,  size: 12 },
  { x: '30%',  y: '55%', delay: 0.3,  size: 8  },
  { x: '65%',  y: '48%', delay: 1.8,  size: 16 },
  { x: '12%',  y: '50%', delay: 1.1,  size: 10 },
  { x: '85%',  y: '52%', delay: 0.5,  size: 12 },
];

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const done = useRef(false);
  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const phaseIdx = progress < 34 ? 0 : progress < 67 ? 1 : 2;
  const phase = PHASES[phaseIdx];
  const msgs = phase.msgs;

  useEffect(() => {
    const start = performance.now();
    const duration = 2600;
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const pct = Math.round(eased * 100);
      setProgress(pct);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        if (!done.current) {
          done.current = true;
          timerRef.current = setTimeout(onDone, 300);
        }
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, [onDone]);

  // Cycle messages within current phase
  useEffect(() => {
    const t = setInterval(() => {
      setMsgIdx(i => (i + 1) % msgs.length);
    }, 500);
    return () => clearInterval(t);
  }, [msgs]);

  // Progress bar color
  const barColor = progress < 34
    ? 'linear-gradient(90deg, #4ade80, #22c55e)'
    : progress < 67
    ? 'linear-gradient(90deg, #f5c842, #e6a800)'
    : 'linear-gradient(90deg, #f97316, #ef4444)';

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-[9999] overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #2e6012 0%, #4ea824 55%, #74c04a 100%)' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {/* Sky */}
      <div className="absolute inset-x-0 top-0" style={{ height: '45%', background: 'linear-gradient(180deg, #1e4d8a 0%, #3d8fd4 60%, #8acde8 100%)' }}>
        {/* Sun with rays */}
        <motion.div
          className="absolute text-5xl select-none"
          style={{ top: 16, right: 24 }}
          animate={{ filter: ['drop-shadow(0 0 10px #fbbf24)', 'drop-shadow(0 0 24px #f59e0b)', 'drop-shadow(0 0 10px #fbbf24)'] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        >☀️</motion.div>

        {/* Stars (phase 2+) */}
        <AnimatePresence>
          {phaseIdx >= 1 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {['⭐', '🌟', '✨'].map((s, i) => (
                <motion.div key={i} className="absolute text-xl select-none"
                  style={{ top: `${10 + i * 12}%`, left: `${15 + i * 25}%` }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ repeat: Infinity, duration: 1.5 + i * 0.3, delay: i * 0.4 }}>
                  {s}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clouds */}
        {[
          { top: 14, size: 22, dur: 22, delay: 0 },
          { top: 36, size: 16, dur: 30, delay: -12 },
          { top: 8,  size: 18, dur: 26, delay: -7 },
        ].map((c, i) => (
          <motion.div
            key={i}
            className="absolute text-2xl opacity-80 select-none"
            style={{ top: c.top, fontSize: c.size }}
            animate={{ x: ['calc(-60px)', 'calc(110vw)'] }}
            transition={{ repeat: Infinity, duration: c.dur, delay: c.delay, ease: 'linear' }}
          >☁️</motion.div>
        ))}
      </div>

      {/* Ground */}
      <div className="absolute inset-x-0" style={{ top: '45%', height: 32, background: 'linear-gradient(180deg, #6acf38 0%, #4ea824 100%)' }} />

      {/* Fence */}
      <div className="absolute inset-x-0" style={{ top: 'calc(45% + 32px)', height: 10, background: 'linear-gradient(90deg, #8b5c1e, #c4832e, #8b5c1e)' }} />

      {/* Trees */}
      <motion.div
        className="absolute text-5xl select-none"
        style={{ top: 'calc(45% - 32px)', left: 10 }}
        animate={{ rotate: [-2, 2, -2] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >🌳</motion.div>
      <motion.div
        className="absolute text-4xl select-none"
        style={{ top: 'calc(45% - 24px)', right: 10 }}
        animate={{ rotate: [2, -2, 2] }}
        transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut', delay: 0.5 }}
      >🌳</motion.div>

      {/* Sparkles */}
      {SPARKLES.map((s, i) => <Sparkle key={i} {...s} />)}

      {/* Mascot area */}
      <div className="relative z-10 flex flex-col items-center" style={{ marginTop: '-8%' }}>
        {/* Phase badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseIdx}
            initial={{ opacity: 0, scale: 0.6, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: -10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            className="text-3xl mb-1 select-none"
          >
            {phase.emoji}
          </motion.div>
        </AnimatePresence>

        {/* Mascot with phase-specific animation */}
        <AnimatePresence mode="wait">
          <motion.img
            key={`mascot-${phaseIdx}`}
            src={mascotFull}
            alt="Sarı"
            className="w-44 h-44 object-contain drop-shadow-2xl"
            animate={phase.mascotAnim as any}
            transition={{ repeat: Infinity, duration: phase.mascotDur, ease: 'easeInOut' }}
          />
        </AnimatePresence>

        {/* Waving hand for phase 2 */}
        {phaseIdx === 2 && (
          <motion.div
            className="absolute text-2xl select-none"
            style={{ top: 28, right: 8 }}
            animate={{ rotate: [-20, 20, -20] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
          >👋</motion.div>
        )}

        {/* Speech bubble */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`msg-${phaseIdx}-${msgIdx}`}
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative mt-1 rounded-2xl px-5 py-2 shadow-2xl"
            style={{ background: 'white', border: '2.5px solid #f5c842', boxShadow: '0 4px 20px rgba(245,200,66,0.4)' }}
          >
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45"
              style={{ border: '2px solid #f5c842', borderBottom: 'none', borderRight: 'none' }}
            />
            <span className="font-black text-[#5c3a21] text-sm whitespace-nowrap">
              {msgs[msgIdx % msgs.length]}
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress section */}
      <div className="relative z-10 w-72 mt-6 flex flex-col items-center gap-3">
        <div className="text-center">
          <div className="font-black text-white text-2xl drop-shadow-lg tracking-wide">Sarı'nın Çiftliği</div>
          <div className="text-white/60 text-xs font-bold mt-0.5">
            {phaseIdx === 0 ? 'Çiftlik hazırlanıyor...' : phaseIdx === 1 ? 'Hayvanlar uyanıyor...' : 'Son hazırlıklar! 🎉'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-5 rounded-full border-2 border-black/20 shadow-inner overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.35)' }}>
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            style={{ width: `${progress}%`, background: barColor }}
            transition={{ ease: 'linear' }}
          >
            <motion.div
              className="absolute inset-y-0 w-12 bg-white/35 skew-x-[-20deg]"
              animate={{ x: ['-100%', '350%'] }}
              transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
            />
          </motion.div>
        </div>

        {/* Percentage + dots */}
        <div className="flex items-center gap-4">
          <motion.div
            key={Math.floor(progress / 10)}
            initial={{ scale: 1.3, color: '#fbbf24' }}
            animate={{ scale: 1 }}
            className="font-black text-3xl text-yellow-300 drop-shadow-lg tabular-nums"
          >
            {progress}%
          </motion.div>

          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-2.5 h-2.5 rounded-full"
                style={{ background: i <= phaseIdx ? '#fbbf24' : 'rgba(255,255,255,0.25)' }}
                animate={{ y: [0, -8, 0], scale: i === phaseIdx ? [1, 1.2, 1] : 1 }}
                transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
