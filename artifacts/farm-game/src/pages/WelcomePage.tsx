import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mascotFull from '../assets/mascot-full.png';
import mascotAvatar from '../assets/mascot-avatar.png';

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
    subtitle: 'Buğday, tavuk ve inek çiftliklerini geliştir. Her seviye daha fazla gelir getirir. Çiftliğin çalışırken sen uyusun!',
    color: 'from-[#3a6b1a] to-[#1e3d0a]',
    cta: 'Devam →',
  },
  {
    emoji: '🪙💰',
    mascot: 'avatar',
    title: 'Coin & Para Kazan',
    subtitle: 'Çiftlik çalıştır → Coin biriktir → TL\'ye çevir. 50 TL\'den başlayan, 350 TL\'ye kadar çekim yapabilirsin!',
    color: 'from-[#4a3800] to-[#2a2000]',
    cta: 'Devam →',
  },
  {
    emoji: '👥🎁',
    mascot: 'avatar',
    title: 'Arkadaş Davet Et',
    subtitle: 'Her davet ettiğin arkadaşından 50 Coin kazan! Bağlantını paylaş, çiftliğini büyüt!',
    color: 'from-[#2a1060] to-[#160830]',
    cta: 'Devam →',
  },
  {
    emoji: '🎡⭐',
    mascot: 'avatar',
    title: 'Günlük Ödüller',
    subtitle: 'Her gün şans çarkını çevir! Coin, bonus ve sürpriz ödüller seni bekliyor. Her gün giriş yap, streak\'ini kırmadan devam et!',
    color: 'from-[#1a1060] to-[#0d0830]',
    cta: 'Oynamaya Başla! 🚀',
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
      setSlide(slide + 1);
    }
  };

  return (
    <div
      className={`flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-gradient-to-b ${current.color} overflow-hidden relative shadow-2xl transition-all duration-500`}
    >
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-10 pb-2 z-10">
        {SLIDES.map((_, i) => (
          <motion.div
            key={i}
            animate={{ width: i === slide ? 24 : 8, opacity: i === slide ? 1 : 0.4 }}
            transition={{ duration: 0.3 }}
            className={`h-2 rounded-full ${i <= slide ? 'bg-[#f5c842]' : 'bg-white/40'}`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col items-center justify-center px-6 text-center"
        >
          {/* Mascot or emoji */}
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-yellow-400/20 blur-3xl rounded-full"></div>
            {current.mascot === 'full' ? (
              <img
                src={mascotFull}
                alt="Sarı"
                className="w-[200px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] relative z-10"
              />
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-2">
                {current.emoji && (
                  <div className="text-6xl mb-2 filter drop-shadow-lg">{current.emoji}</div>
                )}
                <img
                  src={mascotAvatar}
                  alt="Sarı"
                  className="w-20 h-20 rounded-full border-4 border-white shadow-xl bg-yellow-400"
                />
              </div>
            )}
          </div>

          <h1
            className="text-4xl font-black text-white mb-3"
            style={{
              textShadow: '2px 2px 0 #5c3a21, -2px -2px 0 #5c3a21, 2px -2px 0 #5c3a21, -2px 2px 0 #5c3a21',
            }}
          >
            {current.title}
          </h1>

          <p className="text-[#f5e090] font-semibold text-base leading-relaxed max-w-sm">
            {current.subtitle}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* CTA */}
      <div className="px-6 pb-12">
        <motion.button
          key={slide + '-btn'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={handleNext}
          className="w-full wood-button text-white font-black text-xl py-4 rounded-2xl shadow-[0_6px_0_#5c3a21,0_15px_20px_rgba(0,0,0,0.4)]"
        >
          {current.cta}
        </motion.button>

        {slide > 0 && (
          <button
            onClick={() => setSlide(slide - 1)}
            className="w-full mt-3 text-white/40 text-sm font-bold"
          >
            ← Geri
          </button>
        )}
      </div>
    </div>
  );
}
