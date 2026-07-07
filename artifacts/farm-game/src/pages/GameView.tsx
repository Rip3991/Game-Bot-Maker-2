import React, { useEffect, useRef } from 'react';
import { useGameEngine, FARM_TYPES } from '../hooks/use-game-engine';
import { FarmSection } from '../components/FarmSection';
import { ConveyorBelt } from '../components/ConveyorBelt';
import { AchievementsPanel } from '../components/AchievementsPanel';
import { OnlineCounter } from '../components/OnlineCounter';
import { useUser } from '../hooks/use-user';
import { useSaveFarmState } from '@workspace/api-client-react';
import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Flame } from 'lucide-react';
import mascotAvatar from '../assets/mascot-avatar.png';

export default function GameView() {
  const { state, upgradeFarm } = useGameEngine();
  const { user, telegramId } = useUser();
  const saveFarmMut = useSaveFarmState();

  const stateRef = useRef(state);
  stateRef.current = state;

  // Handle Telegram WebApp init
  useEffect(() => {
    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    } catch (e) {
      console.warn("Telegram WebApp not available", e);
    }
  }, []);

  // Periodic save to backend
  useEffect(() => {
    const interval = setInterval(() => {
      saveFarmMut.mutate({
        telegramId,
        data: {
          balance: stateRef.current.balance,
          farmState: {
            wheat: stateRef.current.farms.wheat,
            chicken: stateRef.current.farms.chicken,
            cow: stateRef.current.farms.cow,
          },
        },
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [telegramId, saveFarmMut.mutate]);

  const formattedBalance = state.balance.toFixed(2);
  const streak = user?.streakCount ?? 0;

  return (
    <div className="h-full flex flex-col relative z-0">

      {/* Top Bar */}
      <div className="h-20 bg-[#468f1c] shadow-md flex items-center justify-between px-3 z-40 relative border-b-4 border-[#3a7517]">
        <div className="flex gap-2 items-center">
          {/* TL Balance */}
          <div className="wood-panel py-1.5 px-3 shadow-xl border-[#452b18] flex items-center">
            <span className="text-[13px] font-black drop-shadow-md tracking-wide flex items-center">
              <span className="mr-1">💵</span>
              <span className="font-mono tabular-nums">{formattedBalance}</span>
              <span className="text-[10px] opacity-60 ml-0.5">TL</span>
            </span>
          </div>

          {/* Mascot + Coins */}
          <div className="flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <img
                  src={mascotAvatar}
                  alt="Sarı"
                  className="w-8 h-8 rounded-full border-2 border-white shadow-md cursor-help bg-yellow-400 relative z-50 hover:scale-110 transition-transform"
                />
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8} className="bg-[#a06235] border-2 border-[#5c3a21] text-white font-bold p-2 text-xs shadow-xl z-[100] max-w-[200px]">
                <p>Ben Sarı! Çiftliğinin sahibi 🌾</p>
              </TooltipContent>
            </Tooltip>

            <div className="wood-panel py-1.5 px-3 shadow-xl border-[#452b18] flex items-center">
              <span className="text-[13px] font-black drop-shadow-md tracking-wide text-[#f5c842] flex items-center">
                <span className="mr-1">🪙</span>
                <span className="font-mono tabular-nums">{user?.coins?.toLocaleString() ?? 0}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right side: streak + online counter */}
        <div className="flex flex-col items-end gap-1">
          {streak > 0 && (
            <div className="flex items-center gap-1 bg-orange-500/80 rounded-full px-2 py-0.5">
              <Flame size={12} className="text-yellow-300" />
              <span className="text-[11px] font-black text-white">{streak} gün</span>
            </div>
          )}
          <OnlineCounter />
        </div>
      </div>

      <AchievementsPanel />

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* Left Column: Scrollable Farms */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-36 px-4 space-y-6 relative z-10 scroll-smooth">
          {FARM_TYPES.map((type, index) => (
            <motion.div
              key={type}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.15, type: 'spring' }}
            >
              <FarmSection
                type={type}
                level={state.farms[type]}
                balance={state.balance}
                onUpgrade={() => upgradeFarm(type)}
              />
            </motion.div>
          ))}

          <div className="text-center opacity-60 text-sm font-bold text-[#1f470d] pb-8 pt-4">
            Daha fazla çiftlik yakında! 🚧
          </div>
        </div>

        {/* Right Column: Conveyor Belt */}
        <ConveyorBelt state={state} />
      </div>
    </div>
  );
}
