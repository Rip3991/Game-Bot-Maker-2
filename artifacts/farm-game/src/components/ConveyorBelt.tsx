import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { GameState, SECTIONS } from '../hooks/use-game-engine';
import { formatNum } from '../utils/format';

interface ConveyorBeltProps {
  state: GameState;
}

interface RisingItem {
  id: string;
  emoji: string;
  x: number;
  time: number;
}

export const ConveyorBelt: React.FC<ConveyorBeltProps> = ({ state }) => {
  const [items, setItems] = useState<RisingItem[]>([]);
  const nextId = useRef(0);

  const unlockedSections = SECTIONS.filter(s => {
    const sec = state.sections[s.id];
    return sec?.unlocked && sec.count > 0;
  });

  // Spawn rising product emojis based on production rate
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];

    SECTIONS.forEach(cfg => {
      const sec = state.sections[cfg.id];
      if (!sec?.unlocked || sec.count === 0) return;

      const ratePerSec = (sec.count * cfg.baseRate) / cfg.sellPrice / 60;
      const ms = Math.max(600, 2000 / ratePerSec);

      intervals.push(setInterval(() => {
        setItems(prev => {
          if (prev.length > 30) return prev;
          return [...prev, {
            id: `${cfg.id}-${nextId.current++}`,
            emoji: cfg.emoji,
            x: 15 + Math.random() * 70,
            time: Date.now(),
          }];
        });
      }, ms));
    });

    return () => intervals.forEach(clearInterval);
  }, [state.sections]);

  // Cleanup items older than 3.5s
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setItems(prev => prev.filter(item => now - item.time < 3500));
    }, 500);
    return () => clearInterval(cleanup);
  }, []);

  const totalStoredItems = SECTIONS.reduce((s, cfg) => {
    return s + Math.floor(state.storage[cfg.id] ?? 0);
  }, 0);

  return (
    <div
      className="w-[72px] flex-shrink-0 h-full border-l-2 border-white/10 relative flex flex-col overflow-hidden z-0"
      style={{ background: 'linear-gradient(180deg, #0a2008 0%, #0d2b0a 50%, #0a2008 100%)' }}
    >
      {/* Depo top */}
      <div
        className="h-16 flex flex-col items-center justify-center border-b-2 border-white/10 flex-shrink-0 gap-0.5 relative z-10"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5), rgba(0,0,0,0.2))' }}
      >
        <span className="text-2xl drop-shadow-lg">🏚️</span>
        <span className="text-[8px] font-black text-white/50 uppercase tracking-wide">Depo</span>
        {totalStoredItems > 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-full px-1.5 py-0.5">
            <span className="text-[8px] font-black text-yellow-300">{totalStoredItems}</span>
          </div>
        )}
      </div>

      {/* Rising area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Vertical rail lines */}
        <div className="absolute left-3 top-0 bottom-0 w-px opacity-10" style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 4px, transparent 4px, transparent 10px)' }} />
        <div className="absolute right-3 top-0 bottom-0 w-px opacity-10" style={{ background: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 4px, transparent 4px, transparent 10px)' }} />

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 bottom-0 h-8 pointer-events-none z-10" style={{ background: 'linear-gradient(to top, rgba(10,32,8,1), transparent)' }} />
        <div className="absolute inset-x-0 top-0 h-8 pointer-events-none z-10" style={{ background: 'linear-gradient(to bottom, rgba(10,32,8,1), transparent)' }} />

        {/* Rising product emojis */}
        {items.map(item => (
          <div
            key={item.id}
            className="absolute text-base select-none pointer-events-none will-change-transform"
            style={{
              left: `${item.x}%`,
              bottom: '-10%',
              transform: 'translateX(-50%)',
              animation: 'riseUp 3.5s ease-out forwards',
              filter: 'drop-shadow(0 0 4px rgba(255,220,80,0.5))',
            }}
          >
            {item.emoji}
          </div>
        ))}

        {/* Empty state */}
        {unlockedSections.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-30">
            <span className="text-2xl">🌱</span>
          </div>
        )}
      </div>

      {/* Storage breakdown — scrollable small list */}
      <div
        className="flex-shrink-0 border-t-2 border-white/10 px-1 py-1 flex flex-col gap-0.5 overflow-y-auto"
        style={{ maxHeight: 120, background: 'rgba(0,0,0,0.3)' }}
      >
        {unlockedSections.map(cfg => {
          const qty = Math.floor(state.storage[cfg.id] ?? 0);
          return (
            <div key={cfg.id} className="flex items-center gap-0.5 text-[9px]">
              <span>{cfg.emoji}</span>
              <span className="text-white/70 font-black flex-1 text-right tabular-nums">{qty}</span>
            </div>
          );
        })}
        {unlockedSections.length === 0 && (
          <div className="text-white/20 text-[8px] text-center">—</div>
        )}
      </div>

      {/* Satış bottom label */}
      <div
        className="h-[52px] flex flex-col items-center justify-center border-t-[3px] border-white/20 flex-shrink-0 gap-0.5 relative overflow-hidden"
        style={{ background: 'linear-gradient(0deg, #163d1e, #0a2008)' }}
      >
        <motion.div 
          className="absolute inset-0 opacity-40 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9InJnYmEoNzQsMjIyLDEyOCwwLjgpIi8+PC9zdmc+')] pointer-events-none"
          animate={{ y: [0, -20] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        
        <motion.div
          className="absolute inset-0 bg-green-500/20"
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        />

        <motion.div
          animate={{ scale: [1, 1.15, 1], y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="relative z-10 filter drop-shadow-[0_0_8px_rgba(74,222,128,0.8)] flex items-center justify-center"
        >
          <span className="text-2xl">🏪</span>
        </motion.div>
        
        <span className="relative z-10 text-[8px] font-black text-green-300 uppercase tracking-wider drop-shadow-md">
          SATIŞ
        </span>
        
        {/* Floating coins */}
        {[0, 1, 2].map((i) => (
           <motion.span
             key={i}
             className="absolute text-[8px] z-0"
             initial={{ opacity: 0, y: 15, x: (i - 1) * 10 }}
             animate={{ opacity: [0, 1, 0], y: -25, x: (i - 1) * 15 }}
             transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.4 }}
           >
             💵
           </motion.span>
        ))}
      </div>

      <style>{`
        @keyframes riseUp {
          0%   { transform: translateX(-50%) translateY(0px); opacity: 0; }
          8%   { opacity: 1; }
          85%  { opacity: 0.8; }
          100% { transform: translateX(-50%) translateY(-320px); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
