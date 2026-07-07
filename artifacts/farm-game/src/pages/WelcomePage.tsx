import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mascotFull from '../assets/mascot-full.png';
import mascotAvatar from '../assets/mascot-avatar.png';

const CHANNEL_USERNAME = import.meta.env.VITE_CHANNEL_USERNAME ?? 'MemberGobot';

const SLIDES = [
  {
    emoji: null,
    mascot: 'full',
    title: "Sarı'nın Çiftliği",
    subtitle: "Çiftliğini büyüt, coin kazan, gerçek para çek!",
    color: 'from-[#2e5c14] to-[#1a360a]',
    cta: 'Devam →',
  },
  {
    emoji: '🌾🐔🐄',
    mascot: 'avatar',
    title: 'Çiftliğini Yönet',
    subtitle: 'Buğday, tavuk ve inek çiftliklerini geliştir. Her seviye daha fazla TL getirir. Çiftliğin çalışırken sen uyusun!',
    color: 'from-[#3a6b1a] to-[#1e3d0a]',
    cta: 'Devam →',
  },
  {
    emoji: '💎🔒',
    mascot: 'avatar',
    title: 'Kasa ile Kazan',
    subtitle: 'Coinleri kasaya kilitle, katlayarak geri al! 3 günde ×1.10, 7 günde ×1.25, 30 günde ×2.00!',
    color: 'from-[#1a0060] to-[#0e0038]',
    cta: 'Devam →',
  },
  {
    emoji: '🃏✨',
    mascot: 'avatar',
    title: 'NFT Kazan & Takas Et',
    subtitle: 'Çiftliğini geliştirerek özel NFT\'ler kazan! Diğer oyuncularla takas yap. Nadir NFT\'ler para eder!',
    color: 'from-[#3a1860] to-[#200a38]',
    cta: 'Devam →',
  },
  {
    emoji: '👥🎁',
    mascot: 'avatar',
    title: 'Arkadaşını Davet Et',
    subtitle: 'Her davet = 🪙 50 Coin! Bağlantını paylaş, çiftliğini büyüt, 350 TL çek!',
    color: 'from-[#2a1060] to-[#160830]',
    cta: 'Devam →',
  },
  {
    emoji: '📢💰',
    mascot: 'avatar',
    title: 'Hazır mısın?',
    subtitle: 'Günlük çark, streak bonusu ve büyük jackpot seni bekliyor. Haber kanalımıza katıl, gelişmeleri kaçırma!',
    color: 'from-[#1a1060] to-[#0d0830]',
    cta: 'Oynamaya Başla! 🚀',
    showChannel: true,
  },
];

export default function WelcomePage({ onComplete }: { onComplete: () => void }) {
  const [slide, setSlide] = useState(0);
  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem('farm_welcomed_v1', 'true');
      onComplete();
    } else {
      setSlide(s => s + 1);
    }
  };

  const handleChannel = () => {
    try {
      window.Telegram?.WebApp?.openTelegramLink(`https://t.me/${CHANNEL_USERNAME}`);
    } catch {
      window.open(`https://t.me/${CHANNEL_USERNAME}`, '_blank');
    }
  };

  return (
    <div className={`flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-gradient-to-b ${current.color} overflow-hidden relative transition-all duration-700`}>
      {/* Dots */}
      <div className="flex justify-center gap-2 pt-8 pb-2 z-10">
        {SLIDES.map((_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === slide ? 28 : 8, opacity: i === slide ? 1 : 0.4 }}
            transition={{ duration: 0.3 }}
            className={`h-2 rounded-full ${i === slide ? 'bg-[#f5c842]' : 'bg-white'}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col items-center text-center w-full"
          >
            {/* Mascot or emoji */}
            {current.mascot === 'full' ? (
              <motion.img
                src={mascotFull}
                alt="Mascot"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="w-52 h-52 object-contain drop-shadow-2xl mb-6"
              />
            ) : current.emoji ? (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="text-7xl mb-6 drop-shadow-lg"
              >
                {current.emoji}
              </motion.div>
            ) : (
              <motion.img
                src={mascotAvatar}
                alt="Mascot"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring' }}
                className="w-28 h-28 object-contain drop-shadow-2xl mb-6 rounded-full bg-yellow-400 border-4 border-white shadow-xl"
              />
            )}

            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="text-3xl font-black text-white drop-shadow-lg mb-3 leading-tight"
            >
              {current.title}
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-base font-semibold text-white/85 leading-relaxed"
            >
              {current.subtitle}
            </motion.p>

            {/* Channel join button on last slide */}
            {current.showChannel && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleChannel}
                className="mt-5 flex items-center gap-2 bg-[#229ED9] text-white font-black text-sm px-5 py-2.5 rounded-full shadow-lg border-2 border-white/20 hover:bg-[#1a89c0] active:scale-95 transition-all"
              >
                📢 Kanalımıza Katıl
              </motion.button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* CTA */}
      <div className="p-6 pb-10 z-10">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="w-full wood-button py-4 font-black text-xl rounded-2xl shadow-[0_8px_0_#5c3a21,0_15px_20px_rgba(0,0,0,0.4)] active:translate-y-2 active:shadow-[0_2px_0_#5c3a21,0_5px_10px_rgba(0,0,0,0.4)] transition-all"
        >
          {current.cta}
        </motion.button>
      </div>
    </div>
  );
}
