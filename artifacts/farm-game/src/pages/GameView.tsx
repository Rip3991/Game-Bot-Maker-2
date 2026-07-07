import React, { useEffect, useRef } from 'react';
import { useGameEngine, FARM_TYPES } from '../hooks/use-game-engine';
import { FarmSection } from '../components/FarmSection';
import { ConveyorBelt } from '../components/ConveyorBelt';
import { AchievementsPanel } from '../components/AchievementsPanel';
import { useUser } from '../hooks/use-user';
import { useSaveFarmState } from '@workspace/api-client-react';
import { motion } from 'framer-motion';

export default function GameView() {
  const { state, upgradeFarm } = useGameEngine();
  const { user, telegramId } = useUser();
  const saveFarmMut = useSaveFarmState();

  // Reference for state to use in interval
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

  // Periodic save
  useEffect(() => {
    const interval = setInterval(() => {
      saveFarmMut.mutate({
        telegramId,
        data: {
          balance: stateRef.current.balance,
          farmState: {
            wheat: stateRef.current.farms.wheat,
            chicken: stateRef.current.farms.chicken,
            cow: stateRef.current.farms.cow
          }
        }
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [telegramId, saveFarmMut.mutate]);

  const handleWithdraw = () => {
    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Ödemeniz işleniyor! / Payment processing!");
      } else {
        alert("Ödemeniz işleniyor! / Payment processing!");
      }
    } catch (e) {
      alert("Ödemeniz işleniyor! / Payment processing!");
    }
  };

  const formattedBalance = state.balance.toFixed(2);

  return (
    <div className="h-full flex flex-col relative z-0">
      
      {/* Top Bar */}
      <div className="h-20 bg-[#468f1c] shadow-md flex items-center justify-between px-4 z-40 relative border-b-4 border-[#3a7517]">
        <div className="flex gap-2">
          {/* USD Balance */}
          <div className="wood-panel py-1.5 px-3 shadow-xl border-[#452b18] flex items-center">
            <span className="text-[13px] font-black drop-shadow-md tracking-wide flex items-center">
              <span className="mr-1">💵</span>
              <span className="font-mono tabular-nums">{formattedBalance}</span>
            </span>
          </div>
          {/* Coin Balance */}
          <div className="wood-panel py-1.5 px-3 shadow-xl border-[#452b18] flex items-center">
            <span className="text-[13px] font-black drop-shadow-md tracking-wide text-[#f5c842] flex items-center">
              <span className="mr-1">🪙</span>
              <span className="font-mono tabular-nums">{user?.coins?.toLocaleString() ?? 0}</span>
            </span>
          </div>
        </div>
        
        <button 
          onClick={handleWithdraw}
          className="wood-button bg-[#1d98ba] border-[#136b85] hover:bg-[#23a5ca] text-white px-4 py-2 font-bold uppercase tracking-wider text-xs shadow-[0_4px_0_#136b85]"
          style={{ boxShadow: '0 4px 0 #136b85, 0 8px 10px rgba(0,0,0,0.3)' }}
        >
          Çek
        </button>
      </div>

      <AchievementsPanel />

      {/* Main Game Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Column: Scrollable Farms */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pt-6 pb-24 px-4 space-y-6 relative z-10 scroll-smooth">
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
            More farms coming soon! 🚧
          </div>
        </div>

        {/* Right Column: Conveyor Belt */}
        <ConveyorBelt state={state} />
        
      </div>
    </div>
  );
}
