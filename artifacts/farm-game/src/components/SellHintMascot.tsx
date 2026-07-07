import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import mascotAvatar from '../assets/mascot-avatar.png';

const STORAGE_KEY = 'farm_sell_hint_done_v2';

interface SellHintMascotProps {
  hasProducts: boolean;
}

export function SellHintMascot({ hasProducts }: SellHintMascotProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already shown once — never show again
    if (localStorage.getItem(STORAGE_KEY) === 'true') return;
    if (!hasProducts) return;

    // Show after a short delay
    const showTimer = setTimeout(() => setVisible(true), 800);

    // Auto-dismiss after 4.5 s and mark as done forever
    const hideTimer = setTimeout(() => {
      setVisible(false);
      localStorage.setItem(STORAGE_KEY, 'true');
    }, 5300);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  // Only trigger once when products first appear
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasProducts]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="absolute bottom-[64px] right-2 z-[150] flex flex-col items-end gap-1 pointer-events-none"
          initial={{ opacity: 0, y: 20, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.88 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
        >
          {/* Speech bubble */}
          <div
            className="relative rounded-2xl rounded-br-sm px-3 py-2.5 shadow-2xl border-2 max-w-[200px]"
            style={{ background: 'linear-gradient(135deg, #8b5c1e, #5c3a21)', borderColor: '#f5c842' }}
          >
            {/* Arrow pointing down-right toward sell button */}
            <div
              className="absolute -bottom-2 right-4 w-0 h-0"
              style={{
                borderLeft: '7px solid transparent',
                borderRight: '7px solid transparent',
                borderTop: '10px solid #f5c842',
              }}
            />
            <p className="text-white font-bold text-[12px] leading-snug">
              🎉 Ürünlerin birikiyor!<br />
              <span className="text-yellow-300 font-black">💰 SAT</span> tuşuna bas ve<br />
              TL kazan! 👇
            </p>
          </div>

          {/* Mascot avatar */}
          <motion.img
            src={mascotAvatar}
            alt="Sarı"
            className="w-14 h-14 rounded-full border-3 border-white shadow-xl bg-yellow-400 object-cover"
            style={{ border: '3px solid white' }}
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
