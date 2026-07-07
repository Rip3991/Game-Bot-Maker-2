import React, { useEffect, useRef, useState } from 'react';
import { useGameEngine, SECTIONS, WELCOME_BONUS } from '../hooks/use-game-engine';
import { FarmSection, formatNum } from '../components/FarmSection';
import { ConveyorBelt } from '../components/ConveyorBelt';
import { AchievementsPanel } from '../components/AchievementsPanel';
import { OnlineCounter } from '../components/OnlineCounter';
import { useUser } from '../hooks/use-user';
import { useSaveFarmState } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame, TrendingUp, Wheat, Bird } from 'lucide-react';
import mascotAvatar from '../assets/mascot-avatar.png';

type Tab = 'farm' | 'animal';

export default function GameView() {
  const { state, unlockSection, buyUnit, incomePerMin, showWelcomeBonus, setShowWelcomeBonus } = useGameEngine();
  const { user, telegramId } = useUser();
  const saveFarmMut = useSaveFarmState();
  const stateRef = useRef(state);
  stateRef.current = state;

  const [activeTab, setActiveTab] = useState<Tab>('farm');

  // Handle Telegram WebApp init
  useEffect(() => {
    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    } catch (e) {
      // not in Telegram
    }
  }, []);

  // Periodic save to backend
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

  const farmSections = SECTIONS.filter(s => s.category === 'farm');
  const animalSections = SECTIONS.filter(s => s.category === 'animal');
  const shownSections = activeTab === 'farm' ? farmSections : animalSections;

  return (
    <div className="h-full flex flex-col relative z-0 bg-[#1a2a0a]">

      {/* Welcome Bonus Popup */}
      <AnimatePresence>
        {showWelcomeBonus && (
          <motion.div
            className="absolute inset-0 z-[999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowWelcomeBonus(false)} />
            {/* Card */}
            <motion.div
              className="relative z-10 rounded-3xl border-4 border-yellow-500 shadow-2xl p-6 mx-6 flex flex-col items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #1a3d08, #2e6012)' }}
              initial={{ scale: 0.6, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              {/* Stars */}
              {['⭐', '✨', '🌟', '💫', '⭐'].map((s, i) => (
                <motion.span
                  key={i}
                  className="absolute text-2xl"
                  style={{ top: `${[-10, -12, -8, -14, -6][i]}px`, left: `${[10, 30, 50, 70, 90][i]}%` }}
                  animate={{ y: [0, -8, 0], rotate: [0, 15, -15, 0] }}
                  transition={{ repeat: Infinity, duration: 2 + i * 0.3, delay: i * 0.2 }}
                >
                  {s}
                </motion.span>
              ))}

              <motion.span
                className="text-7xl drop-shadow-2xl"
                animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                🎁
              </motion.span>

              <div className="text-center">
                <h2 className="text-2xl font-black text-yellow-300 drop-shadow-lg">Hoş Geldin Bonusu!</h2>
                <p className="text-white/80 text-sm mt-1">Çiftliğine başlamak için sana özel hediye</p>
              </div>

              <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-2xl px-8 py-3 text-center">
                <div className="text-4xl font-black text-yellow-300 drop-shadow-lg">+{WELCOME_BONUS} TL</div>
                <div className="text-yellow-200/70 text-xs font-bold mt-0.5">hesabına eklendi! 🎉</div>
              </div>

              <motion.button
                className="w-full py-3 rounded-2xl font-black text-yellow-900 text-lg shadow-xl border-2 border-yellow-600"
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

      {/* ── TOP BAR ── */}
      <div className="h-16 bg-gradient-to-r from-[#1e4a0a] to-[#2e6012] shadow-lg flex items-center justify-between px-3 z-40 relative border-b-2 border-[#3d7a1e]/60">
        <div className="flex gap-2 items-center">
          {/* Balance */}
          <div className="bg-black/30 border border-white/10 backdrop-blur rounded-xl px-3 py-1.5 flex items-center gap-1.5 shadow-inner">
            <span className="text-base">💵</span>
            <span className="font-black text-white text-sm font-mono tabular-nums">{formatNum(state.balance)}</span>
            <span className="text-white/40 text-[10px] font-bold">TL</span>
          </div>

          {/* Coins */}
          <div className="bg-black/30 border border-white/10 backdrop-blur rounded-xl px-2.5 py-1.5 flex items-center gap-1 shadow-inner">
            <span className="text-base">🪙</span>
            <span className="font-black text-yellow-300 text-sm font-mono tabular-nums">
              {(user?.coins ?? 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Center: mascot */}
        <Tooltip>
          <TooltipTrigger asChild>
            <img
              src={mascotAvatar}
              alt="Sarı"
              className="w-9 h-9 rounded-full border-2 border-yellow-400 shadow-xl cursor-help bg-yellow-400 hover:scale-110 transition-transform"
            />
          </TooltipTrigger>
          <TooltipContent side="bottom" className="bg-[#1e3d0a] border border-[#3d7a1e] text-white font-bold text-xs shadow-xl z-[100]">
            Ben Sarı! Çiftliğinin sahibi 🌾
          </TooltipContent>
        </Tooltip>

        {/* Right: income + streak */}
        <div className="flex flex-col items-end gap-1">
          <div className="bg-black/30 border border-white/10 rounded-xl px-2.5 py-1 flex items-center gap-1">
            <TrendingUp size={10} className="text-green-400" />
            <span className="text-green-300 font-black text-[11px] font-mono">{formatNum(incomePerMin)}/dk</span>
          </div>
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/70 rounded-full px-2 py-0.5">
              <Flame size={10} className="text-yellow-300" />
              <span className="text-[10px] font-black text-white">{streak} gün</span>
            </div>
          )}
        </div>
      </div>

      <AchievementsPanel />
      <OnlineCounter />

      {/* ── TAB BAR ── */}
      <div className="flex gap-1 px-3 py-2 bg-[#111c08] border-b border-white/5">
        {([
          { key: 'farm', label: 'Tarlalar', icon: '🌾', count: farmSections.filter(s => state.sections[s.id]?.unlocked).length },
          { key: 'animal', label: 'Hayvanlar', icon: '🐄', count: animalSections.filter(s => state.sections[s.id]?.unlocked).length },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl font-black text-sm transition-all duration-200 border ${
              activeTab === tab.key
                ? 'bg-gradient-to-b from-[#3d7a1e] to-[#2a5514] border-[#5a9e30] text-white shadow-lg'
                : 'bg-white/5 border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-white/10 text-white/40'}`}>
              {tab.count}/{activeTab === tab.key ? (tab.key === 'farm' ? farmSections : animalSections).length : (tab.key === 'farm' ? farmSections : animalSections).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── MAIN AREA ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* Scrollable section list */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-3 px-3 space-y-2.5">
          <AnimatePresence mode="popLayout">
            {shownSections.map((cfg, index) => (
              <motion.div
                key={cfg.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.04 }}
              >
                <FarmSection
                  config={cfg}
                  sectionState={state.sections[cfg.id] ?? { unlocked: false, count: 0 }}
                  balance={state.balance}
                  onUnlock={() => unlockSection(cfg.id)}
                  onBuy={() => buyUnit(cfg.id)}
                  defaultExpanded={index === 0}
                />
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="text-center opacity-30 text-xs font-bold text-white pb-6 pt-2">
            Daha fazla içerik geliyor 🚧
          </div>
        </div>

        {/* Conveyor belt */}
        <ConveyorBelt state={state} />
      </div>
    </div>
  );
}
