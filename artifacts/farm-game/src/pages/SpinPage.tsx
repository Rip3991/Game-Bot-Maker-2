import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useUser } from '../hooks/use-user';
import { useDailySpin } from '@workspace/api-client-react';
import { toast } from 'sonner';

const WHEEL_SEGMENTS = [
  { prize: '50', icon: '🪙', color: '#a06235', label: '50 Coin', value: 50 },
  { prize: '100', icon: '🪙', color: '#5ab327', label: '100 Coin', value: 100 },
  { prize: 'boost', icon: '✨', color: '#8b5cf6', label: '2x Boost', value: 0 },
  { prize: '200', icon: '🪙', color: '#3b82f6', label: '200 Coin', value: 200 },
  { prize: 'miss', icon: '❌', color: '#64748b', label: 'Pas', value: 0 },
  { prize: '500', icon: '🪙', color: '#f97316', label: '500 Coin', value: 500 },
  { prize: 'jackpot', icon: '🎰', color: '#eab308', label: 'JACKPOT', value: 1000 },
  { prize: '75', icon: '🪙', color: '#22c55e', label: '75 Coin', value: 75 },
];

export default function SpinPage() {
  const { user, telegramId, refresh } = useUser();
  const spinMut = useDailySpin();
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  const canSpin = !user?.lastSpinAt || new Date(user.lastSpinAt).getTime() + 24*60*60*1000 < Date.now();

  useEffect(() => {
    if (!canSpin && user?.lastSpinAt) {
      const interval = setInterval(() => {
        const nextTime = new Date(user.lastSpinAt!).getTime() + 24*60*60*1000;
        const diff = nextTime - Date.now();
        if (diff <= 0) {
          refresh();
          setTimeLeft(null);
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
      return;
    }
  }, [canSpin, user?.lastSpinAt, refresh]);

  const handleSpin = async () => {
    if (isSpinning || !canSpin) return;
    setIsSpinning(true);
    try {
      const result = await spinMut.mutateAsync({ data: { telegramId } });
      
      const targetIndex = result.segmentIndex;
      const spins = 5;
      const degPerSegment = 360 / 8;
      const targetRotation = spins * 360 + (360 - (targetIndex * degPerSegment + degPerSegment/2));
      
      setRotation(prev => prev + targetRotation + (360 - (prev % 360)));

      setTimeout(() => {
        setIsSpinning(false);
        refresh();
        if (result.prizeType === 'coins' || result.prizeType === 'jackpot') {
          toast.success(`🎉 ${result.coinsEarned} Coin Kazandın!`, {
            style: { background: '#f5c842', color: 'black', border: '2px solid #a06235', fontWeight: 'bold' }
          });
        } else if (result.prizeType === 'boost') {
           toast.success(`✨ 2x Boost Kazandın!`, {
             style: { background: '#8b5cf6', color: 'white', border: '2px solid #5b21b6', fontWeight: 'bold' }
           });
        } else {
           toast.error(`❌ Şansını Zorla!`, {
             style: { background: '#64748b', color: 'white', border: '2px solid #334155', fontWeight: 'bold' }
           });
        }
      }, 3000);

    } catch (e) {
      setIsSpinning(false);
      toast.error("Bir hata oluştu!");
    }
  };

  // Generate conic gradient for the wheel
  const colors = WHEEL_SEGMENTS.map(s => s.color);
  const step = 360 / colors.length;
  const conicGradient = colors.map((c, i) => `${c} ${i * step}deg ${(i + 1) * step}deg`).join(', ');

  return (
    <div className="flex flex-col h-full items-center pt-8 pb-4 px-4 overflow-y-auto">
      
      <div className="w-full flex items-center justify-between mb-8">
        <h1 className="text-3xl font-black drop-shadow-md tracking-tight">Günlük Çark</h1>
        {user && user.streakCount > 0 && (
          <div className="bg-orange-500 border-2 border-orange-700 text-white font-black px-3 py-1 rounded-full shadow-md flex items-center gap-1">
            <span className="text-lg">🔥</span> {user.streakCount} Gün
          </div>
        )}
      </div>

      <div className="relative w-[300px] h-[300px] mb-12 flex-shrink-0">
        {/* Pointer */}
        <div className="absolute top-[-15px] left-1/2 -translate-x-1/2 w-8 h-10 bg-red-600 border-2 border-white rounded-b-full shadow-lg z-20" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }}></div>
        
        {/* Wheel */}
        <div 
          className="w-full h-full rounded-full border-8 border-[#5c3a21] spin-wheel-shadow relative overflow-hidden"
          style={{ 
            background: `conic-gradient(${conicGradient})`,
            transform: `rotate(${rotation}deg)`,
            transition: isSpinning ? 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
          }}
        >
          {WHEEL_SEGMENTS.map((seg, i) => {
            const rot = i * step + step / 2;
            return (
              <div 
                key={i} 
                className="absolute w-full h-full top-0 left-0"
                style={{ transform: `rotate(${rot}deg)` }}
              >
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center justify-start h-1/2 font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] text-center">
                  <span className="text-2xl mb-1">{seg.icon}</span>
                  <span className="text-sm leading-tight max-w-[60px]">{seg.label}</span>
                </div>
              </div>
            );
          })}
          
          {/* Inner circle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-[#5c3a21] rounded-full border-4 border-[#a06235] shadow-inner flex items-center justify-center text-2xl">
            🌾
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center w-full mt-auto">
        <button
          onClick={handleSpin}
          disabled={isSpinning || !canSpin}
          className="w-full max-w-[280px] wood-button text-white font-black text-2xl py-4 rounded-2xl mb-4 disabled:opacity-50 disabled:grayscale transition-all"
        >
          {isSpinning ? 'DÖNÜYOR...' : 'ÇEVİR'}
        </button>

        {!canSpin && timeLeft && (
          <div className="bg-black/30 rounded-full px-6 py-2 border border-white/10 font-mono text-xl font-bold tracking-widest text-[#f5c842]">
            Sonraki çark: {timeLeft}
          </div>
        )}
      </div>

    </div>
  );
}
