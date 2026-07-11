import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SECTIONS, SaleRecord, GameState, DEPOT_LEVELS, getDepotCapacity, getNextDepotLevel } from '../hooks/use-game-engine';
import { formatNum } from '../utils/format';
import { useLocation } from 'wouter';
import { ShoppingBag, Zap, ArrowUpCircle, Package } from 'lucide-react';

interface MarketPanelProps {
  storage: Record<string, number>;
  gameState: GameState;
  onSell: () => SaleRecord[];
  autoSell: boolean;
  autoSellPurchased: boolean;
  onToggleAutoSell: () => void;
  onUpgradeDepot: () => void;
}

export function MarketPanel({ storage, gameState, onSell, autoSell, autoSellPurchased, onToggleAutoSell, onUpgradeDepot }: MarketPanelProps) {
  const [lastSale, setLastSale] = useState<SaleRecord[] | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [totalEarned, setTotalEarned] = useState(0);
  const [, navigate] = useLocation();

  const farmItems = SECTIONS.filter(cfg => cfg.category === 'farm' && Math.floor(storage[cfg.id] ?? 0) > 0);
  const animalItems = SECTIONS.filter(cfg => cfg.category === 'animal' && Math.floor(storage[cfg.id] ?? 0) > 0);
  const storedItems = SECTIONS.filter(cfg => Math.floor(storage[cfg.id] ?? 0) > 0);
  const hasAnything = storedItems.length > 0;

  const grandTotal = storedItems.reduce(
    (s, cfg) => s + Math.floor(storage[cfg.id] ?? 0) * cfg.sellPrice,
    0,
  );

  // Guards against the "have to tap twice" bug: onSell() mutates game state
  // via a functional setState updater, so if a render is already in flight
  // (e.g. the game-tick loop firing right as the user taps), a second rapid
  // tap could fire before state settles. A ref (not state) blocks re-entrancy
  // synchronously — a state flag would itself trigger a re-render and could
  // race with the very same tick that caused the double-fire.
  const isSellingRef = React.useRef(false);

  const handleSell = () => {
    if (isSellingRef.current) return;
    isSellingRef.current = true;
    const records = onSell();
    if (records.length > 0) {
      const total = records.reduce((s, r) => s + r.total, 0);
      setLastSale(records);
      setTotalEarned(total);
      setShowResult(true);
      setTimeout(() => setShowResult(false), 4000);
    }
    // Release on the next frame — long enough to swallow a duplicate tap
    // event, short enough to feel instant.
    requestAnimationFrame(() => { isSellingRef.current = false; });
  };

  const unlockedSections = SECTIONS.filter(cfg => gameState.sections[cfg.id]?.unlocked);

  const depotLevel = gameState.depotLevel ?? 1;
  const capacity = getDepotCapacity(depotLevel);
  const nextLevel = getNextDepotLevel(depotLevel);
  const distinctCount = storedItems.length;
  const isFull = distinctCount >= capacity;
  const canAffordUpgrade = nextLevel ? gameState.coins >= nextLevel.upgradeCost : false;

  // All capacity slots in order: filled ones first, then empty placeholders
  const allSlots: Array<typeof storedItems[0] | null> = [
    ...storedItems,
    ...Array(Math.max(0, capacity - distinctCount)).fill(null),
  ];

  return (
    <div
      className="flex-shrink-0 relative"
      style={{
        background: 'linear-gradient(180deg, #071a05 0%, #0d2a09 60%, #102d0b 100%)',
        borderBottom: '2px solid rgba(74,222,128,0.18)',
      }}
    >
      {/* Sale result popup */}
      <AnimatePresence>
        {showResult && lastSale && (
          <motion.div
            className="absolute inset-x-2 top-1 z-50"
            initial={{ y: -10, opacity: 0, scale: 0.93 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -8, opacity: 0, scale: 0.95 }}
          >
            <div
              className="rounded-2xl border-2 border-yellow-400/80 shadow-2xl overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #0f2d07, #1a5210)' }}
            >
              <div className="px-3 py-1.5 flex items-center justify-between border-b border-yellow-400/20"
                style={{ background: 'rgba(245,200,66,0.12)' }}>
                <span className="font-black text-yellow-300 text-xs flex items-center gap-1">
                  {autoSell ? <><Zap size={10} /> Otomatik Satış!</> : <>🎉 Satış Tamamlandı!</>}
                </span>
                <span className="font-black text-yellow-300 text-sm">+{formatNum(totalEarned)} 🪙</span>
              </div>
              <div className="px-2 py-1.5 flex flex-wrap gap-1.5">
                {lastSale.map(r => (
                  <div key={r.id} className="flex items-center gap-1 bg-black/30 rounded-lg px-2 py-1">
                    <span className="text-sm">{r.emoji}</span>
                    <div className="text-[10px]">
                      <div className="font-black text-white">{r.qty}×</div>
                      <div className="text-green-300 font-bold">{formatNum(r.total)} 🪙</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOP ROW: Header + price chips + auto-sell — all in one compact bar ── */}
      <div className="flex items-center gap-1.5 px-2.5 pt-1.5 pb-1">
        {/* Icon + label */}
        <ShoppingBag size={11} className="text-green-400/70 flex-shrink-0" />
        <span className="font-black text-white text-[10px] leading-none tracking-wider uppercase flex-shrink-0">Pazar</span>
        <span className="text-green-400/40 text-[8px] font-bold flex-shrink-0">{unlockedSections.length} ürün</span>

        {/* Scrollable price chips */}
        <div className="flex items-center gap-0.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {unlockedSections.map(cfg => (
            <div
              key={cfg.id}
              className="flex items-center gap-0.5 rounded-full px-1 py-0.5 flex-shrink-0"
              style={{
                background: cfg.category === 'farm' ? 'rgba(34,197,94,0.1)' : 'rgba(251,191,36,0.1)',
                border: cfg.category === 'farm' ? '1px solid rgba(34,197,94,0.18)' : '1px solid rgba(251,191,36,0.18)',
              }}
            >
              <span className="text-[9px] leading-none">{cfg.emoji}</span>
              <span className="text-[7px] font-black leading-none" style={{ color: cfg.category === 'farm' ? '#4ade80' : '#fbbf24' }}>
                {formatNum(cfg.sellPrice)}
              </span>
            </div>
          ))}
        </div>

        {/* Auto-sell toggle */}
        {!autoSellPurchased ? (
          <button
            onClick={() => navigate('/stars')}
            className="flex items-center gap-0.5 rounded-full px-2 py-0.5 flex-shrink-0 active:scale-90"
            style={{ background: 'rgba(255,200,0,0.06)', border: '1px solid rgba(255,200,0,0.2)' }}
          >
            <span className="text-[9px]">🔒</span>
            <span className="font-black text-[8px] text-yellow-400/50">OTO</span>
          </button>
        ) : (
          <button
            onClick={onToggleAutoSell}
            className="flex items-center gap-0.5 rounded-full px-2 py-0.5 flex-shrink-0 active:scale-90"
            style={autoSell ? {
              background: 'linear-gradient(135deg, #15803d, #166534)',
              border: '1px solid #4ade80',
              boxShadow: '0 0 8px rgba(74,222,128,0.35)',
            } : {
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Zap size={8} style={{ color: autoSell ? '#bbf7d0' : 'rgba(255,255,255,0.3)' }} />
            <span className="font-black text-[8px]" style={{ color: autoSell ? '#bbf7d0' : 'rgba(255,255,255,0.3)' }}>
              {autoSell ? 'AÇIK' : 'OTO'}
            </span>
          </button>
        )}
      </div>

      {/* ── DEPO AREA ── */}
      <div className="px-2 pb-2.5">
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'rgba(0,0,0,0.28)',
            border: isFull ? '1px solid rgba(239,68,68,0.35)' : '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* ── Header row: icon + level + capacity bar + upgrade btn ── */}
          <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-white/5">
            <Package size={11} className="text-white/40 flex-shrink-0" />
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Depo</span>

            {/* Level badge */}
            <div
              className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5"
              style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.3)' }}
            >
              <span className="text-[8px] font-black text-purple-300">Sv.{depotLevel}</span>
            </div>

            {/* Capacity fill dots */}
            <div className="flex gap-0.5 flex-1">
              {Array.from({ length: capacity }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 flex-1 rounded-full transition-colors duration-300"
                  style={{ background: i < distinctCount ? '#4ade80' : 'rgba(255,255,255,0.08)' }}
                />
              ))}
            </div>

            <span className="text-[8px] font-bold" style={{ color: isFull ? '#f87171' : 'rgba(255,255,255,0.25)' }}>
              {distinctCount}/{capacity}
            </span>
          </div>

          {/* ── Slot grid: always 4 per row, fixed 2-row max height + scroll ── */}
          <div
            className="overflow-y-auto"
            style={{ maxHeight: 86 }}
          >
            <div
              className="grid gap-1.5 p-2"
              style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}
            >
              {allSlots.map((cfg, i) => cfg ? (
                <motion.div
                  key={cfg.id}
                  layout
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5"
                  style={{
                    background: cfg.category === 'farm'
                      ? (autoSell ? 'rgba(74,222,128,0.12)' : 'rgba(34,197,94,0.08)')
                      : (autoSell ? 'rgba(251,191,36,0.12)' : 'rgba(251,191,36,0.08)'),
                    border: cfg.category === 'farm'
                      ? '1px solid rgba(74,222,128,0.22)'
                      : '1px solid rgba(251,191,36,0.22)',
                  }}
                >
                  <span className="text-base leading-none">{cfg.emoji}</span>
                  <span className="text-white font-black text-[10px] leading-none tabular-nums">
                    {formatNum(Math.floor(storage[cfg.id] ?? 0))}
                  </span>
                  <span
                    className="font-bold text-[7px] leading-none"
                    style={{ color: cfg.category === 'farm' ? '#4ade80' : '#fbbf24' }}
                  >
                    ×{formatNum(cfg.sellPrice)}🪙
                  </span>
                </motion.div>
              ) : (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px dashed rgba(255,255,255,0.07)',
                    minHeight: 46,
                  }}
                >
                  {autoSell
                    ? <Zap size={10} className="text-green-400/20" />
                    : <span className="text-[9px] text-white/10">—</span>
                  }
                </div>
              ))}
            </div>
          </div>

          {/* ── Bottom row: value + sell btn + upgrade btn ── */}
          <div className="flex items-center gap-2 px-2 pb-2 pt-1">

            {/* Grand total */}
            <div className="flex flex-col leading-none flex-shrink-0">
              <span className="text-[7px] font-bold uppercase tracking-wide" style={{ color: 'rgba(253,224,71,0.5)' }}>Değer</span>
              <motion.span
                key={grandTotal}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                className="font-black text-[11px] tabular-nums"
                style={{ color: hasAnything ? '#fde047' : 'rgba(253,224,71,0.2)' }}
              >
                {formatNum(grandTotal)} 🪙
              </motion.span>
            </div>

            {/* Sell button */}
            <div className="relative flex-1">
              {hasAnything && !autoSell && (
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.12, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                  style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.55) 0%, transparent 70%)' }}
                />
              )}
              {autoSell ? (
                <div
                  className="relative w-full py-2 rounded-xl font-black text-[10px] border text-center"
                  style={{
                    background: 'linear-gradient(180deg, #16a34a, #15803d)',
                    borderColor: '#4ade80',
                    color: '#bbf7d0',
                    boxShadow: '0 2px 0 #14532d, 0 0 8px rgba(74,222,128,0.3)',
                  }}
                >
                  <Zap size={9} className="inline mr-0.5" />OTO-SAT
                </div>
              ) : (
                <button
                  onClick={handleSell}
                  disabled={!hasAnything}
                  className={`relative w-full py-2 rounded-xl font-black text-sm border transition-colors ${hasAnything ? 'sell-btn-pulse' : ''}`}
                  style={hasAnything ? {
                    background: 'linear-gradient(180deg, #4ade80, #16a34a)',
                    borderColor: '#86efac',
                    color: 'white',
                    textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                    boxShadow: '0 2px 0 #14532d, 0 0 14px rgba(34,197,94,0.5)',
                  } : {
                    background: 'rgba(255,255,255,0.04)',
                    borderColor: 'rgba(255,255,255,0.07)',
                    color: 'rgba(255,255,255,0.18)',
                  }}
                >
                  {hasAnything ? '💰 SAT!' : '⏳'}
                </button>
              )}
            </div>

            {/* Depot upgrade button — only show if not max level */}
            {nextLevel && (
              <button
                onClick={onUpgradeDepot}
                disabled={!canAffordUpgrade}
                className="flex-shrink-0 flex flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1.5 transition-all active:scale-90"
                style={canAffordUpgrade ? {
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  border: '1px solid #a78bfa',
                  boxShadow: '0 2px 0 #4c1d95, 0 0 10px rgba(124,58,237,0.4)',
                } : {
                  background: 'rgba(124,58,237,0.08)',
                  border: '1px solid rgba(124,58,237,0.2)',
                }}
              >
                <ArrowUpCircle size={12} style={{ color: canAffordUpgrade ? '#ddd6fe' : 'rgba(167,139,250,0.35)' }} />
                <span className="text-[7px] font-black leading-none" style={{ color: canAffordUpgrade ? '#ddd6fe' : 'rgba(167,139,250,0.3)' }}>
                  Sv.{nextLevel.level}
                </span>
                <span className="text-[7px] font-bold leading-none" style={{ color: canAffordUpgrade ? '#c4b5fd' : 'rgba(167,139,250,0.25)' }}>
                  {formatNum(nextLevel.upgradeCost)}🪙
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
