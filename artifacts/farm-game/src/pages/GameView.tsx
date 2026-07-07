import React, { useEffect, useRef, useState } from 'react';
import { useGameEngine, SECTIONS, WELCOME_BONUS, SectionConfig } from '../hooks/use-game-engine';
import { MarketPanel } from '../components/MarketPanel';
import { useUser } from '../hooks/use-user';
import { useSaveFarmState, useGetOnlineStats, getGetOnlineStatsQueryKey } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Plus, Lock, Volume2, VolumeX } from 'lucide-react';
import { useLocation } from 'wouter';
import { formatNum } from '../utils/format';
import { playCoinSound, playAnimalSound, playUnlockSound, isSoundEnabled, setSoundEnabled } from '../lib/sound';
import MascotTutorial, { useMascotTutorial } from '../components/MascotTutorial';
import mascotAvatar from '../assets/mascot-avatar.png';
import { LiveNftShowcase } from '../components/LiveNftShowcase';
import { SellHintMascot } from '../components/SellHintMascot';
import { FarmBackground } from '../components/FarmBackground';

export { formatNum } from '../utils/format';

/* ── Online player count pill ── */
function OnlineCounterPill() {
  const { data } = useGetOnlineStats({
    query: { queryKey: getGetOnlineStatsQueryKey(), refetchInterval: 30_000 },
  });
  const count = data?.onlineCount ?? null;
  return (
    <div className="flex items-center gap-1 bg-green-900/50 border border-green-600/40 rounded-full px-2 py-0.5">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
      </span>
      <span className="text-green-300 font-black text-[9px] tabular-nums">{count ?? '...'} aktif</span>
    </div>
  );
}

/* ── Animated Cloud ── */
function Cloud({ top, size, delay, duration }: { top: string; size: number; delay: number; duration: number }) {
  return (
    <div
      className="absolute pointer-events-none select-none opacity-70"
      style={{
        top,
        fontSize: size,
        animation: `cloudDrift ${duration}s linear ${delay}s infinite`,
      }}
    >
      ☁️
    </div>
  );
}

