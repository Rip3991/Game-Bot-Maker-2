import React from 'react';
import { useUser } from '../hooks/use-user';
import { useGetLeaderboard } from '@workspace/api-client-react';
import { Trophy, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LeaderboardPage() {
  const { telegramId } = useUser();
  const { data: leaderboard, isLoading } = useGetLeaderboard({ limit: 100 });

  const top3 = leaderboard?.slice(0, 3) || [];
  const rest = leaderboard?.slice(3) || [];

  return (
    <div className="flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#5ab327] to-[#3a7517]">
      
      {/* Header */}
      <div className="pt-8 pb-6 px-4 text-center z-10 relative">
        <h1 className="text-3xl font-black drop-shadow-md text-white">Sıralama</h1>
        <p className="text-green-100 font-bold opacity-90 mt-1">En iyi çiftçiler 🏆</p>
      </div>

      {/* Podium */}
      {isLoading ? (
        <div className="h-48 flex items-center justify-center opacity-60 font-bold">Yükleniyor...</div>
      ) : (
        <div className="flex items-end justify-center h-48 gap-3 px-4 pb-4 z-10">
          {/* Silver (Rank 2) */}
          {top3[1] && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
              className="flex flex-col items-center flex-1 max-w-[100px]"
            >
              <div className="w-12 h-12 bg-gray-300 rounded-full border-4 border-gray-400 shadow-lg flex items-center justify-center font-black text-gray-700 text-xl mb-2 z-10">
                {top3[1].firstName.charAt(0).toUpperCase()}
              </div>
              <div className="bg-gradient-to-b from-gray-300 to-gray-500 w-full h-24 rounded-t-lg shadow-xl flex flex-col items-center pt-2 border-t-2 border-white/50">
                <span className="text-2xl font-black text-white drop-shadow-md mb-1">#2</span>
                <span className="text-xs font-bold px-1 text-center truncate w-full">{top3[1].firstName}</span>
                <span className="text-[10px] font-black text-gray-800 bg-white/50 px-1 rounded mt-1">🪙 {top3[1].coins}</span>
              </div>
            </motion.div>
          )}

          {/* Gold (Rank 1) */}
          {top3[0] && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="flex flex-col items-center flex-1 max-w-[110px] z-20"
            >
              <div className="text-4xl mb-[-10px] drop-shadow-lg z-20">👑</div>
              <div className="w-16 h-16 bg-yellow-400 rounded-full border-4 border-yellow-600 shadow-lg flex items-center justify-center font-black text-yellow-900 text-2xl mb-2 relative z-10">
                {top3[0].firstName.charAt(0).toUpperCase()}
              </div>
              <div className="bg-gradient-to-b from-yellow-400 to-yellow-600 w-full h-32 rounded-t-lg shadow-xl flex flex-col items-center pt-2 border-t-2 border-white/50">
                <span className="text-3xl font-black text-white drop-shadow-md mb-1">#1</span>
                <span className="text-sm font-bold px-1 text-center truncate w-full">{top3[0].firstName}</span>
                <span className="text-xs font-black text-yellow-900 bg-white/60 px-2 py-0.5 rounded mt-1 shadow-sm">🪙 {top3[0].coins}</span>
              </div>
            </motion.div>
          )}

          {/* Bronze (Rank 3) */}
          {top3[2] && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}
              className="flex flex-col items-center flex-1 max-w-[100px]"
            >
              <div className="w-12 h-12 bg-orange-300 rounded-full border-4 border-orange-500 shadow-lg flex items-center justify-center font-black text-orange-900 text-xl mb-2 z-10">
                {top3[2].firstName.charAt(0).toUpperCase()}
              </div>
              <div className="bg-gradient-to-b from-orange-300 to-orange-500 w-full h-20 rounded-t-lg shadow-xl flex flex-col items-center pt-2 border-t-2 border-white/50">
                <span className="text-xl font-black text-white drop-shadow-md mb-1">#3</span>
                <span className="text-xs font-bold px-1 text-center truncate w-full">{top3[2].firstName}</span>
                <span className="text-[10px] font-black text-orange-900 bg-white/50 px-1 rounded mt-1">🪙 {top3[2].coins}</span>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* List */}
      <div className="flex-1 bg-[#468f1c] rounded-t-3xl shadow-[0_-10px_20px_rgba(0,0,0,0.2)] border-t-4 border-[#3a7517] overflow-hidden flex flex-col">
        <div className="w-12 h-1.5 bg-[#3a7517] rounded-full mx-auto my-3"></div>
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-20">
          {!isLoading && rest.map((user, index) => {
            const rank = index + 4;
            const isMe = user.telegramId === telegramId;
            return (
              <div 
                key={user.telegramId}
                className={`flex items-center p-3 mb-2 rounded-xl border-2 transition-all ${
                  isMe 
                  ? 'bg-yellow-900/40 border-yellow-500/50 shadow-inner' 
                  : 'bg-black/10 border-transparent hover:bg-black/20'
                }`}
              >
                <div className="w-8 text-center font-black text-white/70 text-sm">#{rank}</div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white ml-2 mr-3 shadow-inner ${isMe ? 'bg-yellow-500 text-yellow-900' : 'bg-white/20'}`}>
                  {user.firstName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <span className={`font-bold truncate ${isMe ? 'text-yellow-400' : 'text-white'}`}>
                    {user.firstName} {isMe && '(Sen)'}
                  </span>
                  <div className="flex items-center gap-3 mt-0.5 opacity-80 text-xs">
                    <span className="flex items-center gap-1 font-bold text-[#f5c842]"><span className="text-[10px]">🪙</span> {user.coins}</span>
                    <span className="flex items-center gap-1 font-bold"><Users size={12}/> {user.totalReferrals}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
