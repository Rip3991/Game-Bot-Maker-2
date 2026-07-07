import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionConfig, SectionState } from '../hooks/use-game-engine';
import { ChevronDown, Lock, Plus, TrendingUp } from 'lucide-react';

interface FarmSectionProps {
  config: SectionConfig;
  sectionState: SectionState;
  balance: number;
  onUnlock: () => void;
  onBuy: () => void;
  defaultExpanded?: boolean;
}

export function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n < 10) return n.toFixed(2);
  return n.toFixed(0);
}

export const FarmSection: React.FC<FarmSectionProps> = ({
  config,
  sectionState,
  balance,
  onUnlock,
  onBuy,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const isLocked = !sectionState.unlocked;
  const canAffordUnlock = balance >= config.unlockCost;
  const canAffordBuy = balance >= config.unitCost;
  const isMaxed = sectionState.count >= config.maxUnits;
  const income = sectionState.count * config.baseRate;
  const fillPct = Math.round((sectionState.count / config.maxUnits) * 100);

  const categoryColor = config.category === 'farm'
    ? { border: '#4a7c2f', header: '#2e5c14', headerBright: '#3d7a1e', bodyBg: '#1e3d0a', accent: '#6db33f' }
    : { border: '#7c4f2f', header: '#5c3a21', headerBright: '#7a4e2e', bodyBg: '#3d2010', accent: '#d48c48' };

  return (
    <motion.div
      className="rounded-2xl overflow-hidden shadow-xl"
      style={{ border: `3px solid ${isLocked ? '#444' : categoryColor.border}` }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      {/* ── HEADER (always visible) — use div to avoid nested-button HTML violation ── */}
      <div
        role={isLocked ? undefined : 'button'}
        tabIndex={isLocked ? undefined : 0}
        className="flex items-center gap-3 px-3 py-2.5 select-none cursor-pointer active:brightness-90 transition-all"
        style={{ background: isLocked ? '#1a1a1a' : `linear-gradient(135deg, ${categoryColor.header}, ${categoryColor.headerBright})` }}
        onClick={() => { if (!isLocked) setExpanded(e => !e); }}
        onKeyDown={e => { if (!isLocked && (e.key === 'Enter' || e.key === ' ')) setExpanded(x => !x); }}
      >
        {/* Emoji */}
        <span className={`text-3xl flex-shrink-0 drop-shadow-md ${isLocked ? 'grayscale opacity-40' : ''}`}>
          {config.emoji}
        </span>

        {/* Info */}
        <div className="flex-1 min-w-0 text-left">
          <div className="font-extrabold text-white text-sm leading-tight tracking-wide truncate">
            {config.name}
          </div>
          {isLocked ? (
            <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
              🔒 Kilit: {formatNum(config.unlockCost)} TL gerekli
            </div>
          ) : (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-green-300 font-bold">
                {sectionState.count}/{config.maxUnits}
              </span>
              <div className="flex-1 h-1.5 bg-black/30 rounded-full overflow-hidden max-w-[60px]">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${fillPct}%`, background: categoryColor.accent }}
                />
              </div>
              <span className="text-[10px] text-yellow-300 font-bold">
                +{formatNum(income)}/dk
              </span>
            </div>
          )}
        </div>

        {/* Right: unlock button or chevron */}
        {isLocked ? (
          <button
            onClick={e => { e.stopPropagation(); onUnlock(); }}
            disabled={!canAffordUnlock}
            className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-[11px] border-2 transition-all active:scale-95 ${
              canAffordUnlock
                ? 'bg-yellow-400 border-yellow-600 text-yellow-900 shadow-lg'
                : 'bg-gray-700 border-gray-600 text-gray-500'
            }`}
          >
            <Lock size={9} />
            {formatNum(config.unlockCost)} TL
          </button>
        ) : (
          <ChevronDown
            size={18}
            className={`text-white/70 transition-transform duration-300 flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {/* ── EXPANDED BODY ── */}
      <AnimatePresence initial={false}>
        {expanded && !isLocked && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="flex" style={{ background: `linear-gradient(180deg, ${categoryColor.bodyBg}, #111)` }}>

              {/* Left: visual grid of owned units */}
              <div className="flex-1 p-3 flex flex-wrap content-start gap-1 min-h-[96px] relative overflow-hidden">
                {/* subtle scene decoration */}
                <span className="absolute top-1 right-2 text-2xl opacity-20 select-none">{config.scene[0]}</span>
                <span className="absolute bottom-1 left-1 text-xl opacity-15 select-none">{config.scene[1]}</span>

                <AnimatePresence>
                  {Array.from({ length: Math.min(sectionState.count, 16) }).map((_, i) => (
                    <motion.span
                      key={i}
                      className="text-xl drop-shadow-sm leading-none"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.025, type: 'spring', stiffness: 400 }}
                    >
                      {config.emoji}
                    </motion.span>
                  ))}
                </AnimatePresence>

                {sectionState.count > 16 && (
                  <span className="text-white/60 text-[10px] font-bold self-center ml-1">
                    +{sectionState.count - 16} daha
                  </span>
                )}

                {sectionState.count === 0 && (
                  <span className="text-white/30 text-[11px] font-bold italic">Henüz yok…</span>
                )}
              </div>

              {/* Right: action panel */}
              <div
                className="w-32 flex-shrink-0 flex flex-col items-stretch gap-2 p-2.5 border-l"
                style={{ borderColor: `${categoryColor.border}55`, background: 'rgba(0,0,0,0.25)' }}
              >
                {/* Stats */}
                <div className="text-center bg-black/30 rounded-xl p-1.5">
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Birim başı</div>
                  <div className="text-yellow-300 font-black text-xs">+{formatNum(config.baseRate)}/dk</div>
                </div>

                <div className="text-center bg-black/30 rounded-xl p-1.5">
                  <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Toplam</div>
                  <div className="text-green-300 font-black text-xs">{formatNum(income)} TL/dk</div>
                </div>

                {/* Buy button */}
                <button
                  onClick={onBuy}
                  disabled={isMaxed || !canAffordBuy}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2.5 rounded-xl border-2 font-black transition-all active:scale-95 ${
                    isMaxed
                      ? 'bg-gray-700/50 border-gray-600 text-gray-500'
                      : canAffordBuy
                        ? 'border-yellow-500 text-yellow-900 shadow-lg active:brightness-90'
                        : 'bg-red-900/30 border-red-700/50 text-red-400'
                  }`}
                  style={canAffordBuy && !isMaxed ? { background: 'linear-gradient(135deg, #f5c842, #e6a800)' } : {}}
                >
                  {isMaxed ? (
                    <>
                      <span className="text-base">🏆</span>
                      <span className="text-[9px]">DOLU</span>
                    </>
                  ) : (
                    <>
                      <Plus size={14} className={canAffordBuy ? 'text-yellow-900' : 'text-red-400'} />
                      <span className="text-[10px]">{formatNum(config.unitCost)} TL</span>
                      <span className="text-[9px] opacity-70">
                        {config.category === 'farm' ? '+1 tarla' : '+1 hayvan'}
                      </span>
                    </>
                  )}
                </button>

                {/* Progress bar */}
                <div>
                  <div className="text-[8px] text-gray-500 text-center mb-0.5">{sectionState.count}/{config.maxUnits} birim</div>
                  <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: categoryColor.accent }}
                      initial={{ width: 0 }}
                      animate={{ width: `${fillPct}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