/* ── Single farm plot card ── */
function FarmPlot({
  config,
  count,
  unlocked,
  balance,
  onTap,
}: {
  config: SectionConfig;
  count: number;
  unlocked: boolean;
  balance: number;
  onTap: () => void;
}) {
  const income = count * config.baseRate;
  const canAffordUnlock = balance >= config.unlockCost;

  // Richer soil colors per category
  const soilStyle = config.category === 'farm'
    ? { background: 'linear-gradient(180deg, #5c3a21 0%, #4a2e14 100%)' }
    : { background: 'linear-gradient(180deg, #2d4a1a 0%, #1e3310 100%)' };

  return (
    <motion.div
      className="relative mx-3 my-2 rounded-xl overflow-hidden shadow-md"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      {/* Wood frame border */}
      <div
        className="rounded-xl p-1"
        style={{
          background: 'linear-gradient(135deg, #c4832e, #8b5c1e)',
          boxShadow: '0 4px 0 #5c3a21, 0 6px 12px rgba(0,0,0,0.35)',
        }}
      >
        {/* Inner panel */}
        <div className="rounded-lg overflow-hidden" style={{ background: 'rgba(0,0,0,0.15)' }}>
          {/* Top info bar */}
          <div
            className="flex items-center justify-between px-2 py-1.5"
            style={{ background: 'rgba(0,0,0,0.38)' }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Emoji badge */}
              <div className="flex items-center rounded-lg px-1.5 py-0.5 shadow-inner flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #7a4e1a, #5c3a10)', border: '1px solid #3d2409' }}>
                <span className="text-sm leading-none">{config.emoji}</span>
              </div>
              {/* Section name */}
              <div className="flex flex-col min-w-0">
                <span className="font-black text-white leading-none truncate" style={{ fontSize: 10 }}>{config.name}</span>
                {unlocked && count > 0 ? (
                  <span className="font-bold text-green-300 leading-none" style={{ fontSize: 9 }}>📈 {formatNum(income)}/dk</span>
                ) : unlocked ? (
                  <span className="font-bold leading-none" style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>Boş</span>
                ) : null}
              </div>
            </div>

            {unlocked ? (
              <button
                onClick={onTap}
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg active:scale-90 transition-all flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #e8a435, #c47820)', border: '1.5px solid #f5c842', boxShadow: '0 2px 6px rgba(232,164,53,0.4)' }}
              >
                <Plus size={14} className="text-white" strokeWidth={3} />
              </button>
            ) : (
              <div className="w-7 h-7 rounded-full bg-black/40 border border-white/20 flex items-center justify-center flex-shrink-0">
                <Lock size={12} className="text-gray-400" />
              </div>
            )}
          </div>

          {/* Farm plot visual */}
          <div
            className="relative flex flex-wrap items-center justify-center gap-1 py-3 px-2 min-h-[90px]"
            onClick={onTap}
            style={{ cursor: 'pointer' }}
          >
            {unlocked ? (
              <>
                {/* Rich soil/grass background */}
                <div className="absolute inset-0" style={soilStyle} />
                <div className="absolute inset-0 farm-plot-soil opacity-40" />
                {/* Fence top/bottom */}
                <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: 'linear-gradient(90deg, #8b5c1e, #6b3a10, #8b5c1e)', opacity: 0.7 }} />
                <div className="absolute inset-x-0 bottom-0 h-1.5" style={{ background: 'linear-gradient(90deg, #8b5c1e, #6b3a10, #8b5c1e)', opacity: 0.7 }} />

                {Array.from({ length: Math.min(count, 15) }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="relative z-10 text-2xl drop-shadow-sm"
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: i * 0.02, type: 'spring', stiffness: 300 }}
                  >
                    {config.emoji}
                  </motion.span>
                ))}
                {count > 15 && (
                  <span className="relative z-10 text-white/80 text-xs font-bold bg-black/40 px-1.5 py-0.5 rounded">+{count - 15}</span>
                )}
                {count === 0 && (
                  <span className="relative z-10 text-white/40 text-sm italic">Boş tarla</span>
                )}
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                style={{ background: 'repeating-linear-gradient(45deg, #2a2a2a 0px, #2a2a2a 10px, #222 10px, #222 20px)' }}
              >
                <Lock size={28} className={canAffordUnlock ? 'text-yellow-400' : 'text-gray-500'} />
                <div className="text-center">
                  <div className="font-black text-white text-sm">{config.name}</div>
                  <div className={`text-xs font-bold ${canAffordUnlock ? 'text-yellow-300' : 'text-gray-400'}`}>
                    🔒 {formatNum(config.unlockCost)} TL
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Mascot tip messages per section ── */
const MASCOT_TIPS: Record<string, string> = {
  wheat:     'Buğday tarlası al! Ne kadar çok tarlana sahip olursan, o kadar çok TL kazanırsın! 🌾',
  corn:      'Mısır tarlası çok daha fazla TL üretir! Birkaç tane al, farkı gör! 🌽',
  tomato:    'Domates bahçesi güçlü bir gelir kaynağı! Satın al ve büyü! 🍅',
  sunflower: 'Ayçiçeği tarlası en verimli tarlalardan biri! Bir an bile bekleme! 🌻',
  chicken:   'Tavuk kümesi sürekli üretir! Ne kadar çok olursa o kadar iyi! 🐔',
  cow:       'İnek ahırı büyük kazançlar sağlar! Süt ve et = para demek! 🐄',
  sheep:     'Koyun yün + süt üretir, çift kazanç! Hemen al! 🐑',
  pig:       'Domuz çiftliği en yüksek geliri verir! Büyük yatırım, büyük kazanç! 🐷',
};

