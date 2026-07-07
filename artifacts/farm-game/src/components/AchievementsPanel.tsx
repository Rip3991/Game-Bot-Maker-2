import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGetAchievements } from '@workspace/api-client-react';
import { useUser } from '../hooks/use-user';
import { Trophy, X } from 'lucide-react';

const ACHIEVEMENTS_DEF = [
  { key: 'first_upgrade', icon: '🌾', title: 'İlk Mahsul', desc: 'İlk yükseltme yapıldı' },
  { key: 'earn_1000_coins', icon: '🪙', title: 'Para Basmak', desc: '1000 coin biriktir' },
  { key: 'invite_1', icon: '👥', title: 'Sosyal Çiftçi', desc: '1 arkadaş davet et' },
  { key: 'invite_5', icon: '👑', title: 'Lider Çiftçi', desc: '5 arkadaş davet et' },
  { key: 'streak_7', icon: '🔥', title: 'Haftalık Seri', desc: '7 gün üst üste giriş yap' },
  { key: 'jackpot', icon: '🎰', title: 'Büyük Kazanan', desc: 'Çarktan Jackpot kazan' },
];

export function AchievementsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { telegramId } = useUser();
  const { data: earnedAchievements } = useGetAchievements(telegramId);
  
  const earnedKeys = new Set(earnedAchievements?.map(a => a.key) || []);
  const earnedCount = earnedKeys.size;
  const totalCount = ACHIEVEMENTS_DEF.length;

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed top-24 right-4 z-40 bg-purple-600 border-2 border-purple-800 text-white rounded-full p-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
      >
        <Trophy size={20} className={earnedCount > 0 ? "text-yellow-400 drop-shadow-md" : "text-white"} />
        {earnedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
            {earnedCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 inset-x-0 mx-auto max-w-md bg-[#a06235] border-t-4 border-[#5c3a21] rounded-t-3xl z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] bg-[url('texture')] max-h-[80vh] flex flex-col"
            >
              <div className="p-4 flex items-center justify-between border-b-2 border-black/10">
                <div>
                  <h2 className="text-xl font-black drop-shadow-md">Başarımlar</h2>
                  <p className="text-sm font-bold text-orange-200">Kazanılan: {earnedCount}/{totalCount}</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="bg-black/20 p-2 rounded-full hover:bg-black/30">
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto flex flex-col gap-3 pb-safe">
                {ACHIEVEMENTS_DEF.map(ach => {
                  const isEarned = earnedKeys.has(ach.key);
                  return (
                    <div 
                      key={ach.key} 
                      className={`p-3 rounded-xl flex items-center gap-4 border-2 transition-all ${
                        isEarned 
                        ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/50' 
                        : 'bg-black/20 border-transparent grayscale-[0.8] opacity-70'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-inner border-2 ${isEarned ? 'bg-gradient-to-br from-yellow-300 to-yellow-600 border-yellow-200' : 'bg-gray-700 border-gray-600'}`}>
                        {ach.icon}
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-black text-lg ${isEarned ? 'text-yellow-400 drop-shadow-sm' : 'text-white'}`}>
                          {ach.title}
                        </span>
                        <span className="text-sm font-bold text-white/80">{ach.desc}</span>
                      </div>
                      {isEarned && <div className="ml-auto text-yellow-400 drop-shadow-md"><Trophy size={20} fill="currentColor"/></div>}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
