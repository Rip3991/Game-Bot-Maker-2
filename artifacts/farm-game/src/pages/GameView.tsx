import React, { useEffect, useRef, useState } from 'react';
import { useGameEngine, SECTIONS, WELCOME_BONUS, SectionConfig } from '../hooks/use-game-engine';
import { ConveyorBelt } from '../components/ConveyorBelt';
import { MarketPanel } from '../components/MarketPanel';
import { AchievementsPanel } from '../components/AchievementsPanel';
import { useUser } from '../hooks/use-user';
import { useSaveFarmState } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, Lock } from 'lucide-react';
import { useLocation } from 'wouter';
import { formatNum } from '../utils/format';

export { formatNum } from '../utils/format';

/* ── Animated Cloud ── */
function Cloud({ top, size, delay, duration }: { top: string; size: number; delay: number; duration: number }) {
  return (
    <div
      className="absolute pointer-events-none select-none opacity-70"
      style={{
        top,
        fontSize: size,
        animation: `cloudDrift ${duration}s linear ${delay}s infinite`,
      }}
    >
      ☁️
    </div>
  );
}

/* ── Single farm plot card ── */
function FarmPlot({
  config,
  count,
  unlocked,
  balance,
  onTap,
}: {
  config: SectionConfig;
  count: number;
  unlocked: boolean;
  balance: number;
  onTap: () => void;
}) {
  const income = count * config.baseRate;
  const canAffordUnlock = balance >= config.unlockCost;

  // Richer soil colors per category
  const soilStyle = config.category === 'farm'
    ? { background: 'linear-gradient(180deg, #5c3a21 0%, #4a2e14 100%)' }
    : { background: 'linear-gradient(180deg, #2d4a1a 0%, #1e3310 100%)' };

  return (
    <motion.div
      className="relative mx-3 my-2 rounded-xl overflow-hidden shadow-md"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      {/* Wood frame border */}
      <div
        className="rounded-xl p-1"
        style={{
          background: 'linear-gradient(135deg, #c4832e, #8b5c1e)',
          boxShadow: '0 4px 0 #5c3a21, 0 6px 12px rgba(0,0,0,0.35)',
        }}
      >
        {/* Inner panel */}
        <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(0,0,0,0.15)' }}>
          {/* Top info bar */}
          <div
            className="flex items-center justify-between px-2 py-1.5"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <div className="flex items-center gap-1.5">
              <div className="bg-[#8b5c1e] border border-[#5c3a21] rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-inner">
                <span className="text-sm">{config.emoji}</span>
                {unlocked && <span className="font-black text-white text-xs">{count}</span>}
              </div>
              {unlocked && count > 0 && (
                <div className="bg-black/30 border border-white/20 rounded-md px-1.5 py-0.5">
                  <span className="text-[10px] font-black text-green-300">{formatNum(income)} / dk</span>
                </div>
              )}
            </div>

            {unlocked ? (
              <button
                onClick={onTap}
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg border border-[#5c3a21] active:scale-90 transition-all"
                style={{ background: 'linear-gradient(135deg, #e8a435, #c47820)' }}
              >
                <Plus size={14} className="text-white" strokeWidth={3} />
              </button>
            ) : (
              <div className="w-7 h-7 rounded-full bg-black/40 border border-white/20 flex items-center justify-center">
                <Lock size={12} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Farm plot visual */}
          <div
            className="relative flex flex-wrap items-center justify-center gap-1 py-3 px-2 min-h-[90px]"
            onClick={onTap}
            style={{ cursor: 'pointer' }}
          >
            {unlocked ? (
              <>
                {/* Rich soil/grass background */}
                <div className="absolute inset-0" style={soilStyle} />
                <div className="absolute inset-0 farm-plot-soil opacity-40" />
                {/* Fence top/bottom */}
                <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: 'linear-gradient(90deg, #8b5c1e, #6b3a10, #8b5c1e)', opacity: 0.7 }} />
                <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: 'linear-gradient(90deg, #8b5c1e, #6b3a10, #8b5c1e)', opacity: 0.7 }} />

                {Array.from({ length: Math.min(count, 15) }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="relative z-10 text-2xl drop-shadow-sm"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.02, type: 'spring', stiffness: 300 }}
                  >
                    {config.emoji}
                  </motion.span>
                ))}
                {count > 15 && (
                  <span className="relative z-10 text-white/80 text-xs font-bold bg-black/40 px-1.5 py-0.5 rounded">+{count - 15}</span>
                )}
                {count === 0 && (
                  <span className="relative z-10 text-white/40 text-sm italic">Boş tarla</span>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                style={{ background: 'repeating-linear-gradient(45deg, #2a2a2a 0px, #2a2a2a 10px, #222 10px, #222 20px)' }}
              >
                <Lock size={28} className={canAffordUnlock ? 'text-yellow-400' : 'text-gray-500'} />
                <div className="text-center">
                  <div className="font-black text-white text-sm">{config.name}</div>
                  <div className={`text-xs font-bold ${canAffordUnlock ? 'text-yellow-300' : 'text-gray-400'}`}>
                    🔒 {formatNum(config.unlockCost)} TL
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Purchase / Unlock bottom sheet ── */
function PurchaseSheet({
  config,
  sectionState,
  balance,
  onUnlock,
  onBuy,
  onClose,
}: {
  config: SectionConfig;
  sectionState: { unlocked: boolean; count: number };
  balance: number;
  onUnlock: () => void;
  onBuy: () => void;
  onClose: () => void;
}) {
  const isLocked = !sectionState.unlocked;
  const isMaxed = sectionState.count >= config.maxUnits;
  const cost = isLocked ? config.unlockCost : config.unitCost;
  const canAfford = balance >= cost;
  const action = isLocked ? onUnlock : onBuy;
  const income = config.baseRate;

  return (
    <motion.div
      className="absolute bottom-0 inset-x-0 z-50 px-3 pb-4"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
    >
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(180deg, #c4832e, #8b5c1e)', padding: '3px', boxShadow: '0 -4px 0 #5c3a21, 0 8px 20px rgba(0,0,0,0.5)' }}>
        <div className="rounded-xl bg-[#a06235] p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-black/20 border border-[#5c3a21] flex-shrink-0 shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 farm-plot-soil opacity-30" />
            <span className="text-4xl relative z-10">{config.emoji}</span>
          </div>

          <div className="flex-1">
            <div className="font-black text-white text-base">{config.name}</div>
            <div className="text-yellow-200 text-xs font-bold mb-1">{config.description}</div>
            {!isLocked && !isMaxed && (
              <div className="flex gap-2">
                <div className="text-green-300 text-[11px] font-bold bg-black/20 px-1.5 py-0.5 rounded-md">
                  +{formatNum(income)} TL/dk/birim
                </div>
                <div className="text-white/50 text-[11px] font-bold bg-black/20 px-1.5 py-0.5 rounded-md">
                  Max: {config.maxUnits}
                </div>
              </div>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            {isMaxed ? (
              <div className="text-yellow-300 font-black text-sm">🏆 DOLU</div>
            ) : (
              <>
                <div className="font-black text-white text-lg">{formatNum(cost)}</div>
                <div className="text-yellow-300 text-xs font-bold">TL</div>
              </>
            )}
          </div>
        </div>

        {!isMaxed && (
          <button
            onClick={() => { if (canAfford) { action(); onClose(); } }}
            className="w-full py-3.5 rounded-b-xl font-black text-lg transition-all active:brightness-90"
            style={{
              background: canAfford
                ? 'linear-gradient(180deg, #4dabf7, #1c7ed6)'
                : 'linear-gradient(180deg, #555, #333)',
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            {isLocked
              ? canAfford ? '🔓 Kilidi Aç!' : `💸 Eksik: ${formatNum(cost - balance)} TL`
              : canAfford ? `🛒 Satın Al (${formatNum(balance - cost)} TL kalır)` : `💸 Eksik: ${formatNum(cost - balance)} TL`}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Scene Header: Farm buildings & sky ── */
function FarmScene({ state }: { state: any }) {
  const [, navigate] = useLocation();
  const wheatCount = state.sections['wheat']?.count ?? 0;
  const totalUnlocked = SECTIONS.filter(s => state.sections[s.id]?.unlocked).length;

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{
        height: 148,
        background: 'linear-gradient(180deg, #7ecef4 0%, #5cb82a 55%, #4ea824 100%)',
      }}
    >
      {/* Sky & clouds */}
      <div className="absolute inset-x-0 top-0 h-16" style={{ background: 'linear-gradient(180deg, #87ceeb 0%, #b0e0f0 100%)' }} />
      <div className="absolute top-1 left-0 right-0 h-16 overflow-hidden">
        <Cloud top="4px"  size={18} delay={0}   duration={22} />
        <Cloud top="10px" size={14} delay={-8}  duration={30} />
        <Cloud top="2px"  size={16} delay={-15} duration={26} />
      </div>

      {/* Sun */}
      <div className="absolute top-2 right-4 text-2xl select-none" style={{ animation: 'sunGlow 4s ease-in-out infinite', filter: 'drop-shadow(0 0 8px #fbbf24)' }}>☀️</div>

      {/* Background trees row */}
      <div className="absolute" style={{ top: 36, left: 0, right: 0 }}>
        <span className="absolute text-3xl opacity-90" style={{ top: 0, left: 4, animation: 'sway 5s ease-in-out infinite' }}>🌳</span>
        <span className="absolute text-2xl opacity-80" style={{ top: 6, left: 36, animation: 'sway 6s ease-in-out 1s infinite' }}>🌲</span>
        <span className="absolute text-2xl opacity-80" style={{ top: 4, right: 36, animation: 'sway 5.5s ease-in-out 2s infinite' }}>🌲</span>
        <span className="absolute text-3xl opacity-90" style={{ top: 0, right: 4, animation: 'sway 4.5s ease-in-out 0.5s infinite' }}>🌳</span>
      </div>

      {/* Birds flying across */}
      <div className="absolute top-8 left-0 right-0 overflow-hidden pointer-events-none">
        <div style={{ animation: 'birdFly 14s linear -4s infinite', position: 'absolute', top: 0 }}>🐦</div>
        <div style={{ animation: 'birdFly 18s linear -11s infinite', position: 'absolute', top: 8, fontSize: '10px' }}>🐦</div>
      </div>

      {/* Grass strip */}
      <div className="absolute inset-x-0" style={{ top: 68, height: 20, background: '#5cb82a' }} />

      {/* Road */}
      <div className="absolute inset-x-0 flex items-center overflow-hidden" style={{ top: 88, height: 28, background: '#7a6348' }}>
        <div className="absolute inset-x-0 top-0 h-0.5 bg-black/30" />
        <div className="absolute inset-x-0 bottom-0 h-0.5 bg-black/20" />
        {/* Road markings */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex gap-3 px-2">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-0.5 flex-1 bg-yellow-300/50 rounded-full" />
          ))}
        </div>
        {/* Delivery truck on road */}
        <span className="text-xl absolute" style={{ animation: 'truckMove 7s ease-in-out infinite', left: 30 }}>🚛</span>
        {/* Tractor */}
        <span className="text-lg absolute" style={{ animation: 'truckMove 12s linear -4s infinite', left: 60, opacity: 0.85 }}>🚜</span>
      </div>

      {/* Fence bottom */}
      <div className="absolute inset-x-0" style={{ top: 116, height: 8, background: 'linear-gradient(90deg, #8b5c1e 0%, #a06235 50%, #8b5c1e 100%)', opacity: 0.8 }} />

      {/* ── SHOP building (left) ── */}
      <div className="absolute flex flex-col items-center" style={{ bottom: 8, left: 6 }}>
        {/* Sign */}
        <div className="bg-green-600 border border-green-800 text-white text-[8px] font-black px-2 py-0.5 rounded-sm mb-0.5 shadow">
          💰 SATIŞ
        </div>
        {/* Awning */}
        <div className="w-[68px] h-4 rounded-t overflow-hidden flex shadow-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-1" style={{ background: i % 2 === 0 ? '#16a34a' : '#15803d' }} />
          ))}
        </div>
        {/* Building body */}
        <div className="w-[68px] h-10 rounded-b flex items-center justify-center gap-1 border border-gray-300 shadow-md" style={{ background: 'linear-gradient(180deg, #f0fdf4, #dcfce7)' }}>
          <span className="text-base">🏪</span>
          <span className="text-[9px] font-black text-green-700 leading-tight">Satış<br/>Noktası</span>
        </div>
        {/* Income stats */}
        <div className="mt-0.5 bg-green-700/90 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
          {totalUnlocked} sektör aktif
        </div>
      </div>

      {/* ── BARN / SILO (right) ── */}
      <div className="absolute flex flex-col items-center" style={{ bottom: 8, right: 6 }}>
        {/* Wheat counter badge */}
        <div className="mb-0.5 bg-amber-900/80 border border-amber-700 rounded-lg px-2 py-0.5 flex items-center gap-1 shadow">
          <span className="text-xs">🌾</span>
          <span className="text-white font-black text-[10px]">{wheatCount}</span>
        </div>
        <div className="flex items-end gap-1">
          {/* Silo cylinder */}
          <div className="flex flex-col items-center">
            <div className="w-8 h-4 rounded-t-full" style={{ background: 'linear-gradient(180deg, #d1d5db, #9ca3af)' }} />
            <div className="w-8 h-8" style={{ background: 'linear-gradient(180deg, #6b7280, #4b5563)' }} />
          </div>
          {/* Main barn */}
          <div className="relative w-[46px] h-14">
            {/* Roof */}
            <div className="absolute top-0 inset-x-0 h-7 rounded-t" style={{ background: 'linear-gradient(180deg, #dc2626, #b91c1c)', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            {/* Body */}
            <div className="absolute bottom-0 inset-x-0 h-8 rounded-sm flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(180deg, #ef4444, #dc2626)', borderTop: '2px solid #991b1b' }}>
              <div className="w-5 h-6 rounded-t-full" style={{ background: '#7c2d12' }} />
            </div>
          </div>
        </div>
        <div className="mt-0.5 bg-red-700/90 text-white text-[9px] font-black px-2 py-0.5 rounded shadow">
          🏚️ Depo
        </div>
      </div>

      <style>{`
        @keyframes cloudDrift {
          from { left: -60px; }
          to   { left: 110%; }
        }
        @keyframes birdFly {
          from { left: -20px; transform: scaleX(1); }
          to   { left: 110%; transform: scaleX(1); }
        }
        @keyframes sunGlow {
          0%, 100% { filter: drop-shadow(0 0 6px #fbbf24); }
          50%       { filter: drop-shadow(0 0 14px #f59e0b); }
        }
      `}</style>
    </div>
  );
}

/* ── Main GameView ── */
export default function GameView() {
  const { state, unlockSection, buyUnit, sellProducts, incomePerMin, showWelcomeBonus, setShowWelcomeBonus } = useGameEngine();
  const { user, telegramId } = useUser();
  const saveFarmMut = useSaveFarmState();
  const stateRef = useRef(state);
  stateRef.current = state;
  const [, navigate] = useLocation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'farm' | 'animal'>('farm');

  // Telegram init
  useEffect(() => {
    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    } catch (_) {}
  }, []);

  // Backend save (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      saveFarmMut.mutate({
        telegramId,
        data: {
          balance: s.balance,
          farmState: {
            wheat: s.sections['wheat']?.count ?? 0,
            chicken: s.sections['chicken']?.count ?? 0,
            cow: s.sections['cow']?.count ?? 0,
          },
        },
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [telegramId]);

  const streak = user?.streakCount ?? 0;
  const shownSections = SECTIONS.filter(s => s.category === activeTab);

  const selectedConfig = selectedId ? SECTIONS.find(s => s.id === selectedId) ?? null : null;
  const selectedState = selectedId ? (state.sections[selectedId] ?? { unlocked: false, count: 0 }) : null;

  return (
    <div className="h-full flex flex-col relative z-0" style={{ background: '#4ea824' }}>

      {/* ══ WELCOME BONUS POPUP ══ */}
      <AnimatePresence>
        {showWelcomeBonus && (
          <motion.div className="absolute inset-0 z-[999] flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowWelcomeBonus(false)} />
            <motion.div
              className="relative z-10 rounded-3xl border-4 border-yellow-500 p-6 mx-6 flex flex-col items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #1a3d08, #2e6012)' }}
              initial={{ scale: 0.6, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <motion.span className="text-7xl" animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>🎁</motion.span>
              <div className="text-center">
                <h2 className="text-2xl font-black text-yellow-300">Hoş Geldin Bonusu!</h2>
                <p className="text-white/80 text-sm mt-1">Çiftliğine başlamak için hediye</p>
              </div>
              <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-2xl px-8 py-3 text-center">
                <div className="text-4xl font-black text-yellow-300">+{WELCOME_BONUS} TL</div>
                <div className="text-yellow-200/70 text-xs font-bold mt-0.5">hesabına eklendi! 🎉</div>
              </div>
              <motion.button
                className="w-full py-3 rounded-2xl font-black text-yellow-900 text-lg border-2 border-yellow-600"
                style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWelcomeBonus(false)}
              >
                🚀 Oynamaya Başla!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ TOP BAR ══ */}
      <div className="flex items-center gap-2 px-3 py-2 z-40 relative flex-shrink-0" style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
        <div className="top-balance-pill">
          <span className="text-base">💵</span>
          <span className="font-black text-white text-sm font-mono tabular-nums">{formatNum(state.balance)}</span>
          <span className="text-white/50 text-[10px]">TL</span>
        </div>

        <div className="top-balance-pill">
          <span className="text-base">🪙</span>
          <span className="font-black text-yellow-300 text-sm font-mono tabular-nums">
            {(user?.coins ?? 0).toLocaleString()}
          </span>
        </div>

        <button
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-yellow-400 shadow-md active:scale-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)' }}
          onClick={() => navigate('/stars')}
        >
          <Plus size={14} className="text-yellow-900" strokeWidth={3} />
        </button>

        <div className="flex-1" />

        <div className="top-balance-pill">
          <span className="text-green-400 text-xs font-black">📈 {formatNum(incomePerMin)}/dk</span>
        </div>

        {streak > 0 && (
          <div className="top-balance-pill">
            <Flame size={12} className="text-orange-400" />
            <span className="text-white font-black text-xs">{streak}</span>
          </div>
        )}
      </div>

      <AchievementsPanel />

      {/* ══ MARKET PANEL ══ */}
      <MarketPanel
        storage={state.storage}
        gameState={state}
        onSell={sellProducts}
      />

      {/* ══ MAIN SCENE ══ */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── Left: Scrollable farm area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Rich farm scene header */}
          <FarmScene state={state} />

          {/* Farm / Animal tab bar */}
          <div className="flex gap-1 px-2 py-1.5 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.3)' }}>
            {(['farm', 'animal'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg font-black text-xs border transition-all ${
                  activeTab === tab
                    ? 'bg-white/90 text-green-800 border-white shadow-md'
                    : 'bg-black/20 text-white/70 border-white/10'
                }`}
              >
                {tab === 'farm' ? '🌾 Tarlalar' : '🐄 Hayvanlar'}
              </button>
            ))}
          </div>

          {/* Scrollable plots */}
          <div className="flex-1 overflow-y-auto custom-scrollbar py-1 pb-4">
            <AnimatePresence mode="popLayout">
              {shownSections.map(cfg => (
                <FarmPlot
                  key={cfg.id}
                  config={cfg}
                  count={state.sections[cfg.id]?.count ?? 0}
                  unlocked={state.sections[cfg.id]?.unlocked ?? false}
                  balance={state.balance}
                  onTap={() => setSelectedId(s => s === cfg.id ? null : cfg.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* ── Right: Conveyor rail with truck ── */}
        <ConveyorBelt state={state} />
      </div>

      {/* ══ PURCHASE SHEET ══ */}
      <AnimatePresence>
        {selectedConfig && selectedState && (
          <PurchaseSheet
            key={selectedId}
            config={selectedConfig}
            sectionState={selectedState}
            balance={state.balance}
            onUnlock={() => { unlockSection(selectedConfig.id); setSelectedId(null); }}
            onBuy={() => { buyUnit(selectedConfig.id); }}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
