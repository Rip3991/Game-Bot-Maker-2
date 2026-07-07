import React from 'react';
import { motion } from 'framer-motion';
import mascotFull from '../assets/mascot-full.png';

export default function WelcomePage({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-gradient-to-b from-[#2e5c14] to-[#1a360a] overflow-hidden relative shadow-2xl items-center justify-center p-6 text-center">
      <motion.div
        initial={{ y: -50, scale: 0.5, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
        className="mb-8 relative"
      >
        <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full"></div>
        <img src={mascotFull} alt="Sarı" className="w-[220px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] relative z-10" />
      </motion.div>
      
      <motion.h1 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-5xl font-black text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-4"
        style={{ textShadow: '2px 2px 0 #5c3a21, -2px -2px 0 #5c3a21, 2px -2px 0 #5c3a21, -2px 2px 0 #5c3a21, 0 4px 10px rgba(0,0,0,0.5)' }}
      >
        Sarı'nın Çiftliği
      </motion.h1>
      
      <motion.p 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-[#f5c842] font-bold text-lg mb-10 drop-shadow-md"
      >
        Çiftliğini büyüt, coin kazan, liderler arasına gir!
      </motion.p>
      
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7, type: "spring" }}
        onClick={() => {
          localStorage.setItem('farm_welcomed_v1', 'true');
          onComplete();
        }}
        className="wood-button w-full max-w-sm text-white font-black text-2xl py-4 rounded-2xl shadow-[0_6px_0_#5c3a21,0_15px_20px_rgba(0,0,0,0.4)]"
      >
        Oynamaya Başla!
      </motion.button>
    </div>
  );
}
