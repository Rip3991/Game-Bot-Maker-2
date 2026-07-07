import React, { useEffect, useState, useRef } from 'react';
import { GameState, FARM_CONFIG } from '../hooks/use-game-engine';

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

  // Spawner logic
  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];

    Object.entries(state.farms).forEach(([type, level]) => {
      const config = FARM_CONFIG[type as keyof typeof FARM_CONFIG];
      const ratePerSec = (level * config.baseRate) / 60;
      
      if (ratePerSec > 0) {
        // We limit visual spawn rate slightly so it doesn't get completely chaotic
        const ms = Math.max(250, 1000 / ratePerSec); 
        
        intervals.push(setInterval(() => {
          setItems(prev => {
            // Keep maximum 30 items on screen to prevent lag
            if (prev.length > 30) return prev;
            return [...prev, {
              id: `${type}-${nextId.current++}`,
              emoji: config.emoji,
              leftOffset: Math.random() * 40 - 20, // -20px to +20px offset
              time: Date.now()
            }];
          });
        }, ms));
      }
    });

    return () => intervals.forEach(clearInterval);
  }, [state.farms]);

  // Cleanup logic
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setItems(prev => prev.filter(item => now - item.time < 4000));
    }, 1000);
    return () => clearInterval(cleanup);
  }, []);

  return (
    <div className="w-24 h-full border-l-4 border-[#5c3a21] bg-[#455a64] relative flex flex-col shadow-[-5px_0_15px_rgba(0,0,0,0.3)] z-0">
      {/* Barn Header */}
      <div className="h-28 w-full bg-red-700 border-b-4 border-red-900 relative z-30 shadow-md flex items-end justify-center pb-2">
        {/* Barn Roof */}
        <div className="absolute top-0 left-0 right-0 h-12 bg-red-800" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
        <span className="text-5xl drop-shadow-xl z-10 animate-bounce-idle">🏚️</span>
      </div>

      {/* Belt Container */}
      <div className="flex-1 conveyor-bg conveyor-belt-texture overflow-hidden relative border-x-4 border-gray-600/30">
        {/* Shadow overlays for depth */}
        <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/40 to-transparent z-20"></div>
        <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 to-transparent z-20"></div>
        
        {/* Floating Items */}
        {items.map(item => (
          <div
            key={item.id}
            className="absolute text-3xl drop-shadow-md z-10 will-change-transform"
            style={{
              left: `calc(50% + ${item.leftOffset}px)`,
              bottom: '-10%',
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
          0% { transform: translate(-50%, 0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-50%, -120vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};