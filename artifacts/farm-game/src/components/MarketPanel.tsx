import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SECTIONS, SaleRecord, GameState } from '../hooks/use-game-engine';
import { formatNum } from '../utils/format';
import { useLocation } from 'wouter';
import { ShoppingBag, Zap } from 'lucide-react';

interface MarketPanelProps {
  storage: Record<string, number>;
  gameState: GameState;
  onSell: () => SaleRecord[];
  autoSell: boolean;
  autoSellPurchased: boolean;
  onToggleAutoSell: () => void;
}

export function MarketPanel({ storage, gameState, onSell, autoSell, autoSellPurchased, onToggleAutoSell }: MarketPanelProps) {
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

      {/* ── TOP ROW: Header + Auto-sell ── */}
      <div className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
        {/* Title */}
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 2px 6px rgba(22,163,74,0.4)' }}>
            <ShoppingBag size={13} className="text-white" />
          </div>
          <div>
            <div className="font-black text-white text-[11px] leading-none tracking-wider uppercase">Pazar Yeri</div>
            <div className="text-green-400/60 text-[8px] font-bold leading-none mt-0.5">
              {unlockedSections.length} ürün aktif
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(74,222,128,0.2), transparent)' }} />

        {/* Price chips */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {unlockedSections.map(cfg => (
            <div
              key={cfg.id}
              className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 flex-shrink-0"
              style={{
                background: cfg.category === 'farm'
                  ? 'rgba(34,197,94,0.12)'
                  : 'rgba(251,191,36,0.12)',
                border: cfg.category === 'farm'
                  ? '1px solid rgba(34,197,94,0.22)'
                  : '1px solid rgba(251,191,36,0.22)',
              }}
            >
              <span className="text-[10px]">{cfg.emoji}</span>
              <span className="text-[8px] font-black"
                style={{ color: cfg.category === 'farm' ? '#4ade80' : '#fbbf24' }}>
                {formatNum(cfg.sellPrice)}🪙
              </span>
            </div>
          ))}
        </div>

        {/* Auto-sell toggle */}
        {!autoSellPurchased ? (
          <button
            onClick={() => navigate('/stars')}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 flex-shrink-0 transition-all active:scale-90"
            style={{
              background: 'rgba(255,200,0,0.06)',
              border: '1px solid rgba(255,200,0,0.25)',
            }}
          >
            <span className="text-[10px]">🔒</span>
            <span className="font-black text-[9px] text-yellow-400/60">OTO-SAT</span>
          </button>
        ) : (
          <button
            onClick={onToggleAutoSell}
            className="flex items-center gap-1 rounded-full px-2.5 py-1 flex-shrink-0 transition-all active:scale-90"
            style={autoSell ? {
              background: 'linear-gradient(135deg, #15803d, #166534)',
              border: '1px solid #4ade80',
              boxShadow: '0 0 10px rgba(74,222,128,0.4)',
            } : {
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            <Zap size={9} style={{ color: autoSell ? '#bbf7d0' : 'rgba(255,255,255,0.35)' }} />
            <span className="font-black text-[9px]"
              style={{ color: autoSell ? '#bbf7d0' : 'rgba(255,255,255,0.35)' }}>
              {autoSell ? 'OTO: AÇIK' : 'OTO-SAT'}
            </span>
          </button>
        )}
      </div>

      {/* ── STORAGE AREA ── */}
      <div className="flex gap-2 px-2 pb-2.5 items-stretch">

        {/* Storage card */}
        <div
          className="flex-1 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(0,0,0,0.25)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {/* Card header */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-white/5">
            <span className="text-sm">🏚️</span>
            <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Depo</span>
            {hasAnything && (
              <div className="ml-auto flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[8px] text-green-400 font-bold">{storedItems.length} çeşit</span>
              </div>
            )}
          </div>

          {/* Items grid */}
          <div className="px-2 py-1.5 min-h-[38px] flex items-center">
            {storedItems.length === 0 ? (
              <div className="flex items-center gap-1.5 w-full">
                {autoSell ? (
                  <span className="text-[10px] text-green-400/60 italic flex items-center gap-1">
                    <Zap size={9} className="text-green-400/60" /> Otomatik satılıyor...
                  </span>
                ) : (
                  <span className="text-white/25 text-[10px] italic">Depo boş — ürünlerin bekleniyor...</span>
                )}
              </div>
            ) : (
              <div className="flex flex-col gap-1 w-full">
                {/* Farm items row */}
                {farmItems.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {farmItems.map(cfg => {
                      const qty = Math.floor(storage[cfg.id] ?? 0);
                      return (
                        <motion.div
                          key={cfg.id}
                          layout
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-1 rounded-lg px-2 py-0.5"
                          style={{
                            background: autoSell ? 'rgba(74,222,128,0.1)' : 'rgba(34,197,94,0.07)',
                            border: '1px solid rgba(74,222,128,0.2)',
                          }}
                        >
                          <span className="text-xs leading-none">{cfg.emoji}</span>
                          <span className="text-white font-black text-[10px]">{qty}</span>
                          <span className="text-green-400 font-bold text-[8px]">×{formatNum(cfg.sellPrice)}🪙</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
                {/* Animal items row */}
                {animalItems.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {animalItems.map(cfg => {
                      const qty = Math.floor(storage[cfg.id] ?? 0);
                      return (
                        <motion.div
                          key={cfg.id}
                          layout
                          initial={{ scale: 0.7, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-1 rounded-lg px-2 py-0.5"
                          style={{
                            background: autoSell ? 'rgba(251,191,36,0.1)' : 'rgba(251,191,36,0.07)',
                            border: '1px solid rgba(251,191,36,0.2)',
                          }}
                        >
                          <span className="text-xs leading-none">{cfg.emoji}</span>
                          <span className="text-white font-black text-[10px]">{qty}</span>
                          <span className="text-yellow-400 font-bold text-[8px]">×{formatNum(cfg.sellPrice)}🪙</span>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sell action column */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center gap-1 w-[76px]">
          {/* Total value of items currently sitting in storage, waiting to be
              sold — this is NOT the wallet coin balance shown in the top bar,
              so it's labeled "Depoda" to avoid the two numbers looking like
              the same thing when they legitimately differ. */}
          <div className="text-[7px] font-bold uppercase tracking-wide leading-none" style={{ color: 'rgba(253,224,71,0.6)' }}>
            Depoda
          </div>
          <motion.div
            key={grandTotal}
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            className="font-black text-xs text-center leading-none tabular-nums"
            style={{ color: hasAnything ? '#fde047' : 'rgba(253,224,71,0.3)' }}
          >
            {formatNum(grandTotal)} 🪙
          </motion.div>

          <div className="relative w-full">
            {/* Glow ring when items available */}
            {hasAnything && !autoSell && (
              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
                style={{ background: 'radial-gradient(ellipse, rgba(34,197,94,0.6) 0%, transparent 70%)' }}
              />
            )}

            {autoSell ? (
              <div
                className="relative w-full py-2.5 rounded-xl font-black text-[10px] border text-center"
                style={{
                  background: 'linear-gradient(180deg, #16a34a, #15803d)',
                  borderColor: '#4ade80',
                  color: '#bbf7d0',
                  boxShadow: '0 3px 0 #14532d, 0 0 10px rgba(74,222,128,0.35)',
                }}
              >
                <Zap size={10} className="inline mr-0.5" />OTO
              </div>
            ) : (
              <button
                onClick={handleSell}
                disabled={!hasAnything}
                className={`relative w-full py-2.5 rounded-xl font-black text-sm border transition-colors ${hasAnything ? 'sell-btn-pulse' : ''}`}
                style={hasAnything ? {
                  background: 'linear-gradient(180deg, #4ade80, #16a34a)',
                  borderColor: '#86efac',
                  color: 'white',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                  boxShadow: '0 3px 0 #14532d, 0 0 16px rgba(34,197,94,0.55)',
                  letterSpacing: '0.03em',
                } : {
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.07)',
                  color: 'rgba(255,255,255,0.2)',
                }}
              >
                {hasAnything ? '💰 SAT!' : '⏳'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
