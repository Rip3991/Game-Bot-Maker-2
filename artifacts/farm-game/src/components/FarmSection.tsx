import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FarmType, FARM_CONFIG } from '../hooks/use-game-engine';

interface FarmSectionProps {
  type: FarmType;
  level: number;
  balance: number;
  onUpgrade: () => void;
}

export const FarmSection: React.FC<FarmSectionProps> = ({ type, level, balance, onUpgrade }) => {
  const config = FARM_CONFIG[type];
  const rate = level * config.baseRate;
  const upgradeCost = 5 * level;
  const isMax = level >= 10;
  const canAfford = balance >= upgradeCost;

  return (
    <motion.div 
      className="wood-panel relative flex flex-col p-3 z-10"
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Header Info */}
      <div className="flex justify-between items-center bg-[#5c3a21] bg-opacity-40 rounded-lg p-1.5 mb-2 border border-[#5c3a21]">
        <span className="font-extrabold text-white drop-shadow-md text-sm uppercase tracking-wider">{config.name}</span>
        <div className="flex gap-1.5 text-[10px] font-bold">
          <span className="bg-[#d48c48] border border-[#5c3a21] text-white px-2 py-0.5 rounded-full shadow-inner">
            Lvl {level}/10
          </span>
          <span className="bg-white border border-[#5c3a21] text-green-700 px-2 py-0.5 rounded-full">
            {rate}/min
          </span>
        </div>
      </div>

      {/* Visual Scene */}
      <div className="flex justify-center items-center py-5 relative overflow-hidden bg-black/10 rounded-lg inset-shadow-sm mb-3">
        <div className="absolute inset-0 border-b-4 border-black/10 pointer-events-none"></div>
        <span className="absolute left-3 text-3xl animate-sway drop-shadow-lg">🌲</span>
        <span className="absolute right-3 text-3xl animate-sway drop-shadow-lg" style={{ animationDelay: '1.5s' }}>🌳</span>
        
        <div className="flex gap-1 text-4xl animate-bounce-idle">
          <AnimatePresence>
            {Array.from({ length: Math.min(level, 5) }).map((_, i) => (
              <motion.span 
                key={i}
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="drop-shadow-lg"
              >
                {config.emoji}
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Upgrade Button */}
      <button 
        onClick={onUpgrade}
        disabled={isMax || !canAfford}
        className="wood-button py-2.5 px-3 flex justify-between items-center relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <span className="font-extrabold uppercase tracking-wide text-sm">
          {isMax ? 'Maxed Out' : '⬆️ Upgrade'}
        </span>
        {!isMax && (
          <span className={`font-bold px-2 py-1 rounded-md text-xs border ${canAfford ? 'bg-white text-orange-900 border-orange-200 shadow-sm' : 'bg-red-900/50 text-red-200 border-red-900/50'}`}>
            ${upgradeCost.toFixed(2)}
          </span>
        )}
      </button>
    </motion.div>
  );
};