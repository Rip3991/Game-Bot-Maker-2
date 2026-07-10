import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mascotFull from '../assets/mascot-full.png';

const PHASES = [
  {
    msgs: [
      "🌾 Tarlalar sürülüyor...",
      "🌱 Tohumlar ekiliyor...",
      "🚜 Traktör hazırlanıyor...",
    ],
    emoji: '🚜',
    mascotAnim: { y: [0, -8, 0], rotate: [-2, 2, -2] },
    mascotDur: 1.8,
  },
  {
    msgs: [
      "🐄 İnekler otluyor...",
      "🐔 Tavuklar besleniyor...",
      "🌻 Günebakanlar açıyor...",
    ],
    emoji: '🌟',
    mascotAnim: { y: [0, -12, 2, -10, 0], rotate: [-6, 6, -6, 6, 0] },
    mascotDur: 1.2,
  },
  {
    msgs: [
      "🚚 Ürünler yükleniyor...",
      "🎉 Çiftlik kapıları açılıyor!",
      "🚀 Başlıyoruz!",
    ],
    emoji: '🎊',
    mascotAnim: { y: [0, -20, 0, -20, 0], scale: [1, 1.1, 1, 1.1, 1] },
    mascotDur: 0.9,
  },
];

// Floating sparkle particles
function Sparkle({ x, y, delay, size }: { x: string; y: string; delay: number; size: number }) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none z-20"
      style={{ left: x, top: y, fontSize: size }}
      initial={{ opacity: 0, scale: 0, y: 0, rotate: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: [-20, -70], rotate: [0, 90] }}
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
    const duration = 2800; // slightly longer for more enjoyment
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
          timerRef.current = setTimeout(onDone, 400);
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
    }, 600);
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
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Sky */}
      <motion.div 
        className="absolute inset-x-0 top-0" 
        style={{ height: '45%', background: 'linear-gradient(180deg, #1e4d8a 0%, #3d8fd4 60%, #8acde8 100%)' }}
        animate={{ backgroundPosition: ['0% 0%', '0% 100%'] }}
      >
        {/* Sun with rays */}
        <motion.div
          className="absolute text-6xl select-none"
          style={{ top: '10%', right: '15%' }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ 
            y: 0, 
            opacity: 1,
            rotate: [0, 10, 0],
            filter: ['drop-shadow(0 0 15px #fbbf24)', 'drop-shadow(0 0 30px #f59e0b)', 'drop-shadow(0 0 15px #fbbf24)'] 
          }}
          transition={{ 
            y: { duration: 1, ease: "easeOut" },
            opacity: { duration: 1 },
            rotate: { repeat: Infinity, duration: 6, ease: "easeInOut" },
            filter: { repeat: Infinity, duration: 2.5 } 
          }}
        >☀️</motion.div>

        {/* Stars (phase 2+) */}
        <AnimatePresence>
          {phaseIdx >= 1 && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              {['⭐', '🌟', '✨'].map((s, i) => (
                <motion.div key={i} className="absolute text-2xl select-none"
                  style={{ top: `${15 + i * 15}%`, left: `${20 + i * 30}%` }}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4], rotate: [0, 45, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 + i * 0.4, delay: i * 0.3 }}>
                  {s}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clouds */}
        {[
          { top: '15%', size: 30, dur: 25, delay: 0 },
          { top: '30%', size: 22, dur: 35, delay: -15 },
          { top: '8%',  size: 26, dur: 28, delay: -8 },
          { top: '25%', size: 18, dur: 40, delay: -20 },
        ].map((c, i) => (
          <motion.div
            key={i}
            className="absolute opacity-90 select-none"
            style={{ top: c.top, fontSize: c.size }}
            animate={{ x: ['-20vw', '120vw'] }}
            transition={{ repeat: Infinity, duration: c.dur, delay: c.delay, ease: 'linear' }}
          >☁️</motion.div>
        ))}
      </motion.div>

      {/* Ground with Parallax */}
      <motion.div 
        className="absolute inset-x-0" 
        style={{ top: '45%', height: '55%', background: 'linear-gradient(180deg, #6acf38 0%, #4ea824 30%, #2e6012 100%)' }} 
        initial={{ y: 50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Distant Hills */}
        <div className="absolute top-0 left-[-10%] w-[120%] h-12 bg-[#5ab52a] rounded-t-[100%] opacity-60" />
        <div className="absolute top-2 left-[-20%] w-[140%] h-16 bg-[#4ea824] rounded-t-[100%] opacity-80" />
      </motion.div>

      {/* Fence */}
      <motion.div 
        className="absolute inset-x-0" 
        style={{ top: '45%', height: 12, background: 'linear-gradient(90deg, #8b5c1e, #c4832e, #8b5c1e)' }}
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      />

      {/* Moving Tractor */}
      <motion.div
        className="absolute text-5xl select-none z-10"
        style={{ top: 'calc(45% - 10px)' }}
        animate={{ 
          x: ['-20vw', '120vw'],
          y: [0, -2, 0, -1, 0]
        }}
        transition={{ 
          x: { repeat: Infinity, duration: 8, ease: "linear" },
          y: { repeat: Infinity, duration: 0.5, ease: "linear" }
        }}
      >🚜</motion.div>

      {/* Growing Crops */}
      <div className="absolute inset-x-0 top-[48%] flex justify-around px-8 z-10 pointer-events-none">
        {['🌾', '🌽', '🌻', '🥕', '🌾'].map((crop, i) => (
          <motion.div
            key={i}
            className="text-3xl select-none"
            initial={{ scale: 0, y: 20 }}
            animate={{ scale: [0, 1.2, 1], y: 0 }}
            transition={{ delay: 0.5 + i * 0.2, duration: 0.6, type: "spring" }}
          >
            {crop}
          </motion.div>
        ))}
      </div>

      {/* Trees */}
      <motion.div
        className="absolute text-6xl select-none z-10"
        style={{ top: 'calc(45% - 40px)', left: '5%' }}
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [-2, 2, -2] }}
        transition={{ scale: { duration: 0.6, type: "spring" }, rotate: { repeat: Infinity, duration: 3.5, ease: 'easeInOut' } }}
      >🌳</motion.div>
      <motion.div
        className="absolute text-5xl select-none z-10"
        style={{ top: 'calc(45% - 30px)', right: '8%' }}
        initial={{ scale: 0 }}
        animate={{ scale: 1, rotate: [2, -2, 2] }}
        transition={{ scale: { duration: 0.6, delay: 0.2, type: "spring" }, rotate: { repeat: Infinity, duration: 4, ease: 'easeInOut' } }}
      >🌲</motion.div>

      {/* Sparkles */}
      {SPARKLES.map((s, i) => <Sparkle key={i} {...s} />)}

      {/* Mascot area */}
      <div className="relative z-20 flex flex-col items-center" style={{ marginTop: '-12%' }}>
        {/* Phase badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={phaseIdx}
            initial={{ opacity: 0, scale: 0, rotate: -180 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0, rotate: 180 }}
            transition={{ type: 'spring', stiffness: 250, damping: 15 }}
            className="text-4xl mb-2 select-none filter drop-shadow-lg"
          >
            {phase.emoji}
          </motion.div>
        </AnimatePresence>

        {/* Mascot with phase-specific animation */}
        <AnimatePresence mode="wait">
          <motion.div
             key={`mascot-${phaseIdx}`}
             animate={phase.mascotAnim as any}
             transition={{ repeat: Infinity, duration: phase.mascotDur, ease: 'easeInOut' }}
             className="relative"
          >
            <motion.img
              src={mascotFull}
              alt="Sarı"
              className="w-48 h-48 object-contain drop-shadow-2xl"
            />
            {/* Waving hand for phase 2 */}
            {phaseIdx === 2 && (
              <motion.div
                className="absolute text-3xl select-none"
                style={{ top: 30, right: 0 }}
                animate={{ rotate: [-20, 25, -20], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 0.6 }}
              >👋</motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Speech bubble */}
        <div className="h-16 flex items-center justify-center mt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={`msg-${phaseIdx}-${msgIdx}`}
              initial={{ opacity: 0, y: 15, scale: 0.8, rotateX: -20 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, y: -10, scale: 0.9, rotateX: 20 }}
              transition={{ duration: 0.3, type: "spring" }}
              className="relative rounded-2xl px-6 py-2.5 shadow-2xl"
              style={{ background: 'white', border: '3px solid #f5c842', boxShadow: '0 8px 25px rgba(245,200,66,0.5)' }}
            >
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rotate-45"
                style={{ border: '3px solid #f5c842', borderBottom: 'none', borderRight: 'none' }}
              />
              <span className="font-black text-[#5c3a21] text-base whitespace-nowrap">
                {msgs[msgIdx % msgs.length]}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress section */}
      <motion.div 
        className="relative z-20 w-80 mt-8 flex flex-col items-center gap-4"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="text-center">
          <motion.div 
            className="font-black text-white text-3xl drop-shadow-xl tracking-wide"
            animate={{ textShadow: ["0px 2px 4px rgba(0,0,0,0.5)", "0px 2px 15px rgba(245,200,66,0.6)", "0px 2px 4px rgba(0,0,0,0.5)"] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >Sarı'nın Çiftliği</motion.div>
          <div className="text-white/80 text-sm font-bold mt-1 uppercase tracking-wider">
            {phaseIdx === 0 ? 'Çiftlik hazırlanıyor...' : phaseIdx === 1 ? 'Hayvanlar uyanıyor...' : 'Son hazırlıklar! 🎉'}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-6 rounded-full border-[3px] border-black/30 shadow-inner overflow-hidden relative"
          style={{ background: 'rgba(0,0,0,0.4)' }}>
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            style={{ width: `${progress}%`, background: barColor }}
            transition={{ ease: 'easeOut', duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-y-0 w-16 bg-white/40 skew-x-[25deg]"
              animate={{ x: ['-100%', '400%'] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
            {/* Additional bubbling overlay */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4zKSIvPjwvc3ZnPg==')] opacity-50" />
          </motion.div>
        </div>

        {/* Percentage + dots */}
        <div className="flex items-center gap-4">
          <motion.div
            key={Math.floor(progress / 10)}
            initial={{ scale: 1.4, color: '#fcd34d' }}
            animate={{ scale: 1, color: '#fbbf24' }}
            className="font-black text-4xl drop-shadow-2xl tabular-nums"
          >
            {progress}%
          </motion.div>

          <div className="flex gap-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-3 h-3 rounded-full"
                style={{ background: i <= phaseIdx ? '#fbbf24' : 'rgba(255,255,255,0.2)' }}
                animate={{ 
                  y: i === phaseIdx ? [0, -10, 0] : 0, 
                  scale: i === phaseIdx ? [1, 1.3, 1] : 1,
                  boxShadow: i <= phaseIdx ? '0 0 10px rgba(245,200,66,0.8)' : 'none'
                }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
