import React, { useEffect, useRef, useState } from 'react';
import { useGameEngine, SECTIONS, WELCOME_BONUS, SectionConfig } from '../hooks/use-game-engine';
import { ConveyorBelt } from '../components/ConveyorBelt';
import { AchievementsPanel } from '../components/AchievementsPanel';
import { useUser } from '../hooks/use-user';
import { useSaveFarmState } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, Lock, Shovel } from 'lucide-react';
import { useLocation } from 'wouter';

/* ── helpers ── */
export function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  if (n < 10) return n.toFixed(2);
  return n.toFixed(0);
}

/* ── Single farm plot card (styled like screenshot) ── */
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
  const categoryIsAnimal = config.category === 'animal';

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
            {/* Level + rate */}
            <div className="flex items-center gap-1.5">
              <div className="bg-[#8b5c1e] border border-[#5c3a21] rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-inner">
                <span className="text-sm">{config.emoji}</span>
                {unlocked && (
                  <span className="font-black text-white text-xs">{count}</span>
                )}
              </div>
              {unlocked && count > 0 && (
                <div className="bg-black/30 border border-white/20 rounded-md px-1.5 py-0.5">
                  <span className="text-[10px] font-black text-green-300">{formatNum(income)} / dk</span>
                </div>
              )}
            </div>

            {/* Shovel/action button */}
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
            {/* Soil background */}
            {unlocked ? (
              <>
                <div className="absolute inset-0 farm-plot-soil opacity-70" />
                {/* Fence posts */}
                <div className="absolute inset-x-0 top-0 h-1.5 bg-[#6b3a10] opacity-60" />
                <div className="absolute inset-x-0 bottom-0 h-1.5 bg-[#6b3a10] opacity-60" />
                {Array.from({ length: Math.min(count, 15) }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="relative z-10 text-2xl drop-shadow-sm"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.02 }}
                  >
                    {config.emoji}
                  </motion.span>
                ))}
                {count > 15 && (
                  <span className="relative z-10 text-white/80 text-xs font-bold">+{count - 15}</span>
                )}
                {count === 0 && (
                  <span className="relative z-10 text-white/40 text-sm italic">Boş tarla</span>
                )}
              </>
            ) : (
              /* Locked state */
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                style={{ background: 'repeating-linear-gradient(45deg, #333 0px, #333 10px, #2a2a2a 10px, #2a2a2a 20px)' }}
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

  return (
    <motion.div
      className="absolute bottom-0 inset-x-0 z-50 px-3 pb-4"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
    >
      {/* Backdrop tap area */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Card */}
      <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(180deg, #c4832e, #8b5c1e)', padding: '3px', boxShadow: '0 -4px 0 #5c3a21, 0 8px 20px rgba(0,0,0,0.5)' }}>
        <div className="rounded-xl bg-[#a06235] p-4 flex items-center gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-black/20 border border-[#5c3a21] flex-shrink-0 shadow-inner">
            <span className="text-4xl">{config.emoji}</span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="font-black text-white text-base">{config.name}</div>
            <div className="text-yellow-200 text-xs font-bold mb-1">{config.description}</div>
            {!isLocked && !isMaxed && (
              <div className="text-green-300 text-[11px] font-bold">
                +{formatNum(config.baseRate)} TL/dk per birim
              </div>
            )}
          </div>

          {/* Price badge */}
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

        {/* Buy button */}
        {!isMaxed && (
          <button
            onClick={() => { if (canAfford) { action(); onClose(); } }}
            className="w-full py-3 rounded-b-xl font-black text-lg transition-all active:brightness-90"
            style={{
              background: canAfford
                ? 'linear-gradient(180deg, #4dabf7, #1c7ed6)'
                : 'linear-gradient(180deg, #555, #333)',
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            {isLocked
              ? canAfford ? '🔓 Aç!' : '💸 Yetersiz Bakiye'
              : canAfford ? '🛒 Satın Al' : '💸 Yetersiz Bakiye'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Main GameView ── */
export default function GameView() {
  const { state, unlockSection, buyUnit, incomePerMin, showWelcomeBonus, setShowWelcomeBonus } = useGameEngine();
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

  // Backend save
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

  /* ── Right nav items ── */
  const rightNav = [
    { label: 'Çiftlik', icon: '🌾', path: '/' },
    { label: 'Çark',    icon: '🎡', path: '/spin' },
    { label: 'Kasa',    icon: '🏦', path: '/vault' },
    { label: 'NFT',     icon: '✨', path: '/nfts' },
    { label: 'Davet',   icon: '👥', path: '/invite' },
    { label: 'Liste',   icon: '🏆', path: '/leaderboard' },
    { label: 'Mağaza',  icon: '🌟', path: '/stars' },
  ];

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
      <div className="flex items-center gap-2 px-3 py-2 z-40 relative" style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
        {/* Money */}
        <div className="top-balance-pill">
          <span className="text-base">💵</span>
          <span className="font-black text-white text-sm font-mono tabular-nums">{formatNum(state.balance)}</span>
          <span className="text-white/50 text-[10px]">TL</span>
        </div>

        {/* Coins */}
        <div className="top-balance-pill">
          <span className="text-base">🪙</span>
          <span className="font-black text-yellow-300 text-sm font-mono tabular-nums">
            {(user?.coins ?? 0).toLocaleString()}
          </span>
        </div>

        {/* Plus button */}
        <button
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-yellow-400 shadow-md active:scale-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)' }}
          onClick={() => navigate('/stars')}
        >
          <Plus size={14} className="text-yellow-900" strokeWidth={3} />
        </button>

        <div className="flex-1" />

        {/* Income */}
        <div className="top-balance-pill">
          <span className="text-green-400 text-xs font-black">📈 {formatNum(incomePerMin)}/dk</span>
        </div>

        {/* Streak */}
        {streak > 0 && (
          <div className="top-balance-pill">
            <Flame size={12} className="text-orange-400" />
            <span className="text-white font-black text-xs">{streak}</span>
          </div>
        )}
      </div>

      <AchievementsPanel />

      {/* ══ MAIN SCENE ══ */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── Left: Scrollable farm area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Buildings row */}
          <div className="relative flex-shrink-0 h-36 overflow-hidden" style={{ background: 'linear-gradient(180deg, #5cb82a 0%, #4ea824 100%)' }}>
            {/* Background trees */}
            <span className="absolute top-2 left-2 text-4xl opacity-80 animate-sway">🌳</span>
            <span className="absolute top-1 left-14 text-3xl opacity-70 animate-sway" style={{ animationDelay: '1s' }}>🌲</span>
            <span className="absolute top-2 right-14 text-3xl opacity-70 animate-sway" style={{ animationDelay: '2s' }}>🌲</span>
            <span className="absolute top-1 right-2 text-4xl opacity-80 animate-sway" style={{ animationDelay: '0.5s' }}>🌳</span>

            {/* Road */}
            <div className="absolute bottom-6 inset-x-0 h-10 flex items-center" style={{ background: '#8b7355' }}>
              <div className="absolute inset-x-0 top-0 h-1 bg-yellow-400/30" />
              <div className="absolute inset-x-0 bottom-0 h-1 bg-black/20" />
              {/* Dashes */}
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex gap-4 px-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-1 flex-1 bg-yellow-300/40 rounded-full" />
                ))}
              </div>
              {/* Truck */}
              <span className="text-2xl truck-anim ml-8">🚛</span>
            </div>

            {/* Shop (left) */}
            <div className="absolute bottom-16 left-3 flex flex-col items-center">
              <div className="relative">
                {/* Awning */}
                <div className="w-20 h-4 rounded-t-sm overflow-hidden flex">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex-1" style={{ background: i % 2 === 0 ? '#e53e3e' : 'white' }} />
                  ))}
                </div>
                {/* Building */}
                <div className="w-20 h-10 rounded-b flex items-center justify-center border border-gray-300 shadow-md" style={{ background: 'linear-gradient(180deg, #fff 0%, #e8e8e8 100%)' }}>
                  <span className="text-xl">🏪</span>
                </div>
              </div>
              <button
                onClick={() => navigate('/stars')}
                className="mt-1 bg-red-500 border-2 border-red-700 text-white font-black text-xs px-3 py-1 rounded-lg shadow active:scale-95 transition-all"
              >
                Sat
              </button>
            </div>

            {/* Barn (right) */}
            <div className="absolute bottom-16 right-3 flex flex-col items-center">
              {/* Wheat counter */}
              <div className="mb-1 bg-black/40 border border-white/20 rounded-lg px-2 py-0.5 flex items-center gap-1">
                <span className="text-sm">🌾</span>
                <span className="text-white font-black text-xs">{state.sections['wheat']?.count ?? 0}</span>
              </div>
              {/* Barn building */}
              <div className="relative w-20 h-14">
                {/* Roof */}
                <div className="absolute top-0 inset-x-0 h-6" style={{ background: '#c0392b', clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
                {/* Body */}
                <div className="absolute bottom-0 inset-x-0 h-9 rounded-sm flex items-center justify-center shadow-md" style={{ background: '#e74c3c', borderTop: '3px solid #c0392b' }}>
                  <div className="w-5 h-6 bg-[#4a2508] rounded-t-sm" />
                </div>
              </div>
              <button
                className="mt-1 bg-blue-500 border-2 border-blue-700 text-white font-black text-xs px-3 py-1 rounded-lg shadow active:scale-95 transition-all"
              >
                Depo
              </button>
            </div>
          </div>

          {/* Farm / Animal tab bar */}
          <div className="flex gap-1 px-2 py-1.5 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.25)' }}>
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

        {/* ── Center: Conveyor rail ── */}
        <ConveyorBelt state={state} />

        {/* ── Right: Nav strip ── */}
        <div className="w-[54px] flex-shrink-0 flex flex-col items-center py-3 gap-2 overflow-y-auto custom-scrollbar" style={{ background: 'rgba(0,0,0,0.2)' }}>
          {rightNav.map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="right-nav-btn"
              style={item.path === '/' ? {
                background: 'linear-gradient(180deg, #4ea824 0%, #3d8b1c 100%)',
                borderColor: '#2e6612',
                color: 'white',
              } : undefined}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span className="text-[8px] font-black leading-none text-center" style={{ color: item.path === '/' ? 'white' : '#333' }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>
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
