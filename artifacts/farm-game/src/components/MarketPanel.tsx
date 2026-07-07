import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SECTIONS, SaleRecord, GameState } from '../hooks/use-game-engine';
import { formatNum } from '../utils/format';

interface MarketPanelProps {
  storage: Record<string, number>;
  gameState: GameState;
  onSell: () => SaleRecord[];
}

export function MarketPanel({ storage, gameState, onSell }: MarketPanelProps) {
  const [lastSale, setLastSale] = useState<SaleRecord[] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);

  const storedItems = SECTIONS.filter(cfg => Math.floor(storage[cfg.id] ?? 0) > 0);
  const hasAnything = storedItems.length > 0;

  const grandTotal = storedItems.reduce(
    (s, cfg) => s + Math.floor(storage[cfg.id] ?? 0) * cfg.sellPrice,
    0,
  );

  const handleSell = () => {
    const records = onSell();
    if (records.length === 0) return;
    const total = records.reduce((s, r) => s + r.total, 0);
    setLastSale(records);
    setTotalEarned(total);
    setShowResult(true);
    setTimeout(() => setShowResult(false), 4000);
  };

  const unlockedSections = SECTIONS.filter(cfg => gameState.sections[cfg.id]?.unlocked);

  return (
    <div
      className="flex-shrink-0 relative"
      style={{ background: 'linear-gradient(180deg, #0a2008 0%, #122e0d 100%)', borderBottom: '2px solid rgba(255,255,255,0.08)' }}
    >
      {/* Sale result popup */}
      <AnimatePresence>
        {showResult && lastSale && (
          <motion.div
            className="absolute inset-x-2 top-1 z-50"
            initial={{ y: -8, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.95 }}
          >
            <div
              className="rounded-2xl border-2 border-yellow-400 shadow-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #1a3d08, #2e6012)' }}
            >
              <div className="bg-yellow-400/20 px-3 py-1.5 flex items-center justify-between">
                <span className="font-black text-yellow-300 text-xs">🎉 Satış Tamamlandı!</span>
                <span className="font-black text-yellow-300 text-base">+{formatNum(totalEarned)} TL</span>
              </div>
              <div className="px-2 py-1.5 flex flex-wrap gap-1.5">
                {lastSale.map(r => (
                  <div key={r.id} className="flex items-center gap-1 bg-black/30 rounded-lg px-2 py-1">
                    <span className="text-sm">{r.emoji}</span>
                    <div className="text-[10px]">
                      <div className="font-black text-white">{r.qty} adet</div>
                      <div className="text-green-300 font-bold">{formatNum(r.total)} TL</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel header */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-1">
        <span className="text-sm">🏪</span>
        <span className="font-black text-green-300 text-[11px] uppercase tracking-widest">Pazar Yeri</span>
        <div className="flex-1" />
        {unlockedSections.map(cfg => (
          <div key={cfg.id} className="flex items-center gap-0.5">
            <span className="text-[10px]">{cfg.emoji}</span>
            <span className="text-[9px] font-bold text-yellow-400/70">{formatNum(cfg.sellPrice)}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-2 px-2 pb-2 items-center">
        {/* Depo → Satış flow */}
        <div className="flex-1 flex items-center gap-1 min-w-0">
          {/* Depo label */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <span className="text-base">🏚️</span>
            <span className="text-[8px] text-white/40 font-bold">Depo</span>
          </div>

          {/* Arrow */}
          <div className="flex-shrink-0 text-white/30 text-xs">→</div>

          {/* Stored products */}
          <div className="flex-1 flex flex-wrap gap-1 overflow-hidden">
            {storedItems.length === 0 ? (
              <div className="text-white/30 text-[10px] italic py-1">
                Henüz ürün yok...
              </div>
            ) : (
              storedItems.map(cfg => {
                const qty = Math.floor(storage[cfg.id] ?? 0);
                return (
                  <motion.div
                    key={cfg.id}
                    layout
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-0.5 rounded-lg px-1.5 py-0.5 border border-green-500/20"
                    style={{ background: 'rgba(34,197,94,0.07)' }}
                  >
                    <span className="text-xs">{cfg.emoji}</span>
                    <span className="text-white font-black text-[10px]">{qty}</span>
                    <span className="text-yellow-400 font-bold text-[9px]">×{formatNum(cfg.sellPrice)}</span>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Arrow to sales */}
          {hasAnything && (
            <div className="flex-shrink-0 text-green-400/60 text-xs animate-pulse">→</div>
          )}

          {/* Sales point label */}
          <div className="flex-shrink-0 flex flex-col items-center">
            <span className="text-base">💰</span>
            <span className="text-[8px] text-white/40 font-bold">Satış</span>
          </div>
        </div>

        {/* Sell button */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1 w-[76px]">
          {hasAnything && (
            <motion.div
              key={grandTotal}
              initial={{ scale: 1.2, color: '#fbbf24' }}
              animate={{ scale: 1 }}
              className="font-black text-[11px] text-center leading-tight text-yellow-300"
            >
              {formatNum(grandTotal)} TL
            </motion.div>
          )}

          {/* Outer glow ring when ready */}
          <div className="relative w-full">
            {hasAnything && (
              <>
                {/* Animated ring */}
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.18, 1] }}
                  transition={{ repeat: Infinity, duration: 1.1, ease: 'easeInOut' }}
                  style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.7) 0%, transparent 70%)', pointerEvents: 'none' }}
                />
                {/* Bouncing arrow above button */}
                <motion.div
                  className="absolute -top-5 left-1/2 -translate-x-1/2 text-base pointer-events-none select-none"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 0.7, ease: 'easeInOut' }}
                >
                  👆
                </motion.div>
              </>
            )}

            <motion.button
              onClick={handleSell}
              disabled={!hasAnything}
              whileTap={hasAnything ? { scale: 0.88 } : undefined}
              animate={hasAnything
                ? { scale: [1, 1.07, 1], y: [0, -2, 0] }
                : { scale: 1 }}
              transition={hasAnything
                ? { repeat: Infinity, duration: 0.9, ease: 'easeInOut' }
                : undefined}
              className="relative w-full py-2.5 rounded-xl font-black text-sm border-2 transition-colors"
              style={hasAnything ? {
                background: 'linear-gradient(180deg, #4ade80, #16a34a)',
                borderColor: '#86efac',
                color: 'white',
                textShadow: '0 1px 4px rgba(0,0,0,0.6)',
                boxShadow: '0 4px 0 #14532d, 0 0 18px rgba(34,197,94,0.65), 0 0 36px rgba(34,197,94,0.3)',
                letterSpacing: '0.04em',
              } : {
                background: 'rgba(255,255,255,0.04)',
                borderColor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.25)',
              }}
            >
              {hasAnything ? '💰 SAT!' : '⏳'}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