/* ── Purchase / Unlock bottom sheet ── */
function PurchaseSheet({
  config,
  sectionState,
  balance,
  onUnlock,
  onBuy,
  onClose,
}: {
  config: SectionConfig;
  sectionState: { unlocked: boolean; count: number };
  balance: number;
  onUnlock: () => void;
  onBuy: () => void;
  onClose: () => void;
}) {
  const isLocked = !sectionState.unlocked;
  const isMaxed = sectionState.count >= config.maxUnits;
  const cost = isLocked ? config.unlockCost : config.unitCost;
  const canAfford = balance >= cost;
  const action = isLocked ? onUnlock : onBuy;
  const income = config.baseRate;
  const tip = MASCOT_TIPS[config.id];
  // Show mascot tip when: not maxed, section is wheat OR count is 0
  const showTip = !isMaxed && (config.id === 'wheat' || sectionState.count === 0);

  // Earned per additional unit projection
  const currentIncome = sectionState.count * config.baseRate;
  const nextIncome = (sectionState.count + 1) * config.baseRate;

  return (
    <motion.div
      className="absolute bottom-0 inset-x-0 z-50 px-3 pb-4"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
    >
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Mascot speech bubble */}
      <AnimatePresence>
        {showTip && tip && (
          <motion.div
            className="flex items-end gap-2 mb-2 px-1"
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          >
            {/* Mascot avatar */}
            <motion.img
              src={mascotAvatar}
              alt="Sarı"
              className="w-14 h-14 rounded-full flex-shrink-0 object-cover"
              style={{ border: '3px solid #fbbf24', boxShadow: '0 0 14px rgba(251,191,36,0.55)', background: '#f5c842' }}
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
            />
            {/* Bubble */}
            <div className="relative flex-1 rounded-2xl rounded-bl-none px-3.5 py-2.5 shadow-xl"
              style={{
                background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                border: '2px solid #fbbf24',
                boxShadow: '0 4px 16px rgba(251,191,36,0.4)',
              }}>
              {/* Tail */}
              <div className="absolute -bottom-2 left-4 w-4 h-4 overflow-hidden">
                <div className="w-4 h-4 rotate-45 bg-fbbf24" style={{ background: '#fbbf24', transform: 'rotate(45deg) translateY(-50%)' }} />
              </div>
              <p className="text-yellow-900 font-black text-xs leading-snug">{tip}</p>
              {/* Income preview */}
              {!isLocked && !isMaxed && (
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <div className="flex items-center gap-1 bg-green-100 border border-green-300 rounded-full px-2 py-0.5">
                    <span className="text-green-700 font-black text-[10px]">Şimdi: {formatNum(currentIncome)}/dk</span>
                  </div>
                  <span className="text-yellow-700 text-[10px] font-black">→</span>
                  <div className="flex items-center gap-1 bg-green-200 border border-green-400 rounded-full px-2 py-0.5">
                    <span className="text-green-800 font-black text-[10px]">Alırsan: {formatNum(nextIncome)}/dk 🚀</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main sheet */}
      <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: 'linear-gradient(180deg, #c4832e, #8b5c1e)', padding: '3px', boxShadow: '0 -4px 0 #5c3a21, 0 8px 20px rgba(0,0,0,0.5)' }}>
        <div className="rounded-xl bg-[#a06235] p-4 flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-black/20 border border-[#5c3a21] flex-shrink-0 shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 farm-plot-soil opacity-30" />
            <motion.span
              className="text-4xl relative z-10"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
            >{config.emoji}</motion.span>
          </div>

          <div className="flex-1">
            <div className="font-black text-white text-base">{config.name}</div>
            <div className="text-yellow-200 text-xs font-bold mb-1">{config.description}</div>
            {!isLocked && !isMaxed && (
              <div className="flex gap-2 flex-wrap">
                <div className="text-green-300 text-[11px] font-bold bg-black/20 px-1.5 py-0.5 rounded-md">
                  +{formatNum(income)} TL/dk/birim
                </div>
                <div className="text-white/50 text-[11px] font-bold bg-black/20 px-1.5 py-0.5 rounded-md">
                  Max: {config.maxUnits}
                </div>
                {sectionState.count > 0 && (
                  <div className="text-yellow-300 text-[11px] font-bold bg-black/20 px-1.5 py-0.5 rounded-md">
                    {sectionState.count}/{config.maxUnits} adet
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            {isMaxed ? (
              <div className="text-yellow-300 font-black text-sm">🏆 DOLU</div>
            ) : (
              <>
                <div className="font-black text-white text-lg">{formatNum(cost)}</div>
                <div className="text-yellow-300 text-xs font-bold">TL</div>
              </>
            )}
          </div>
        </div>

        {!isMaxed && (
          <button
            onClick={() => { if (canAfford) { action(); onClose(); } }}
            className="w-full py-3.5 rounded-b-xl font-black text-lg transition-all active:brightness-90"
            style={{
              background: canAfford
                ? 'linear-gradient(180deg, #4dabf7, #1c7ed6)'
                : 'linear-gradient(180deg, #555, #333)',
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
            }}
          >
            {isLocked
              ? canAfford ? '🔓 Kilidi Aç!' : `💸 Eksik: ${formatNum(cost - balance)} TL`
              : canAfford ? `🛒 Satın Al (${formatNum(balance - cost)} TL kalır)` : `💸 Eksik: ${formatNum(cost - balance)} TL`}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Scene Header: Farm buildings & sky ── */
function FarmScene({ state }: { state: any }) {
  const totalUnlocked = SECTIONS.filter(s => state.sections[s.id]?.unlocked).length;
  const totalIncome = SECTIONS.reduce((sum, s) => {
    const sec = state.sections[s.id];
    if (!sec?.unlocked || sec.count === 0) return sum;
    return sum + sec.count * s.baseRate;
  }, 0);

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden"
      style={{
        height: 156,
        background: 'linear-gradient(180deg, #4a90d9 0%, #74c04a 62%, #4ea824 100%)',
      }}
    >
      {/* Sky gradient */}
      <div className="absolute inset-x-0 top-0" style={{ height: 78, background: 'linear-gradient(180deg, #2e6db4 0%, #5bb3e8 55%, #a8d8f0 100%)' }} />

      {/* Sun */}
      <div className="absolute select-none" style={{ top: 6, right: 12, fontSize: 26, animation: 'sunGlow 4s ease-in-out infinite' }}>☀️</div>

      {/* Clouds */}
      <div className="absolute top-0 left-0 right-0 h-20 overflow-hidden pointer-events-none">
        <Cloud top="6px"  size={16} delay={0}   duration={24} />
        <Cloud top="14px" size={12} delay={-9}  duration={32} />
        <Cloud top="3px"  size={14} delay={-17} duration={28} />
      </div>

      {/* Birds */}
      <div className="absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: 16 }}>
        <div style={{ animation: 'birdFly 16s linear -5s infinite', position: 'absolute', fontSize: 10 }}>🐦</div>
        <div style={{ animation: 'birdFly 22s linear -12s infinite', position: 'absolute', top: 8, fontSize: 9 }}>🐦</div>
      </div>

      {/* Tree line */}
      <div className="absolute" style={{ top: 44, left: 0, right: 0 }}>
        <span className="absolute text-4xl" style={{ top: 0, left: 2, animation: 'sway 5s ease-in-out infinite', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🌳</span>
        <span className="absolute text-3xl opacity-80" style={{ top: 8, left: 38, animation: 'sway 6.5s ease-in-out 1s infinite' }}>🌲</span>
        <span className="absolute text-3xl opacity-80" style={{ top: 6, right: 38, animation: 'sway 5.5s ease-in-out 2s infinite' }}>🌲</span>
        <span className="absolute text-4xl" style={{ top: 0, right: 2, animation: 'sway 4.5s ease-in-out 0.5s infinite', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🌳</span>
      </div>

      {/* Grass base */}
      <div className="absolute inset-x-0" style={{ top: 76, height: 22, background: 'linear-gradient(180deg, #6acf38 0%, #4ea824 100%)' }} />

      {/* Road */}
      <div className="absolute inset-x-0 flex items-center overflow-hidden" style={{ top: 98, height: 26, background: 'linear-gradient(180deg, #6b5840, #5a4a35)' }}>
        <div className="absolute inset-x-0 top-0 h-px bg-black/25" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-black/15" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex gap-2.5 px-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-0.5 flex-1 rounded-full" style={{ background: 'rgba(255,220,60,0.45)' }} />
          ))}
        </div>
        <span className="absolute text-lg" style={{ animation: 'truckMove 8s ease-in-out infinite', left: 20 }}>🚛</span>
        <span className="absolute text-base" style={{ animation: 'truckMove 13s linear -5s infinite', left: 55, opacity: 0.9 }}>🚜</span>
      </div>

      {/* Fence strip */}
      <div className="absolute inset-x-0" style={{ top: 124, height: 7, background: 'linear-gradient(90deg, #7a4e1a, #a06235, #7a4e1a)', opacity: 0.85 }} />

      {/* ── LEFT: Market shop ── */}
      <div className="absolute flex flex-col items-end" style={{ bottom: 4, left: 5 }}>
        <div className="flex flex-col items-center">
          {/* Striped awning */}
          <div className="rounded-t-sm overflow-hidden flex shadow" style={{ width: 62, height: 14 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-1" style={{ background: i % 2 === 0 ? '#15803d' : '#166534' }} />
            ))}
          </div>
          {/* Building */}
          <div className="flex items-center justify-center gap-1 rounded-b border border-white/20 shadow-md" style={{ width: 62, height: 38, background: 'linear-gradient(180deg, #f0fdf4 0%, #d1fae5 100%)' }}>
            <span style={{ fontSize: 18 }}>🏪</span>
            <div className="text-center">
              <div className="text-[8px] font-black text-green-800 leading-none">SATIŞ</div>
              <div className="text-[7px] font-bold text-green-600 leading-none">NOKTASI</div>
            </div>
          </div>
        </div>
        {/* Stats badge */}
        <div className="mt-0.5 flex items-center gap-1 rounded-full px-2 py-0.5 shadow" style={{ background: 'rgba(22,101,52,0.92)', border: '1px solid rgba(74,222,128,0.3)' }}>
          <span style={{ fontSize: 8 }}>📊</span>
          <span className="text-white font-black" style={{ fontSize: 8 }}>{totalUnlocked} aktif</span>
        </div>
      </div>

      {/* ── CENTER: Farm name plate ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ bottom: 10 }}>
        <div className="rounded-xl px-3 py-1 shadow-lg flex flex-col items-center gap-0.5"
          style={{ background: 'linear-gradient(135deg, #8b5c1e, #c4832e)', border: '2px solid #f5c842', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
          <div className="text-[8px] font-black text-yellow-200 tracking-widest uppercase leading-none">🌾 ÇİFTLİĞİM</div>
          <div className="font-black text-white leading-none" style={{ fontSize: 10 }}>
            📈 {formatNum(Math.round(totalIncome))}/dk
          </div>
        </div>
      </div>


      <style>{`
        @keyframes cloudDrift {
          from { left: -60px; }
          to   { left: 110%; }
        }
        @keyframes birdFly {
          from { left: -20px; }
          to   { left: 110%; }
        }
        @keyframes sunGlow {
          0%, 100% { filter: drop-shadow(0 0 6px #fbbf24); }
          50%       { filter: drop-shadow(0 0 16px #f59e0b); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(-2deg); }
          50%       { transform: rotate(2deg); }
        }
        @keyframes truckMove {
          0%   { transform: translateX(0); }
          50%  { transform: translateX(60vw); }
          50.01% { transform: translateX(-60px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

/* ── Main GameView ── */
export default function GameView() {
  const { user, telegramId, isNewUser } = useUser();
  const { state, unlockSection, buyUnit, sellProducts, incomePerMin, showWelcomeBonus, setShowWelcomeBonus } = useGameEngine({ isNewUser });
  const saveFarmMut = useSaveFarmState();
  const stateRef = useRef(state);
  stateRef.current = state;
  const [, navigate] = useLocation();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'farm' | 'animal'>('farm');
  const [soundOn, setSoundOn] = useState(() => {
    const saved = localStorage.getItem('farm_sound');
    if (saved === 'off') { setSoundEnabled(false); return false; }
    return true;
  });
  const { showTutorial, doneTutorial } = useMascotTutorial();
  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    localStorage.setItem('farm_sound', next ? 'on' : 'off');
  };

  // Telegram init
  useEffect(() => {
    try {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    } catch (_) {}
  }, []);

  // Backend save (every 30s)
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      saveFarmMut.mutate({
        telegramId,
        data: {
          balance: s.balance,
          farmState: {
            wheat: s.sections['wheat']?.count ?? 0,
            chicken: s.sections['chicken']?.count ?? 0,
            cow: s.sections['cow']?.count ?? 0,
          },
        },
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [telegramId]);

  const streak = user?.streakCount ?? 0;
  const shownSections = SECTIONS.filter(s => s.category === activeTab);

  const selectedConfig = selectedId ? SECTIONS.find(s => s.id === selectedId) ?? null : null;
  const selectedState = selectedId ? (state.sections[selectedId] ?? { unlocked: false, count: 0 }) : null;

  return (
    <div className="h-full flex flex-col relative z-0" style={{ background: '#2e6012' }}>
      <FarmBackground />

      {/* ══ WELCOME BONUS POPUP ══ */}
      <AnimatePresence>
        {showWelcomeBonus && (
          <motion.div className="absolute inset-0 z-[999] flex items-center justify-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowWelcomeBonus(false)} />
            <motion.div
              className="relative z-10 rounded-3xl border-4 border-yellow-500 p-6 mx-6 flex flex-col items-center gap-3"
              style={{ background: 'linear-gradient(135deg, #1a3d08, #2e6012)' }}
              initial={{ scale: 0.6, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            >
              <motion.span className="text-7xl" animate={{ rotate: [-5, 5, -5], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>🎁</motion.span>
              <div className="text-center">
                <h2 className="text-2xl font-black text-yellow-300">Hoş Geldin Bonusu!</h2>
                <p className="text-white/80 text-sm mt-1">Çiftliğine başlamak için hediye</p>
                {/* One-time badge */}
                <div className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full border border-orange-400/60 bg-orange-400/15">
                  <span className="text-orange-300 text-[11px] font-black">⚠️ Tek seferlik — bir daha verilmez!</span>
                </div>
              </div>
              <div className="bg-yellow-400/20 border-2 border-yellow-400 rounded-2xl px-8 py-3 text-center">
                <div className="text-4xl font-black text-yellow-300">+{WELCOME_BONUS} TL</div>
                <div className="text-yellow-200/70 text-xs font-bold mt-0.5">hesabına eklendi! 🎉</div>
              </div>
              <motion.button
                className="w-full py-3 rounded-2xl font-black text-yellow-900 text-lg border-2 border-yellow-600"
                style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)' }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowWelcomeBonus(false)}
              >
                🚀 Oynamaya Başla!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ TOP BAR ══ */}
      <div className="flex items-center gap-2 px-3 py-2 z-40 relative flex-shrink-0" style={{ background: 'rgba(0,0,0,0.4)', borderBottom: '2px solid rgba(255,255,255,0.15)' }}>
        <div className="top-balance-pill">
          <span className="text-base">💵</span>
          <span className="font-black text-white text-sm font-mono tabular-nums">{formatNum(state.balance)}</span>
          <span className="text-white/50 text-[10px]">TL</span>
        </div>

        <div className="top-balance-pill">
          <span className="text-base">🪙</span>
          <span className="font-black text-yellow-300 text-sm font-mono tabular-nums">
            {(user?.coins ?? 0).toLocaleString()}
          </span>
        </div>

        <button
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-yellow-400 shadow-md active:scale-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)' }}
          onClick={() => navigate('/stars')}
        >
          <Plus size={14} className="text-yellow-900" strokeWidth={3} />
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all active:scale-90"
          style={soundOn
            ? { background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)' }
            : { background: 'rgba(0,0,0,0.3)', borderColor: 'rgba(255,255,255,0.1)' }}
          title={soundOn ? 'Sesi Kapat' : 'Sesi Aç'}
        >
          {soundOn
            ? <Volume2 size={13} className="text-white" />
            : <VolumeX size={13} className="text-white/50" />}
        </button>

        <div className="flex-1" />

        <OnlineCounterPill />

        <div className="top-balance-pill">
          <span className="text-green-400 text-xs font-black">📈 {formatNum(incomePerMin)}/dk</span>
        </div>

        {streak > 0 && (
          <div className="top-balance-pill">
            <Flame size={12} className="text-orange-400" />
            <span className="text-white font-black text-xs">{streak}</span>
          </div>
        )}
      </div>

      {/* ══ MARKET PANEL ══ */}
      <div className="relative flex-shrink-0">
        <MarketPanel
          storage={state.storage}
          gameState={state}
          onSell={sellProducts}
        />
        <SellHintMascot hasProducts={Object.values(state.storage).some(v => Math.floor(v) > 0)} />
      </div>

      {/* ══ MAIN SCENE ══ */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── Left: Scrollable farm area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Rich farm scene header */}
          <FarmScene state={state} />

          {/* Live NFT showcase strip */}
          <LiveNftShowcase />

          {/* Farm / Animal tab bar */}
          <div className="flex flex-shrink-0 px-2 py-1.5 gap-2" style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {([
              { key: 'farm',   emoji: '🌾', label: 'TARLALAR',  count: SECTIONS.filter(s => s.category === 'farm' && state.sections[s.id]?.unlocked).length },
              { key: 'animal', emoji: '🐄', label: 'HAYVANLAR', count: SECTIONS.filter(s => s.category === 'animal' && state.sections[s.id]?.unlocked).length },
            ] as const).map(({ key, emoji, label, count }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl transition-all active:scale-95"
                style={activeTab === key ? {
                  background: 'linear-gradient(135deg, #c4832e, #8b5c1e)',
                  border: '1.5px solid #f5c842',
                  boxShadow: '0 2px 8px rgba(196,131,46,0.4)',
                  paddingTop: 6, paddingBottom: 6,
                } : {
                  background: 'rgba(255,255,255,0.07)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                  paddingTop: 6, paddingBottom: 6,
                }}
              >
                <span style={{ fontSize: 15 }}>{emoji}</span>
                <div className="flex flex-col items-start">
                  <span className={`font-black leading-none tracking-wide ${activeTab === key ? 'text-yellow-200' : 'text-white/60'}`} style={{ fontSize: 10 }}>{label}</span>
                  <span className={`font-bold leading-none ${activeTab === key ? 'text-yellow-300/80' : 'text-white/30'}`} style={{ fontSize: 8 }}>{count} aktif</span>
                </div>
              </button>
            ))}
          </div>

          {/* Scrollable plots */}
          <div className="flex-1 overflow-y-auto custom-scrollbar py-1 pb-4">
            <AnimatePresence mode="popLayout">
              {shownSections.map(cfg => (
                <FarmPlot
                  key={cfg.id}
                  config={cfg}
                  count={state.sections[cfg.id]?.count ?? 0}
                  unlocked={state.sections[cfg.id]?.unlocked ?? false}
                  balance={state.balance}
                  onTap={() => setSelectedId(s => s === cfg.id ? null : cfg.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>

      {/* ══ PURCHASE SHEET ══ */}
      <AnimatePresence>
        {selectedConfig && selectedState && (
          <PurchaseSheet
            key={selectedId}
            config={selectedConfig}
            sectionState={selectedState}
            balance={state.balance}
            onUnlock={() => {
              unlockSection(selectedConfig.id);
              playUnlockSound();
              setSelectedId(null);
            }}
            onBuy={() => {
              buyUnit(selectedConfig.id);
              if (selectedConfig.category === 'animal') {
                playAnimalSound(selectedConfig.id);
              } else {
                playCoinSound();
              }
            }}
            onClose={() => setSelectedId(null)}
          />
        )}
      </AnimatePresence>

      {/* ══ MASCOT TUTORIAL ══ */}
      <AnimatePresence>
        {showTutorial && (
          <MascotTutorial key="mascot-tutorial" onDone={doneTutorial} />
        )}
      </AnimatePresence>
    </div>
  );
}
