import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import mascotFull from '../assets/mascot-full.png';

const MESSAGES = [
  "🐄 İnekler sağılıyor...",
  "🌾 Buğday tarlası hazırlanıyor...",
  "🐔 Tavuklar yumurtlıyor...",
  "🌽 Mısırlar hasat ediliyor...",
  "🐑 Koyunlar ağıla alınıyor...",
  "🚜 Traktör park ediliyor...",
  "☀️ Güneş doğuyor...",
  "🍀 Şans getiriliyor...",
];

export default function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    // Animate progress 0→100 over ~2.4s with easing
    const start = performance.now();
    const duration = 2400;

    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const pct = Math.round(eased * 100);
      setProgress(pct);

      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        if (!done.current) {
          done.current = true;
          setTimeout(onDone, 200);
        }
      }
    };
    requestAnimationFrame(tick);
  }, [onDone]);

  // Cycle loading messages
  useEffect(() => {
    const t = setInterval(() => {
      setMsgIdx(i => (i + 1) % MESSAGES.length);
    }, 420);
    return () => clearInterval(t);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 flex flex-col items-center justify-center z-[9999]"
      style={{ background: 'linear-gradient(180deg, #2e6012 0%, #4ea824 55%, #74c04a 100%)' }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {/* Sky area */}
      <div className="absolute inset-x-0 top-0" style={{ height: '45%', background: 'linear-gradient(180deg, #2e6db4 0%, #5bb3e8 60%, #a8d8f0 100%)' }}>
        {/* Sun */}
        <motion.div
          className="absolute text-5xl select-none"
          style={{ top: 18, right: 28 }}
          animate={{ filter: ['drop-shadow(0 0 8px #fbbf24)', 'drop-shadow(0 0 20px #f59e0b)', 'drop-shadow(0 0 8px #fbbf24)'] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >☀️</motion.div>

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

      {/* Ground strip */}
      <div className="absolute inset-x-0" style={{ top: '45%', height: 32, background: 'linear-gradient(180deg, #6acf38 0%, #4ea824 100%)' }} />

      {/* Fence */}
      <div className="absolute inset-x-0" style={{ top: 'calc(45% + 32px)', height: 10, background: 'linear-gradient(90deg, #8b5c1e, #c4832e, #8b5c1e)' }} />

      {/* Trees */}
      <div className="absolute" style={{ top: 'calc(45% - 30px)', left: 12, fontSize: 40 }}>🌳</div>
      <div className="absolute" style={{ top: 'calc(45% - 22px)', right: 12, fontSize: 36 }}>🌳</div>

      {/* Mascot */}
      <div className="relative z-10 flex flex-col items-center" style={{ marginTop: '-10%' }}>
        <motion.img
          src={mascotFull}
          alt="Sarı"
          className="w-44 h-44 object-contain drop-shadow-2xl"
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        />

        {/* Speech bubble */}
        <motion.div
          key={msgIdx}
          initial={{ opacity: 0, y: 6, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="relative mt-1 bg-white rounded-2xl px-5 py-2 shadow-xl border-2 border-yellow-400"
        >
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l-2 border-t-2 border-yellow-400 rotate-45" />
          <span className="font-black text-[#5c3a21] text-sm">{MESSAGES[msgIdx]}</span>
        </motion.div>
      </div>

      {/* Progress section */}
      <div className="relative z-10 w-72 mt-8 flex flex-col items-center gap-3">
        {/* Title */}
        <div className="text-center">
          <div className="font-black text-white text-2xl drop-shadow-lg tracking-wide">Sarı'nın Çiftliği</div>
          <div className="text-white/70 text-xs font-bold mt-0.5">Çiftlik hazırlanıyor...</div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-5 rounded-full border-2 border-black/25 shadow-inner overflow-hidden"
          style={{ background: 'rgba(0,0,0,0.35)' }}>
          <motion.div
            className="h-full rounded-full relative overflow-hidden"
            style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #f5c842, #e6a800)' }}
            transition={{ ease: 'linear' }}
          >
            {/* Shine sweep */}
            <motion.div
              className="absolute inset-y-0 w-12 bg-white/40 skew-x-[-20deg]"
              animate={{ x: ['-100%', '300%'] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
          </motion.div>
        </div>

        {/* Percentage */}
        <div className="font-black text-3xl text-yellow-300 drop-shadow-lg tabular-nums">
          {progress}%
        </div>

        {/* Bouncing dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-yellow-300"
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 0.7, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
