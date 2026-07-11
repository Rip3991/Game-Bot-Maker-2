import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mascotAvatar from '../assets/mascot-avatar.png';

const STORAGE_KEY = 'farm_tutorial_done_v1';

const STEPS = [
  {
    bubble: "Merhaba! Ben Sarı! 👋\nÇiftliğini büyütmeni öğreteceğim, hazır mısın?",
    highlight: null,
    emoji: '👋',
  },
  {
    bubble: "🌾 Buğday tarlasına tıkla!\nAçılan panelden birim satın al.\nHer birim dakikada TL kazandırır!",
    highlight: 'farm',
    emoji: '🌾',
  },
  {
    bubble: "💰 TL biriktirince yeni tarlalar ve hayvanlar açabilirsin!\nHer hayvanın kendine özel sesi var 🐄🐔🐑",
    highlight: 'animal',
    emoji: '💰',
  },
  {
    bubble: "🎡 Her gün çarkı çevir!\nJackpot kazanabilirsin, kaçırma!",
    highlight: null,
    emoji: '🎡',
  },
  {
    bubble: "👥 Arkadaşlarını davet et!\nHer davet = 🪙 12 Coin, arkadaşın = 🪙 5 Coin!\nDavet sayfasına bak →",
    highlight: null,
    emoji: '👥',
  },
  {
    bubble: "🚀 Harika! Artık hazırsın!\nÇiftliğini büyüt, coin kazan ve\ngerçek para çek! 💸",
    highlight: null,
    emoji: '🚀',
  },
];

export default function MascotTutorial({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      localStorage.setItem(STORAGE_KEY, 'true');
      onDone();
    } else {
      setStep(s => s + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    onDone();
  };

  return (
    <motion.div
      className="absolute inset-x-0 bottom-0 z-[200] px-3 pb-5 pointer-events-none"
      initial={{ y: 120, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 120, opacity: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 260 }}
    >
      {/* Dim overlay at top — doesn't block game but signals tutorial */}
      <div className="fixed inset-x-0 top-0 h-40 pointer-events-none z-[199]"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)' }}
      />

      <div className="pointer-events-auto">
        <div className="flex items-end gap-3">

          {/* Mascot */}
          <div className="flex-shrink-0 relative">
            <motion.img
              src={mascotAvatar}
              alt="Sarı"
              className="w-20 h-20 rounded-full border-4 border-white shadow-2xl bg-yellow-400 object-cover"
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            />
            {/* Bounce emoji above mascot */}
            <motion.span
              key={step}
              className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl pointer-events-none"
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            >
              {current?.emoji}
            </motion.span>
          </div>

          {/* Speech bubble */}
          <div className="flex-1 relative">
            {/* Triangle pointer */}
            <div
              className="absolute -left-2.5 bottom-5 w-0 h-0"
              style={{
                borderTop: '8px solid transparent',
                borderBottom: '8px solid transparent',
                borderRight: '12px solid #f5c842',
              }}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 12, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -12, scale: 0.96 }}
                transition={{ duration: 0.22 }}
                className="rounded-2xl rounded-bl-sm px-4 py-3 shadow-2xl border-2 border-[#f5c842]"
                style={{ background: 'linear-gradient(135deg, #8b5c1e, #5c3a21)' }}
              >
                {/* Step dots */}
                <div className="flex gap-1.5 mb-2">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: i === step ? 18 : 6,
                        background: i === step ? '#f5c842' : 'rgba(255,255,255,0.25)',
                      }}
                    />
                  ))}
                </div>

                <p
                  className="text-white font-bold text-sm leading-snug whitespace-pre-line"
                  style={{ textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}
                >
                  {current.bubble}
                </p>

                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleSkip}
                    className="text-xs font-bold px-2 py-1 rounded-lg transition-colors"
                    style={{ color: 'rgba(255,255,255,0.88)', textShadow: '0 1px 2px rgba(0,0,0,0.55)' }}
                  >
                    Atla
                  </button>
                  <motion.button
                    onClick={handleNext}
                    whileTap={{ scale: 0.93 }}
                    className="flex-1 py-2 rounded-xl font-black text-sm text-[#5c3a21] shadow-lg border-2 border-[#c49a00]"
                    style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)', boxShadow: '0 3px 0 #9a6c00' }}
                  >
                    {isLast ? '🚀 Başla!' : 'Sonraki →'}
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function useMascotTutorial() {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Small delay so the game has time to render first
    const t = setTimeout(() => {
      if (localStorage.getItem(STORAGE_KEY) !== 'true') {
        setShowTutorial(true);
      }
    }, 900);
    return () => clearTimeout(t);
  }, []);

  return {
    showTutorial,
    doneTutorial: () => setShowTutorial(false),
  };
}
