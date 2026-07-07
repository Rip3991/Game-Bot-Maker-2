import React, { useEffect, useState, useRef } from 'react';
import { GameState, SECTIONS } from '../hooks/use-game-engine';

interface ConveyorBeltProps {
  state: GameState;
}

interface MovingItem {
  id: string;
  emoji: string;
  leftOffset: number;
  time: number;
}

export const ConveyorBelt: React.FC<ConveyorBeltProps> = ({ state }) => {
  const [items, setItems] = useState<MovingItem[]>([]);
  const nextId = useRef(0);

  // Spawner logic — one interval per unlocked section
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];

    SECTIONS.forEach(cfg => {
      const sec = state.sections[cfg.id];
      if (!sec?.unlocked || sec.count === 0) return;

      const ratePerSec = (sec.count * cfg.baseRate) / 60;
      const ms = Math.max(300, 1200 / ratePerSec);

      intervals.push(setInterval(() => {
        setItems(prev => {
          if (prev.length > 35) return prev;
          return [...prev, {
            id: `${cfg.id}-${nextId.current++}`,
            emoji: cfg.emoji,
            leftOffset: Math.random() * 36 - 18,
            time: Date.now(),
          }];
        });
      }, ms));
    });

    return () => intervals.forEach(clearInterval);
  }, [state.sections]);

  // Cleanup items older than 4 s
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setItems(prev => prev.filter(item => now - item.time < 4000));
    }, 1000);
    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="w-16 h-full border-l-2 border-white/10 bg-gradient-to-b from-[#0d1a05] to-[#1a2e08] relative flex flex-col shadow-[-4px_0_12px_rgba(0,0,0,0.4)] z-0 overflow-hidden">
      {/* Barn icon at top */}
      <div className="h-14 flex items-center justify-center bg-black/30 border-b border-white/10 flex-shrink-0">
        <span className="text-2xl drop-shadow-lg">🏚️</span>
      </div>

      {/* Belt area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Scrolling stripe texture */}
        <div className="absolute inset-0 opacity-10 pointer-events-none belt-stripe" />

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 top-0 h-6 bg-gradient-to-b from-black/50 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/50 to-transparent z-10 pointer-events-none" />

        {/* Floating items */}
        {items.map(item => (
          <div
            key={item.id}
            className="absolute text-xl drop-shadow-md z-5 will-change-transform select-none pointer-events-none"
            style={{
              left: `calc(50% + ${item.leftOffset}px)`,
              bottom: '-8%',
              transform: 'translateX(-50%)',
              animation: 'floatUp 4s linear forwards',
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp {
          0%   { transform: translate(-50%, 0) rotate(0deg); opacity: 0; }
          8%   { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translate(-50%, -110vh) rotate(360deg); opacity: 0; }
        }
        @keyframes stripeScroll {
          0%   { background-position: 0 0; }
          100% { background-position: 0 -40px; }
        }
        .belt-stripe {
          background-image: repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(255,255,255,0.6) 20px, rgba(255,255,255,0.6) 22px);
          background-size: 100% 200%;
          animation: stripeScroll 0.8s linear infinite;
        }
      `}</style>
    </div>
  );
};
