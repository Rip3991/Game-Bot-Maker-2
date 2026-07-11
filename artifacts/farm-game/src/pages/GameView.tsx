import React, { useEffect, useRef, useState } from 'react';
import { useGameEngine, SECTIONS, WELCOME_BONUS, SectionConfig, replantCost, xpToNextLevel, levelMultiplier, isNextInUnlockOrder, prevSectionInOrder, getEffectiveHarvestMinutes } from '../hooks/use-game-engine';
import { MarketPanel } from '../components/MarketPanel';
import { useUser } from '../hooks/use-user';
import { useSaveFarmState, useGetOnlineStats, getGetOnlineStatsQueryKey } from '@workspace/api-client-react';
import { motion, AnimatePresence, useIsPresent } from 'framer-motion';
import { Plus, Lock, Volume2, VolumeX, Settings } from 'lucide-react';
import { useLocation } from 'wouter';
import { formatNum, formatCycleDuration } from '../utils/format';
import { playCoinSound, playAnimalSound, playUnlockSound, isSoundEnabled, setSoundEnabled, isMusicEnabled, setMusicEnabled, getMusicVolume, setMusicVolume } from '../lib/sound';
import MascotTutorial, { useMascotTutorial } from '../components/MascotTutorial';
import mascotAvatar from '../assets/mascot-avatar.png';
import { SellHintMascot } from '../components/SellHintMascot';
import { FarmBackground } from '../components/FarmBackground';
import { FarmIllustration, FarmIllustrationBadge } from '../components/FarmIllustration';

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

/* ── Animated Cloud ──
   Tinted per time-of-day so it reads as lit by the same sky underneath it
   instead of a flat white cutout — warm/pink at sunrise & sunset, bright
   and cool at midday. */
const CLOUD_FILTERS: Record<DayPeriod, string> = {
  sabah:  'sepia(0.45) saturate(1.6) hue-rotate(-15deg) brightness(1.05) opacity(0.85)',
  gunduz: 'saturate(1.05) brightness(1.08) opacity(0.75)',
  aksam:  'sepia(0.6) saturate(1.8) hue-rotate(-25deg) brightness(0.92) opacity(0.85)',
  gece:   'opacity(0)',
};
function Cloud({ top, size, delay, duration, period }: { top: string; size: number; delay: number; duration: number; period: DayPeriod }) {
  return (
    <div
      className="absolute pointer-events-none select-none transition-[filter] duration-1000"
      style={{
        top,
        fontSize: size,
        filter: CLOUD_FILTERS[period],
        animation: `cloudDrift ${duration}s linear ${delay}s infinite`,
      }}
    >
      ☁️
    </div>
  );
}

/* Product emojis per section — shown as floating particles on harvest */
const HARVEST_EMOJI: Record<string, string> = {
  wheat: '🌾', onion: '🧅', corn: '🌽', carrot: '🥕', tomato: '🍅',
  strawberry: '🍓', sunflower: '🌻', grape: '🍇', apple: '🍎', blueberry: '🫐',
  chicken: '🥚', cow: '🥛', sheep: '🧶', pig: '🥩', horse: '🐎',
  rabbit: '🐇', duck: '🦆', goat: '🧀', turkey: '🍖', bee: '🍯',
  alpaca: '🦙', deer: '🦌', peacock: '🪶',
};

/* ── Single farm plot card ── */
function FarmPlot({
  config,
  count,
  growCount,
  unlocked,
  coins,
  balance,
  plotFill,
  needsReplant,
  level,
  canUnlockNow,
  onTap,
  onHarvest,
  onReplant,
}: {
  config: SectionConfig;
  count: number;
  /** Units contributing to the harvest currently in progress (see growCount in the engine). */
  growCount: number;
  unlocked: boolean;
  /** Coin balance — unlock/buy are paid in Coins, never TL. */
  coins: number;
  /** Real TL balance — replant ("Ek"/"Büyüt") is paid from this, 1 TL/unit. */
  balance: number;
  plotFill: number;
  needsReplant: boolean;
  level: number;
  canUnlockNow: boolean;
  onTap: () => void;
  onHarvest: () => void;
  onReplant: () => void;
}) {
  const lMult = levelMultiplier(level);
  // Income projection uses growCount (this cycle's yield), not the live
  // count — matches what harvestPlot will actually pay out right now.
  const effectiveMinutes = getEffectiveHarvestMinutes(config, count);
  const income = growCount > 0 ? Math.round(growCount * config.sellPrice / effectiveMinutes * lMult) : 0;
  const harvestEmoji = HARVEST_EMOJI[config.id] ?? config.emoji;
  const [fxParticles, setFxParticles] = React.useState<{ id: number; x: number; isReplant?: boolean }[]>([]);
  // Track the fx-particle clear timeout so a fast unmount (e.g. section
  // re-render/removal right after a tap) can't set state on an unmounted
  // component.
  const fxClearTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (fxClearTimeoutRef.current) clearTimeout(fxClearTimeoutRef.current);
  }, []);
  const spawnFxParticles = React.useCallback((particles: { id: number; x: number; isReplant?: boolean }[]) => {
    if (fxClearTimeoutRef.current) clearTimeout(fxClearTimeoutRef.current);
    setFxParticles(particles);
    fxClearTimeoutRef.current = setTimeout(() => setFxParticles([]), 1100);
  }, []);
  const canAffordUnlock = coins >= config.unlockCost;
  const isFarm = config.category === 'farm';
  const prevRequired = !unlocked && !canUnlockNow ? prevSectionInOrder(config.id) : null;
  const isHarvestReady = unlocked && count > 0 && !needsReplant && plotFill >= 1.0;
  const replantNeeded = unlocked && count > 0 && needsReplant;
  const rcost = replantNeeded ? replantCost(config, count) : 0;
  const canAffordReplant = balance >= rcost;
  const fillPct = Math.min(count / config.maxUnits, 1);

  // Category-specific palette
  const palette = isFarm ? {
    frameFrom: '#b8832a',
    frameTo: '#7a5018',
    frameShadow: '#4a2e08',
    soilBg: 'linear-gradient(180deg, #3d2810 0%, #2a1a08 100%)',
    rowColor: 'rgba(92,58,16,0.6)',
    accentColor: '#4ade80',
    badgeBg: 'linear-gradient(135deg, #5c3a10, #3d2408)',
    badgeBorder: '#2a1405',
    headerBg: 'linear-gradient(135deg, #1a0e04, #2e1a08)',
    incomeColor: '#86efac',
    barColor: '#4ade80',
    zoneDecor: ['🌱', '🌿', '🍃'],
  } : {
    frameFrom: '#5a7a28',
    frameTo: '#3a5618',
    frameShadow: '#1e3008',
    soilBg: 'linear-gradient(180deg, #1a2e08 0%, #0f1e05 100%)',
    rowColor: 'rgba(42,74,20,0.55)',
    accentColor: '#fbbf24',
    badgeBg: 'linear-gradient(135deg, #2a4410, #1a2e08)',
    badgeBorder: '#0f1e05',
    headerBg: 'linear-gradient(135deg, #0a1804, #142606)',
    incomeColor: '#fde68a',
    barColor: '#fbbf24',
    zoneDecor: ['🌾', '🌻', '🍀'],
  };

  return (
    <motion.div
      className="relative mx-3 my-2 rounded-2xl overflow-hidden"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      style={{
        boxShadow: `0 5px 0 ${palette.frameShadow}, 0 8px 20px rgba(0,0,0,0.4)`,
        background: `linear-gradient(145deg, ${palette.frameFrom}, ${palette.frameTo})`,
        padding: '2px',
      }}
    >
      <div className="rounded-2xl overflow-hidden">

        {/* ── HEADER BAR ── */}
        <div
          className="flex items-center justify-between px-3 py-2.5"
          style={{ background: palette.headerBg }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Illustration badge */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner overflow-hidden"
              style={{ background: palette.badgeBg, border: `1.5px solid ${palette.badgeBorder}` }}
            >
              <FarmIllustrationBadge id={config.id} size={34} />
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="font-black text-white leading-none truncate" style={{ fontSize: 11 }}>{config.name}</span>
              {unlocked ? (
                <div className="flex items-center gap-2 mt-0.5">
                  {/* Mini progress bar */}
                  <div className="flex-1 max-w-[48px] h-1 rounded-full bg-black/40 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: palette.barColor, width: `${fillPct * 100}%` }}
                      animate={{ width: `${fillPct * 100}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <span className="font-bold leading-none" style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)' }}>
                    {count}/{config.maxUnits}
                  </span>
                  {count > 0 && (
                    <span className="font-bold leading-none" style={{ fontSize: 9, color: palette.incomeColor }}>
                      📈 {formatNum(income)}/dk
                    </span>
                  )}
                </div>
              ) : prevRequired ? (
                <span className="font-bold leading-none" style={{ fontSize: 9, color: 'rgba(255,150,150,0.55)' }}>
                  🔒 Önce {prevRequired.name}
                </span>
              ) : (
                <span className="font-bold leading-none" style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                  🔒 {formatNum(config.unlockCost)} 🪙 gerekli
                </span>
              )}
            </div>
          </div>

          {unlocked ? (
            <button
              onClick={onTap}
              className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all flex-shrink-0 ml-2"
              style={{
                background: 'linear-gradient(135deg, #f5c842, #e6a800)',
                border: '1.5px solid rgba(255,200,60,0.6)',
                boxShadow: '0 2px 8px rgba(245,200,66,0.4)',
              }}
            >
              <Plus size={14} className="text-yellow-900" strokeWidth={3} />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center flex-shrink-0 ml-2">
              <Lock size={12} className="text-gray-500" />
            </div>
          )}
        </div>

        {/* ── PLOT VISUAL ── */}
        <div
          className="relative overflow-hidden"
          onClick={onTap}
          style={{ cursor: 'pointer', minHeight: 122 }}
        >
          {unlocked ? (
            <>
              {/* Background */}
              <div className="absolute inset-0" style={{ background: palette.soilBg }} />

              {isFarm ? (
                /* Farm: plowed row stripes */
                <>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="absolute inset-x-0 h-4"
                      style={{
                        top: `${i * 17}%`,
                        background: i % 2 === 0 ? 'rgba(74,42,16,0.5)' : 'rgba(58,32,10,0.35)',
                        borderTop: '1px solid rgba(120,80,30,0.25)',
                      }} />
                  ))}
                  {/* Soil texture overlay */}
                  <div className="absolute inset-0 farm-plot-soil opacity-30" />
                  {/* Fence posts */}
                  <div className="absolute inset-x-0 top-0 flex gap-6 px-2 pointer-events-none">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-3 rounded-b-sm flex-shrink-0"
                        style={{ background: 'rgba(139,92,30,0.8)' }} />
                    ))}
                  </div>
                  <div className="absolute inset-x-0 top-2.5 h-0.5 mx-2"
                    style={{ background: 'rgba(139,92,30,0.55)' }} />
                </>
              ) : (
                /* Animal: grass pasture */
                <>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #1a3c08 0%, #0f2505 100%)' }} />
                  {/* Grass patches */}
                  <div className="absolute inset-x-0 bottom-0 h-6" style={{ background: 'linear-gradient(180deg, transparent, rgba(20,80,8,0.6))' }} />
                  {/* Fence line top */}
                  <div className="absolute inset-x-0 top-0 h-2.5"
                    style={{ background: 'linear-gradient(90deg, #5c3a10, #8b5c1e, #5c3a10)' }} />
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="absolute top-0 w-2 h-4 rounded-b"
                      style={{ left: `${10 + i * 20}%`, background: 'rgba(92,58,16,0.9)' }} />
                  ))}
                  {/* Ground texture */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle, rgba(34,100,16,0.15) 1px, transparent 1px)',
                    backgroundSize: '12px 12px',
                  }} />
                </>
              )}

              {/* Illustrated units + harvest overlay */}
              <div className="relative z-10 flex items-center justify-center py-3 px-3 min-h-[96px]">
                {count === 0 ? (
                  <div className="flex flex-col items-center gap-1 opacity-35">
                    <span className="text-3xl">{isFarm ? '🌱' : '🌿'}</span>
                    <span className="text-white text-[10px] italic font-bold">{isFarm ? 'Boş tarla' : 'Boş mera'}</span>
                  </div>
                ) : (
                  <FarmIllustration id={config.id} count={count} maxUnits={config.maxUnits} size={76} />
                )}

                {/* Animal product cue (egg/milk/wool/etc.) — bobs above the pasture
                    while the cycle is in progress, so it's clear what's being
                    produced, not just a generic fill bar. Operator request 2026-07-10. */}
                {!isFarm && count > 0 && !replantNeeded && (
                  <motion.div
                    className="absolute top-1 right-2 flex items-center justify-center rounded-full z-10"
                    style={{
                      width: 22, height: 22,
                      background: isHarvestReady ? 'rgba(251,191,36,0.25)' : 'rgba(0,0,0,0.25)',
                      boxShadow: isHarvestReady ? '0 0 10px rgba(251,191,36,0.7)' : 'none',
                    }}
                    animate={{ y: [0, -4, 0], scale: isHarvestReady ? [1, 1.15, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: isHarvestReady ? 0.9 : 2.2, ease: 'easeInOut' }}
                  >
                    <span style={{ fontSize: 13, opacity: 0.3 + fillPct * 0.7 }}>{harvestEmoji}</span>
                  </motion.div>
                )}

                {/* Harvest ready overlay */}
                {isHarvestReady && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(1px)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.button
                      className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl font-black"
                      style={{
                        background: 'linear-gradient(135deg, #f5c842, #e6a800)',
                        border: '2.5px solid #fde68a',
                        boxShadow: '0 0 20px rgba(245,200,66,0.6)',
                        color: '#451a00',
                      }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const now = Date.now();
                        spawnFxParticles(Array.from({ length: 6 }, (_, i) => ({
                          id: now + i,
                          x: 10 + Math.floor(Math.random() * 80),
                        })));
                        onHarvest();
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{harvestEmoji}</span>
                      <span style={{ fontSize: 12 }}>{isFarm ? 'Hasat Et!' : 'Topla!'}</span>
                    </motion.button>
                  </motion.div>
                )}

                {/* Replant overlay */}
                {replantNeeded && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center z-20"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.button
                      className="flex flex-col items-center gap-1.5 px-5 py-3 rounded-2xl font-black relative overflow-hidden"
                      style={{
                        background: canAffordReplant
                          ? 'linear-gradient(135deg, #22c55e, #15803d)'
                          : 'linear-gradient(135deg, #374151, #1f2937)',
                        border: `2px solid ${canAffordReplant ? '#4ade80' : '#6b7280'}`,
                        boxShadow: canAffordReplant ? '0 8px 25px rgba(34,197,94,0.6)' : 'none',
                        color: 'white',
                      }}
                      initial={{ scale: 0.8, y: 10 }}
                      animate={canAffordReplant ? { scale: [1, 1.05, 1], y: 0 } : { scale: 1, y: 0 }}
                      transition={{ 
                        scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
                        y: { type: "spring", stiffness: 300, damping: 20 }
                      }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        if (canAffordReplant) {
                          const now = Date.now();
                          spawnFxParticles(Array.from({ length: 8 }, (_, i) => ({
                            id: now + 100 + i,
                            x: 10 + Math.floor(Math.random() * 80),
                            isReplant: true
                          })));
                          onReplant(); 
                        }
                      }}
                      whileTap={canAffordReplant ? { scale: 0.9 } : {}}
                    >
                      {/* Shine effect */}
                      {canAffordReplant && (
                        <motion.div 
                          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]"
                          animate={{ x: ['-200%', '200%'] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                        />
                      )}
                      
                      <motion.div 
                        animate={canAffordReplant ? { y: [0, -4, 0] } : {}}
                        transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                        className="relative z-10"
                      >
                        <span style={{ fontSize: 24, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}>{isFarm ? '🌱' : '🐣'}</span>
                      </motion.div>
                      
                      <span className="relative z-10 text-[12px] uppercase tracking-wider drop-shadow-md">
                        {canAffordReplant
                          ? (isFarm ? `Ek! (${formatNum(rcost)} TL)` : `Büyüt! (${formatNum(rcost)} TL)`)
                          : `Yetersiz: ${formatNum(rcost)} TL`}
                      </span>
                    </motion.button>
                  </motion.div>
                )}
              </div>

              {/* Harvest fill progress bar */}
              {unlocked && count > 0 && !needsReplant && !isHarvestReady && (
                <div className="mx-3 mb-2 relative z-10">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[8px] font-bold text-white/40">
                      {isFarm ? 'Büyüyor' : 'Üretiyor'} {Math.round(plotFill * 100)}%
                      {(() => {
                        const remSec = Math.ceil((1 - plotFill) * effectiveMinutes * 60 / lMult);
                        if (remSec <= 0) return null;
                        const m = Math.floor(remSec / 60);
                        const s = remSec % 60;
                        return (
                          <span className="ml-1 text-white/30">
                            · {m > 0 ? `${m}dk ` : ''}{s > 0 ? `${s}sn` : ''}
                          </span>
                        );
                      })()}
                    </span>
                    <span className="text-[8px] font-bold text-white/40">
                      ⏱ {formatCycleDuration(effectiveMinutes / lMult)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-black/40 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full relative overflow-hidden"
                      style={{
                        background: `linear-gradient(90deg, ${palette.barColor}88, ${palette.barColor})`,
                        width: `${plotFill * 100}%`,
                      }}
                      animate={{ width: `${plotFill * 100}%` }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="absolute inset-0 animate-pulse opacity-40"
                        style={{ background: 'linear-gradient(90deg, transparent, white, transparent)' }} />
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Bottom zone label */}
              <div className="absolute bottom-0 inset-x-0 flex items-center justify-between px-2 pb-1 pointer-events-none">
                <div className="flex items-center gap-0.5">
                  {palette.zoneDecor.map((d, i) => (
                    <span key={i} className="text-[9px] opacity-40">{d}</span>
                  ))}
                </div>
                {count > 0 && (
                  <div className="rounded-full px-1.5 py-0.5"
                    style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${palette.accentColor}30` }}>
                    <span className="font-black text-[8px]" style={{ color: palette.accentColor }}>
                      ⏱ {formatCycleDuration(effectiveMinutes / lMult)}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Locked state */
            <div
              className="absolute inset-0 flex flex-col items-center justify-center gap-2"
              style={{
                background: 'repeating-linear-gradient(45deg, #1a1a1a 0px, #1a1a1a 10px, #141414 10px, #141414 20px)',
              }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: canAffordUnlock
                      ? 'linear-gradient(135deg, rgba(245,200,66,0.2), rgba(230,168,0,0.1))'
                      : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${canAffordUnlock ? 'rgba(245,200,66,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  }}>
                  <Lock size={22} className={canAffordUnlock ? 'text-yellow-400' : 'text-gray-600'} />
                </div>
                <div className="text-center">
                  <div className="font-black text-white text-sm">{config.name}</div>
                  {prevRequired ? (
                    <div className="text-xs font-bold mt-0.5 text-red-300">
                      🔒 Önce {prevRequired.name}
                    </div>
                  ) : (
                    <div className={`text-xs font-bold mt-0.5 ${canAffordUnlock ? 'text-yellow-300' : 'text-gray-500'}`}>
                      🔒 {formatNum(config.unlockCost)} 🪙
                    </div>
                  )}
                </div>
                {canAffordUnlock && canUnlockNow && (
                  <motion.div
                    className="text-[9px] font-black text-yellow-300 bg-yellow-400/15 border border-yellow-400/30 rounded-full px-2 py-0.5"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  >
                    ✨ Açmaya hazır!
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {/* Floating harvest product particles */}
          {fxParticles.map(p => (
            <motion.span
              key={p.id}
              style={{
                position: 'absolute',
                bottom: '40%',
                left: `${p.x}%`,
                fontSize: p.isReplant ? 24 : 20,
                pointerEvents: 'none',
                zIndex: 60,
                userSelect: 'none',
                filter: p.isReplant ? 'drop-shadow(0 0 8px rgba(74,222,128,0.8))' : 'none',
              }}
              initial={{ y: 0, opacity: 1, scale: 0.5 }}
              animate={{ 
                y: p.isReplant ? -90 : -70, 
                opacity: [1, 1, 0], 
                scale: p.isReplant ? [0.5, 1.5, 1.2] : 1.4,
                rotate: p.isReplant ? [0, 15, -15, 0] : 0
              }}
              transition={{ duration: p.isReplant ? 1.1 : 0.9, ease: 'easeOut' }}
            >
              {p.isReplant ? (isFarm ? '🌱' : '✨') : harvestEmoji}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Mascot tip messages per section ── */
const MASCOT_TIPS: Record<string, string> = {
  wheat:     'Buğday tarlası al! Ne kadar çok tarlana sahip olursan, o kadar çok Coin kazanırsın! 🌾🪙',
  corn:      'Mısır tarlası çok daha fazla Coin üretir! Birkaç tane al, farkı gör! 🌽🪙',
  tomato:    'Domates bahçesi güçlü bir Coin kaynağı! Satın al ve büyü! 🍅🪙',
  sunflower: 'Ayçiçeği tarlası en verimli tarlalardan biri! Bir an bile bekleme! 🌻🪙',
  chicken:   'Tavuk kümesi sürekli Coin üretir! Ne kadar çok olursa o kadar iyi! 🐔🪙',
  cow:       'İnek ahırı büyük Coin kazançları sağlar! Süt ve et = coin demek! 🐄🪙',
  sheep:     'Koyun yün + süt üretir, çift Coin kazancı! Hemen al! 🐑🪙',
  pig:       'Domuz çiftliği en yüksek Coin geliri verir! Büyük yatırım, büyük kazanç! 🐷🪙',
};

/* ── Purchase / Unlock bottom sheet ── */
function PurchaseSheet({
  config,
  sectionState,
  coins,
  level,
  canUnlockNow,
  onUnlock,
  onBuy,
  onClose,
}: {
  config: SectionConfig;
  sectionState: { unlocked: boolean; count: number; growCount?: number; needsReplant?: boolean };
  /** Coin balance — unlocks/purchases are paid in Coins, never TL. */
  coins: number;
  level: number;
  canUnlockNow: boolean;
  onUnlock: () => void;
  onBuy: () => void;
  onClose: () => void;
}) {
  // While this sheet is exiting (its section became harvest-ready/needs-replant
  // and GameView auto-closed it, or the user tapped away), the fixed full-screen
  // backdrop must stop capturing taps immediately — not just once fully
  // unmounted — so a tap aimed at the harvest/replant overlay button underneath
  // isn't swallowed mid-exit-animation.
  const isPresent = useIsPresent();
  const isLocked = !sectionState.unlocked;
  const isMaxed = sectionState.count >= config.maxUnits;
  const cost = isLocked ? config.unlockCost : config.unitCost;
  const canAfford = coins >= cost;
  const blockedByOrder = isLocked && !canUnlockNow;
  const prevRequired = blockedByOrder ? prevSectionInOrder(config.id) : null;
  const action = isLocked ? onUnlock : onBuy;
  const lMult = levelMultiplier(level);
  const perUnitPerMin = config.sellPrice / getEffectiveHarvestMinutes(config, 1) * lMult;
  const income = perUnitPerMin;
  const tip = MASCOT_TIPS[config.id];
  // Show mascot tip when: not maxed, section is wheat OR count is 0
  const showTip = !isMaxed && (config.id === 'wheat' || sectionState.count === 0);

  // Earned per additional unit projection — based on growCount (units that
  // actually count for the harvest in progress), matching real payout.
  // Buying now only raises `nextIncome`, realized after the next replant.
  const currentIncome = (sectionState.growCount ?? sectionState.count) * perUnitPerMin;
  const nextIncome = (sectionState.count + 1) * perUnitPerMin;

  return (
    <motion.div
      className="absolute bottom-0 inset-x-0 z-50 px-3 pb-4"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
    >
      <div
        className="fixed inset-0 -z-10"
        style={{ pointerEvents: isPresent ? 'auto' : 'none' }}
        onClick={onClose}
      />

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
                  +{formatNum(income)} 🪙/dk/birim
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
            ) : blockedByOrder ? (
              <div className="text-red-300 font-black text-xs">🔒 Sırada değil</div>
            ) : (
              <>
                <div className="font-black text-white text-lg">{formatNum(cost)}</div>
                <div className="text-yellow-300 text-xs font-bold">🪙</div>
              </>
            )}
          </div>
        </div>

        {blockedByOrder && prevRequired && (
          <div className="px-4 pb-2 -mt-1">
            <div className="text-red-200 text-[11px] font-bold bg-red-900/40 border border-red-500/40 rounded-lg px-2.5 py-1.5">
              🔒 Önce "{prevRequired.name}"nı açman gerekiyor — tarlalar ve hayvanlar sırayla açılır.
            </div>
          </div>
        )}

        {!isMaxed && (
          <button
            onClick={() => { if (canAfford && !blockedByOrder) { action(); onClose(); } }}
            className="w-full py-3.5 rounded-b-xl font-black text-lg transition-all active:brightness-90"
            disabled={blockedByOrder}
            style={{
              background: blockedByOrder
                ? 'linear-gradient(180deg, #444, #222)'
                : canAfford
                ? 'linear-gradient(180deg, #4dabf7, #1c7ed6)'
                : 'linear-gradient(180deg, #555, #333)',
              color: blockedByOrder ? 'rgba(255,255,255,0.5)' : 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.4)',
              cursor: blockedByOrder ? 'not-allowed' : 'pointer',
            }}
          >
            {blockedByOrder
              ? `🔒 Önce ${prevRequired?.name ?? 'öncekini'} aç`
              : isLocked
              ? canAfford ? '🔓 Kilidi Aç!' : `💸 Eksik: ${formatNum(cost - coins)} 🪙`
              : canAfford ? `🛒 Satın Al (${formatNum(coins - cost)} 🪙 kalır)` : `💸 Eksik: ${formatNum(cost - coins)} 🪙`}
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ── Day/night cycle synced to real Türkiye (Europe/Istanbul) time ── */
type DayPeriod = 'gece' | 'sabah' | 'gunduz' | 'aksam';

function getIstanbulHour(): number {
  try {
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Istanbul', hour: '2-digit', hour12: false });
    return parseInt(fmt.format(new Date()), 10) % 24;
  } catch {
    return new Date().getHours();
  }
}

function getDayPeriod(hour: number): DayPeriod {
  if (hour >= 6 && hour < 9) return 'sabah';   // dawn
  if (hour >= 9 && hour < 18) return 'gunduz';  // day
  if (hour >= 18 && hour < 21) return 'aksam';  // dusk
  return 'gece';                                // night
}

const SKY_PALETTES: Record<DayPeriod, { scene: string; sky: string; grass: string; ground: string }> = {
  sabah:  { scene: 'linear-gradient(180deg, #f2a765 0%, #8fc768 62%, #4ea824 100%)', sky: 'linear-gradient(180deg, #6b6bb0 0%, #e8946a 55%, #ffd39a 100%)', grass: 'linear-gradient(180deg, #8fd955 0%, #5cb52c 100%)', ground: '#5a4a35' },
  gunduz: { scene: 'linear-gradient(180deg, #4a90d9 0%, #74c04a 62%, #4ea824 100%)', sky: 'linear-gradient(180deg, #2e6db4 0%, #5bb3e8 55%, #a8d8f0 100%)', grass: 'linear-gradient(180deg, #6acf38 0%, #4ea824 100%)', ground: '#6b5840' },
  aksam:  { scene: 'linear-gradient(180deg, #d9622e 0%, #6a7a3e 62%, #395218 100%)', sky: 'linear-gradient(180deg, #2b1f4a 0%, #a1466b 55%, #f0894a 100%)', grass: 'linear-gradient(180deg, #5aa430 0%, #3c7d1c 100%)', ground: '#4a3a2a' },
  gece:   { scene: 'linear-gradient(180deg, #0b1330 0%, #1c3a2a 62%, #16290f 100%)', sky: 'linear-gradient(180deg, #050a1e 0%, #10214a 55%, #1f3a63 100%)', grass: 'linear-gradient(180deg, #2c5a1c 0%, #1a3d0f 100%)', ground: '#332a1e' },
};

/* ── Scene Header: Farm buildings & sky ── */
function FarmScene({ state }: { state: any }) {
  const totalUnlocked = SECTIONS.filter(s => state.sections[s.id]?.unlocked).length;
  const lMult = levelMultiplier(state.level);
  const totalIncome = SECTIONS.reduce((sum, s) => {
    const sec = state.sections[s.id];
    if (!sec?.unlocked || sec.count === 0) return sum;
    // Matches actual harvest payout: growCount units × sellPrice per
    // effective (count-scaled) harvestMinutes cycle.
    return sum + (sec.growCount ?? sec.count) * s.sellPrice / getEffectiveHarvestMinutes(s, sec.count) * lMult;
  }, 0);

  // Re-check the Türkiye saati every minute so the scene transitions live
  // (sabah → gündüz → akşam → gece) without needing a page reload.
  const [hour, setHour] = useState(() => getIstanbulHour());
  useEffect(() => {
    const id = setInterval(() => setHour(getIstanbulHour()), 60000);
    return () => clearInterval(id);
  }, []);
  const period = getDayPeriod(hour);
  const isNight = period === 'gece';
  const palette = SKY_PALETTES[period];

  return (
    <div
      className="relative flex-shrink-0 overflow-hidden transition-colors duration-1000"
      style={{ height: 108, background: palette.scene }}
    >
      {/* Sky gradient */}
      <div className="absolute inset-x-0 top-0 transition-colors duration-1000" style={{ height: 52, background: palette.sky }} />

      {/* Stars (night only) */}
      {isNight && (
        <div className="absolute inset-x-0 top-0 h-11 overflow-hidden pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <span key={i} className="absolute text-[5px]" style={{ left: `${(i * 13 + 4) % 100}%`, top: `${(i * 15 + 3) % 55}%`, animation: `sunGlow ${3 + (i % 3)}s ease-in-out ${i * 0.3}s infinite` }}>✨</span>
          ))}
        </div>
      )}

      {/* Sun / Moon */}
      <div className="absolute select-none" style={{ top: 3, right: 10, fontSize: 18, animation: 'sunGlow 4s ease-in-out infinite' }}>
        {period === 'sabah' ? '🌅' : period === 'gunduz' ? '☀️' : period === 'aksam' ? '🌇' : '🌙'}
      </div>

      {/* Clouds (hidden at night for a clear starry sky) */}
      {!isNight && (
        <div className="absolute top-0 left-0 right-0 h-14 overflow-hidden pointer-events-none">
          <Cloud top="4px"  size={12} delay={0}   duration={24} period={period} />
          <Cloud top="10px" size={9}  delay={-9}  duration={32} period={period} />
          <Cloud top="2px"  size={10} delay={-17} duration={28} period={period} />
        </div>
      )}

      {/* Birds by day, owl by night */}
      <div className="absolute left-0 right-0 overflow-hidden pointer-events-none" style={{ top: 10 }}>
        {isNight ? (
          <div style={{ animation: 'birdFly 20s linear -5s infinite', position: 'absolute', fontSize: 8 }}>🦉</div>
        ) : (
          <>
            <div style={{ animation: 'birdFly 16s linear -5s infinite', position: 'absolute', fontSize: 8 }}>🐦</div>
            <div style={{ animation: 'birdFly 22s linear -12s infinite', position: 'absolute', top: 5, fontSize: 7 }}>🐦</div>
          </>
        )}
      </div>

      {/* Tree line */}
      <div className="absolute" style={{ top: 28, left: 0, right: 0, filter: isNight ? 'brightness(0.55)' : 'none' }}>
        <span className="absolute text-2xl" style={{ top: 0, left: 2, animation: 'sway 5s ease-in-out infinite', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🌳</span>
        <span className="absolute text-xl opacity-80" style={{ top: 5, left: 30, animation: 'sway 6.5s ease-in-out 1s infinite' }}>🌲</span>
        <span className="absolute text-xl opacity-80" style={{ top: 4, right: 30, animation: 'sway 5.5s ease-in-out 2s infinite' }}>🌲</span>
        <span className="absolute text-2xl" style={{ top: 0, right: 2, animation: 'sway 4.5s ease-in-out 0.5s infinite', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>🌳</span>
      </div>

      {/* Grass base */}
      <div className="absolute inset-x-0 transition-colors duration-1000" style={{ top: 50, height: 14, background: palette.grass }} />

      {/* Road — narrower single lane, shrunk, with paved texture + shoulders
          for a more developed look than a flat grey bar */}
      <div
        className="absolute inset-x-0 overflow-hidden transition-colors duration-1000"
        style={{
          top: 62, height: 24,
          background: 'linear-gradient(180deg, #46464a 0%, #333336 50%, #232326 100%)',
        }}
      >
        {/* Subtle asphalt speckle texture */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.10) 0.5px, transparent 0.5px), radial-gradient(rgba(0,0,0,0.25) 0.5px, transparent 0.5px)',
            backgroundSize: '6px 6px, 5px 5px',
            backgroundPosition: '0 0, 3px 3px',
          }}
        />

        {/* Sandy shoulders top & bottom, dotted with tiny roadside tufts/pebbles */}
        <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: 'linear-gradient(180deg, #c99a56, #8a6a35)' }} />
        <div className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: 'linear-gradient(0deg, #8a6a35, #6b5228)' }} />
        <div className="absolute inset-x-0 top-[3px] h-[1px]" style={{ background: 'rgba(255,255,255,0.16)' }} />
        <div className="absolute inset-x-0 bottom-[3px] h-[1px]" style={{ background: 'rgba(0,0,0,0.45)' }} />
        <div className="absolute inset-x-0 top-0 h-[3px] flex items-center" style={{ gap: 22, paddingLeft: 10 }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <span key={i} style={{ fontSize: 5, opacity: 0.8, filter: isNight ? 'brightness(0.5)' : 'none' }}>🌿</span>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 h-[3px] flex items-center" style={{ gap: 26, paddingLeft: 24 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <span key={i} style={{ fontSize: 5, opacity: 0.75, filter: isNight ? 'brightness(0.5)' : 'none' }}>🌾</span>
          ))}
        </div>

        {/* Soft vignette so the road blends into the scene instead of
            reading as a flat pasted-in strip */}
        <div className="absolute inset-0 pointer-events-none" style={{ boxShadow: 'inset 0 4px 6px -3px rgba(0,0,0,0.5), inset 0 -4px 6px -3px rgba(0,0,0,0.5)' }} />

        {/* Animated centre dashes */}
        <div className="absolute inset-x-0 overflow-hidden" style={{ top: '50%', transform: 'translateY(-50%)', height: 2 }}>
          <div style={{ display: 'flex', gap: 10, animation: 'roadDash 1.2s linear infinite', width: 'max-content' }}>
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} style={{ width: 14, height: 2, borderRadius: 2, background: 'rgba(255,220,60,0.7)', flexShrink: 0, boxShadow: '0 0 2px rgba(255,220,60,0.4)' }} />
            ))}
          </div>
        </div>

        {/* ── WEATHER OVERLAY (rain / fog) ── */}
        {period === 'gece' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-20">
            {Array.from({ length: 18 }).map((_, i) => (
              <div
                key={i}
                className="absolute"
                style={{
                  left: `${(i * 6.2 + 2) % 100}%`,
                  top: '-10%',
                  width: 1,
                  height: 8 + (i % 4) * 3,
                  background: 'linear-gradient(180deg, rgba(147,197,253,0.0), rgba(147,197,253,0.55))',
                  borderRadius: 1,
                  animation: `rainFall ${0.6 + (i % 5) * 0.12}s linear ${-( i * 0.07)}s infinite`,
                  transform: 'rotate(15deg)',
                }}
              />
            ))}
          </div>
        )}
        {period === 'aksam' && (
          <div className="absolute inset-0 pointer-events-none z-20"
            style={{ background: 'linear-gradient(180deg, rgba(180,120,60,0.12) 0%, rgba(80,40,20,0.25) 100%)' }} />
        )}

        {/* ── TRUCK SVG — stops near market then drives off ── */}
        <span className="absolute" style={{ top: '3%', animation: 'truckStop 9s ease-in-out infinite', willChange: 'transform' }}>
          <span className="relative inline-block" style={{ animation: 'vehicleBounce 0.34s ease-in-out infinite' }}>
            {/* Exhaust smoke */}
            <span className="absolute" style={{ right: -8, top: 1, fontSize: 7, opacity: 0.7, animation: 'dustPuff 1s ease-out infinite' }}>💨</span>
            <svg width="48" height="22" viewBox="0 0 48 22" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.6))' }} xmlns="http://www.w3.org/2000/svg">
              {/* Trailer body */}
              <rect x="16" y="4" width="32" height="13" rx="2" fill="#d1d5db" stroke="#6b7280" strokeWidth="0.8"/>
              <rect x="17" y="5" width="30" height="3" rx="1" fill="rgba(255,255,255,0.5)"/>
              <line x1="30" y1="5" x2="30" y2="17" stroke="#9ca3af" strokeWidth="0.8"/>
              <line x1="40" y1="5" x2="40" y2="17" stroke="#9ca3af" strokeWidth="0.8"/>
              {/* Red taillight strip */}
              <rect x="46" y="7" width="2" height="4" rx="1" fill={isNight ? '#ef4444' : '#f87171'} style={isNight ? { filter: 'drop-shadow(0 0 3px #ef4444)' } : {}}/>
              {/* Cab */}
              <rect x="2" y="6" width="16" height="11" rx="2" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8"/>
              {/* Windshield */}
              <rect x="3" y="7" width="9" height="6" rx="1" fill={isNight ? '#fef9c3' : '#bae6fd'} style={isNight ? { filter: 'drop-shadow(0 0 4px #fde047)' } : {}}/>
              {/* Cab roof */}
              <rect x="4" y="3" width="10" height="4" rx="1.5" fill="#b91c1c"/>
              {/* Front headlights */}
              <rect x="0" y="9" width="3" height="3" rx="1" fill={isNight ? '#fef08a' : '#fde68a'} style={isNight ? { filter: 'drop-shadow(0 0 6px #fde047)' } : {}}/>
              {/* Wheels */}
              <circle cx="7" cy="19" r="4" fill="#1c1917" stroke="#44403c" strokeWidth="0.8"/>
              <circle cx="7" cy="19" r="1.5" fill="#78716c"/>
              <circle cx="22" cy="19" r="4" fill="#1c1917" stroke="#44403c" strokeWidth="0.8"/>
              <circle cx="22" cy="19" r="1.5" fill="#78716c"/>
              <circle cx="34" cy="19" r="4" fill="#1c1917" stroke="#44403c" strokeWidth="0.8"/>
              <circle cx="34" cy="19" r="1.5" fill="#78716c"/>
              <circle cx="43" cy="19" r="4" fill="#1c1917" stroke="#44403c" strokeWidth="0.8"/>
              <circle cx="43" cy="19" r="1.5" fill="#78716c"/>
              {/* Exhaust pipe */}
              <rect x="14" y="2" width="2" height="5" rx="1" fill="#374151"/>
            </svg>
          </span>
        </span>

        {/* ── SEDAN CAR — fast zip, right → left ── */}
        <span className="absolute" style={{ top: '18%', animation: 'carStop 7s ease-in-out -2s infinite', willChange: 'transform' }}>
          <span className="relative inline-block" style={{ animation: 'vehicleBounce 0.28s ease-in-out infinite' }}>
            <svg width="38" height="18" viewBox="0 0 38 18" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.55))' }} xmlns="http://www.w3.org/2000/svg">
              {/* Car body lower */}
              <rect x="2" y="9" width="34" height="7" rx="3" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="0.8"/>
              {/* Car body upper (cabin) */}
              <path d="M8 9 Q10 3 16 2 L26 2 Q32 3 33 9 Z" fill="#2563eb" stroke="#1d4ed8" strokeWidth="0.8"/>
              {/* Windshield */}
              <path d="M12 9 Q14 4 16 3 L22 3 Q26 4 27 9 Z" fill={isNight ? '#fef9c3' : '#bae6fd'} opacity="0.9" style={isNight ? { filter: 'drop-shadow(0 0 3px #fde047)' } : {}}/>
              {/* Side window */}
              <path d="M8 9 L10 5 L12 4 L12 9 Z" fill={isNight ? '#fef9c3' : '#93c5fd'} opacity="0.8"/>
              <path d="M28 9 L26 5 L30 4 L32 9 Z" fill={isNight ? '#fef9c3' : '#93c5fd'} opacity="0.8"/>
              {/* Headlights */}
              <rect x="0" y="10" width="3" height="2.5" rx="1" fill={isNight ? '#fef08a' : '#fde68a'} style={isNight ? { filter: 'drop-shadow(0 0 5px #fde047)' } : {}}/>
              {/* Taillights */}
              <rect x="35" y="10" width="3" height="2.5" rx="1" fill={isNight ? '#ef4444' : '#f87171'} style={isNight ? { filter: 'drop-shadow(0 0 3px #ef4444)' } : {}}/>
              {/* Door line */}
              <line x1="19" y1="9" x2="19" y2="15" stroke="#1d4ed8" strokeWidth="0.6" opacity="0.5"/>
              {/* Wheels */}
              <circle cx="8" cy="16" r="3.5" fill="#1c1917" stroke="#44403c" strokeWidth="0.8"/>
              <circle cx="8" cy="16" r="1.4" fill="#6b7280"/>
              <circle cx="29" cy="16" r="3.5" fill="#1c1917" stroke="#44403c" strokeWidth="0.8"/>
              <circle cx="29" cy="16" r="1.4" fill="#6b7280"/>
            </svg>
          </span>
        </span>

        {/* ── TRACTOR SVG — layered, slower, phase offset ── */}
        <span className="absolute" style={{ top: '32%', animation: 'tractorStop 13s ease-in-out -5s infinite', willChange: 'transform' }}>
          <span className="relative inline-block" style={{ animation: 'vehicleBounce 0.46s ease-in-out infinite' }}>
            <span className="absolute" style={{ right: -5, top: 0, fontSize: 6, opacity: 0.7, animation: 'dustPuff 1.1s ease-out 0.2s infinite' }}>💨</span>
            <svg width="36" height="22" viewBox="0 0 36 22" style={{ filter: 'drop-shadow(0 3px 5px rgba(0,0,0,0.55))' }} xmlns="http://www.w3.org/2000/svg">
              {/* Chassis */}
              <rect x="2" y="9" width="26" height="8" rx="2" fill="#16a34a" stroke="#14532d" strokeWidth="0.8"/>
              {/* Cab */}
              <rect x="2" y="4" width="12" height="9" rx="2" fill="#fbbf24" stroke="#92400e" strokeWidth="0.8"/>
              {/* Cab window */}
              <rect x="3" y="5" width="7" height="4" rx="1" fill={isNight ? '#fef9c3' : '#bae6fd'} style={isNight ? { filter: 'drop-shadow(0 0 4px #fde047)' } : {}}/>
              {/* Cab roof */}
              <rect x="3" y="2" width="9" height="3" rx="1.5" fill="#d97706"/>
              {/* Exhaust pipe with smoke */}
              <rect x="7" y="0" width="2" height="4" rx="1" fill="#374151"/>
              {/* Headlight */}
              <rect x="0" y="7" width="3" height="2.5" rx="1" fill={isNight ? '#fef08a' : '#fde68a'} style={isNight ? { filter: 'drop-shadow(0 0 5px #fde047)' } : {}}/>
              {/* Small front wheel */}
              <circle cx="8" cy="19" r="4" fill="#1c1917" stroke="#44403c" strokeWidth="1"/>
              <circle cx="8" cy="19" r="1.5" fill="#78716c"/>
              {/* Big rear wheel */}
              <circle cx="26" cy="18" r="6" fill="#1c1917" stroke="#44403c" strokeWidth="1.2"/>
              <circle cx="26" cy="18" r="2.5" fill="#78716c"/>
              {/* Wheel tread details */}
              {[0,60,120,180,240,300].map((a, i) => {
                const rad = (a * Math.PI) / 180;
                return (
                  <line
                    key={i}
                    x1={26 + Math.cos(rad) * 3.5}
                    y1={18 + Math.sin(rad) * 3.5}
                    x2={26 + Math.cos(rad) * 5.5}
                    y2={18 + Math.sin(rad) * 5.5}
                    stroke="#4b5563"
                    strokeWidth="1"
                    strokeLinecap="round"
                  />
                );
              })}
              {/* Hitch */}
              <rect x="28" y="12" width="7" height="3" rx="1" fill="#6b7280"/>
            </svg>
          </span>
        </span>
      </div>

      {/* Fence strip */}
      <div className="absolute inset-x-0" style={{ top: 86, height: 5, background: 'linear-gradient(90deg, #7a4e1a, #a06235, #7a4e1a)', opacity: 0.88, filter: isNight ? 'brightness(0.55)' : 'none' }} />

      {/* ── LEFT: Market shop — a fuller little building with chimney,
          hanging sign, side windows and flower boxes for a more developed
          "town" feel instead of a plain roof + rectangle. ── */}
      <div className="absolute flex flex-col items-end transition-opacity duration-1000" style={{ bottom: 3, left: 3, filter: isNight ? 'brightness(0.6)' : 'none' }}>
        <div className="relative flex flex-col items-center" style={{ width: 58 }}>
          {/* Chimney with smoke */}
          <div className="absolute" style={{ top: -6, left: 8, width: 6, height: 9, background: 'linear-gradient(180deg, #a8735a, #7a4e3a)', border: '1px solid #5a3624', borderRadius: 1 }} />
          <span className="absolute text-[7px]" style={{ top: -16, left: 6, animation: 'sunGlow 3s ease-in-out infinite', opacity: 0.75 }}>💨</span>

          {/* Pitched roof */}
          <div
            className="relative"
            style={{
              width: 0, height: 0,
              borderLeft: '31px solid transparent',
              borderRight: '31px solid transparent',
              borderBottom: '14px solid #8b3a2e',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
            }}
          />
          {/* Roof ridge highlight */}
          <div className="absolute" style={{ top: 0, left: 27, width: 4, height: 3, background: '#a8564a', clipPath: 'polygon(50% 0, 0 100%, 100% 100%)' }} />

          {/* Striped awning */}
          <div className="rounded-b-sm overflow-hidden flex shadow -mt-0.5" style={{ width: 58, height: 11 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex-1" style={{ background: i % 2 === 0 ? '#dc2626' : '#f5f5f4' }} />
            ))}
          </div>

          {/* Hanging shop sign */}
          <div
            className="absolute flex items-center justify-center rounded-sm shadow"
            style={{ top: 15, left: -6, width: 15, height: 9, background: 'linear-gradient(180deg, #d4a86e, #a8794a)', border: '1px solid #6b431f', fontSize: 6, transform: 'rotate(-4deg)' }}
          >
            <span style={{ fontSize: 7 }}>🥕</span>
          </div>

          {/* Building body */}
          <div
            className="relative flex flex-col items-center justify-end rounded-b-sm border shadow-md overflow-hidden"
            style={{
              width: 58, height: 34,
              background: 'linear-gradient(180deg, #fde9c8 0%, #e8c896 60%, #d4a86e 100%)',
              borderColor: '#8b5c1e',
            }}
          >
            {/* Side windows */}
            <div className="absolute rounded-[1px]" style={{ top: 5, left: 5, width: 9, height: 9, background: 'linear-gradient(160deg, #bae6fd, #7dd3fc)', border: '1.5px solid #6b431f' }}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 48%, #6b431f 48%, #6b431f 52%, transparent 52%), linear-gradient(90deg, transparent 48%, #6b431f 48%, #6b431f 52%, transparent 52%)' }} />
            </div>
            <div className="absolute rounded-[1px]" style={{ top: 5, right: 5, width: 9, height: 9, background: 'linear-gradient(160deg, #bae6fd, #7dd3fc)', border: '1.5px solid #6b431f' }}>
              <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 48%, #6b431f 48%, #6b431f 52%, transparent 52%), linear-gradient(90deg, transparent 48%, #6b431f 48%, #6b431f 52%, transparent 52%)' }} />
            </div>
            {/* Door */}
            <div className="relative rounded-t-sm" style={{ width: 14, height: 15, background: 'linear-gradient(180deg, #6b3a1a, #4a2810)', border: '1px solid #3a1e0a' }}>
              <div className="absolute rounded-full" style={{ width: 1.5, height: 1.5, right: 2, top: 7, background: '#f5c842' }} />
            </div>
            {/* Flower boxes under windows */}
            <div className="absolute flex gap-0.5" style={{ top: 13.5, left: 4.5, fontSize: 4.5 }}>🌷🌷</div>
            <div className="absolute flex gap-0.5" style={{ top: 13.5, right: 4.5, fontSize: 4.5 }}>🌷🌷</div>
          </div>
        </div>
      </div>

      {/* ── CENTER: Farm name plate ── */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center" style={{ bottom: 7 }}>
        <div className="rounded-lg px-2 py-0.5 shadow-lg flex flex-col items-center gap-0.5"
          style={{ background: 'linear-gradient(135deg, #8b5c1e, #c4832e)', border: '1.5px solid #f5c842', boxShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>
          <div className="text-[6.5px] font-black text-yellow-200 tracking-widest uppercase leading-none">🌾 ÇİFTLİĞİM</div>
          <div className="font-black text-white leading-none" style={{ fontSize: 9 }}>
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
        @keyframes roadDash {
          from { transform: translateX(0); }
          to   { transform: translateX(-30px); }
        }

        /* ── Vehicle bounce (subtle suspension) ── */
        @keyframes vehicleBounce {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-1px); }
        }

        /* ── Exhaust dust puff ── */
        @keyframes dustPuff {
          0%   { opacity: 0.8; transform: scale(0.7) translateX(0px); }
          60%  { opacity: 0.4; transform: scale(1.4) translateX(-6px); }
          100% { opacity: 0;   transform: scale(2)   translateX(-12px); }
        }

        /* ── Rain drops ── */
        @keyframes rainFall {
          0%   { transform: rotate(15deg) translateY(0px);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.7; }
          100% { transform: rotate(15deg) translateY(140px); opacity: 0; }
        }

        /* ── Truck: rolls in from right → brakes near market (~78px from left) →
           idles 2 s → drives off left ── */
        @keyframes truckStop {
          0%   { transform: translateX(95vw); }
          42%  { transform: translateX(78px); }
          68%  { transform: translateX(78px); }
          100% { transform: translateX(-220px); }
        }

        /* ── Sedan: zips left → right (opposite lane) ── */
        @keyframes carLeftRight {
          0%   { transform: scaleX(-1) translateX(95vw); }
          100% { transform: scaleX(-1) translateX(-200px); }
        }

        /* ── Tractor: slower, longer pause ── */
        @keyframes tractorStop {
          0%   { transform: translateX(95vw); }
          38%  { transform: translateX(82px); }
          65%  { transform: translateX(82px); }
          100% { transform: translateX(-180px); }
        }
      `}</style>
    </div>
  );
}

/* ── Main GameView ── */
export default function GameView() {
  const { user, telegramId, isNewUser } = useUser();
  const { state, unlockSection, buyUnit, harvestPlot, replantPlot, sellProducts, upgradeDepot, incomePerMin, showWelcomeBonus, setShowWelcomeBonus, autoSell, toggleAutoSell, autoSellPurchased, setBalance, setCoins } = useGameEngine({ isNewUser });
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
  const [musicOn, setMusicOn] = useState(() => isMusicEnabled());
  const [musicVol, setMusicVol] = useState(() => Math.round(getMusicVolume() * 100));
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { showTutorial, doneTutorial } = useMascotTutorial();

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    localStorage.setItem('farm_sound', next ? 'on' : 'off');
  };

  const handleMusicToggle = () => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
    localStorage.setItem('farm_music', next ? 'on' : 'off');
  };

  const handleVolumeChange = (val: number) => {
    setMusicVol(val);
    setMusicVolume(val / 100);
    localStorage.setItem('farm_music_vol', String(val));
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

  // Persistent keys that track the last balance/coins value confirmed by the server.
  // Used as `prevBalance`/`prevCoins` in delta saves so admin credits (or other
  // server-side coin grants like Stars purchases/referrals) are never overwritten.
  const BALANCE_SYNC_KEY = 'farm_balance_sync_v1';
  const COINS_SYNC_KEY = 'farm_coins_sync_v1';

  // Backend save (every 10s) — delta-based balance + coins update.
  // Sends prevBalance/prevCoins (last server-confirmed values) so the server can
  // apply the correct delta instead of blindly overwriting the columns.
  useEffect(() => {
    const interval = setInterval(() => {
      const s = stateRef.current;
      const prevBalance = parseFloat(localStorage.getItem(BALANCE_SYNC_KEY) ?? '0');
      const prevCoins = parseFloat(localStorage.getItem(COINS_SYNC_KEY) ?? '0');
      saveFarmMut.mutate(
        {
          telegramId,
          data: {
            balance: s.balance,
            prevBalance,
            coins: s.coins,
            prevCoins,
            farmState: {
              wheat: s.sections['wheat']?.count ?? 0,
              chicken: s.sections['chicken']?.count ?? 0,
              cow: s.sections['cow']?.count ?? 0,
            },
          },
        },
        {
          onSuccess: (data) => {
            // Anchor to the confirmed DB values so the next delta starts correctly
            try {
              localStorage.setItem(BALANCE_SYNC_KEY, String(data.balance));
              localStorage.setItem(COINS_SYNC_KEY, String(data.coins));
            } catch { /* */ }
          },
        },
      );
    }, 10000);
    return () => clearInterval(interval);
  }, [telegramId]);

  // Sync admin-added balance / server-credited coins (Stars purchases, referrals,
  // coin shop, conversions made from the Stars page) into local game state.
  // When the server value (polled every 10s) is higher than the local
  // game-engine value, we pull it in immediately AND update the sync anchor so
  // the next 30s delta-save starts from the correct baseline.
  // Reconciliation also has to handle DOWNWARD changes made elsewhere (e.g. the
  // player converts Coins → TL on the Stars page, which raises server balance
  // and lowers server coins). We can't just take max(local, server): that would
  // ignore legitimate spends. Instead we diff against the last server-confirmed
  // anchor — any local amount earned since that anchor hasn't been persisted
  // yet, so we preserve it on top of the fresh server value.
  const serverBalance = user?.balance ?? 0;
  const serverCoins = user?.coins ?? 0;
  useEffect(() => {
    const anchor = parseFloat(localStorage.getItem(BALANCE_SYNC_KEY) ?? '0');
    const unsynced = Math.max(0, stateRef.current.balance - anchor);
    const reconciled = serverBalance + unsynced;
    if (Math.abs(reconciled - stateRef.current.balance) > 0.001) {
      setBalance(reconciled);
    }
    try { localStorage.setItem(BALANCE_SYNC_KEY, String(serverBalance)); } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverBalance]);

  useEffect(() => {
    const anchor = parseFloat(localStorage.getItem(COINS_SYNC_KEY) ?? '0');
    const unsynced = Math.max(0, stateRef.current.coins - anchor);
    const reconciled = serverCoins + unsynced;
    if (Math.abs(reconciled - stateRef.current.coins) > 0.001) {
      setCoins(reconciled);
    }
    try { localStorage.setItem(COINS_SYNC_KEY, String(serverCoins)); } catch { /* */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverCoins]);

  const shownSections = SECTIONS.filter(s => s.category === activeTab);
  const xpInfo = xpToNextLevel(state.xp);
  const xpPct = xpInfo.needed > 0 ? Math.min(xpInfo.current / xpInfo.needed, 1) : 1;

  const selectedConfig = selectedId ? SECTIONS.find(s => s.id === selectedId) ?? null : null;
  const selectedState = selectedId ? (state.sections[selectedId] ?? { unlocked: false, count: 0 }) : null;

  // Auto-close the purchase sheet the instant its section becomes harvest-ready
  // or needs replanting. Otherwise the sheet's full-screen invisible backdrop
  // (fixed inset-0, rendered above the board) keeps intercepting taps aimed at
  // the "Hasat Et!"/"Ek!" overlay button underneath — the tap just closes the
  // sheet instead of harvesting, making the button look unresponsive.
  useEffect(() => {
    if (!selectedId) return;
    const fill = state.plotFill[selectedId] ?? 0;
    const needsReplant = state.sections[selectedId]?.needsReplant ?? false;
    if (fill >= 1.0 || needsReplant) {
      setSelectedId(null);
    }
  }, [selectedId, state.plotFill, state.sections]);

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
      <div className="z-40 relative flex-shrink-0" style={{ background: '#0d1f0a', borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
        <div className="flex items-center gap-2 px-3 py-2">
        <div className="top-balance-pill">
          <span className="text-base">💵</span>
          <span className="font-black text-white text-sm font-mono tabular-nums">{formatNum(state.balance)}</span>
          <span className="text-white/50 text-[10px]">TL</span>
        </div>

        <div className="top-balance-pill">
          <span className="text-base">🪙</span>
          <span className="font-black text-yellow-300 text-sm font-mono tabular-nums">
            {Math.floor(state.coins).toLocaleString()}
          </span>
        </div>

        <button
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-yellow-400 shadow-md active:scale-90 transition-all"
          style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)' }}
          onClick={() => navigate('/stars')}
        >
          <Plus size={14} className="text-yellow-900" strokeWidth={3} />
        </button>

        {/* Settings button */}
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all active:scale-90"
          style={{ background: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.25)' }}
        >
          <Settings size={13} className="text-white" />
        </button>

        <div className="flex-1" />

        <OnlineCounterPill />

        {/* Level badge */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-full"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)', border: '1.5px solid #a78bfa' }}>
          <span style={{ fontSize: 11 }}>⭐</span>
          <span className="font-black text-white text-xs">Sv.{state.level}</span>
        </div>
        </div>

        {/* XP bar */}
        <div className="px-3 pb-1.5 flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(90deg, #a78bfa, #7c3aed)', width: `${xpPct * 100}%` }}
              animate={{ width: `${xpPct * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-[9px] font-bold text-white/40 flex-shrink-0">
            {xpInfo.current}/{xpInfo.needed} XP
          </span>
        </div>
      </div>

      {/* ══ FARM SCENE (road animation) ══ */}
      <div className="relative flex-shrink-0">
        <FarmScene state={state} />
      </div>

      {/* ══ MAIN SCENE ══ */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* ── Left: Scrollable farm area ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Market panel */}
          <div className="relative flex-shrink-0">
            <MarketPanel
              storage={state.storage}
              gameState={state}
              onSell={sellProducts}
              autoSell={autoSell}
              autoSellPurchased={autoSellPurchased}
              onToggleAutoSell={toggleAutoSell}
              onUpgradeDepot={upgradeDepot}
            />
            {!autoSell && <SellHintMascot hasProducts={Object.values(state.storage).some(v => Math.floor(v) > 0)} />}
          </div>

          {/* Farm / Animal tab bar — glass panel with animated coin-drip accent */}
          <div
            className="relative flex-shrink-0 px-2 py-1.5 gap-2 flex overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(20,12,4,0.55), rgba(0,0,0,0.4))',
              borderBottom: '1px solid rgba(245,200,66,0.18)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {/* Slow-drifting golden sheen across the whole bar */}
            <motion.div
              className="absolute inset-y-0 w-1/3 pointer-events-none"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(245,200,66,0.10), transparent)' }}
              animate={{ x: ['-40%', '340%'] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
            />
            {([
              { key: 'farm',   emoji: '🌾', label: 'TARLALAR',  count: SECTIONS.filter(s => s.category === 'farm' && state.sections[s.id]?.unlocked).length },
              { key: 'animal', emoji: '🐄', label: 'HAYVANLAR', count: SECTIONS.filter(s => s.category === 'animal' && state.sections[s.id]?.unlocked).length },
            ] as const).map(({ key, emoji, label, count }) => {
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className="relative z-10 flex-1 flex items-center justify-center gap-1.5 rounded-xl transition-all active:scale-95 overflow-hidden"
                  style={isActive ? {
                    background: 'linear-gradient(135deg, #f5c842, #c4832e 55%, #8b5c1e)',
                    border: '1.5px solid #ffe08a',
                    boxShadow: '0 3px 10px rgba(196,131,46,0.5), 0 0 14px rgba(245,200,66,0.25)',
                    paddingTop: 7, paddingBottom: 7,
                  } : {
                    background: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    paddingTop: 7, paddingBottom: 7,
                  }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)' }}
                      initial={{ x: '-120%' }}
                      animate={{ x: '120%' }}
                      transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
                    />
                  )}
                  <motion.span
                    style={{ fontSize: 16 }}
                    animate={isActive ? { rotate: [0, -8, 8, 0], scale: [1, 1.12, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2.4 }}
                  >{emoji}</motion.span>
                  <span className={`font-black leading-none tracking-wide ${isActive ? 'text-yellow-950' : 'text-white/60'}`} style={{ fontSize: 10 }}>{label}</span>
                </button>
              );
            })}
          </div>

          {/* Scrollable plots — warm wood-toned backdrop so the gaps between
              cards read as part of the same rustic palette as the panels and
              right-nav buttons, instead of the bright cartoon sky/hills. */}
          <div
            className="flex-1 overflow-y-auto custom-scrollbar py-1 pb-4 farm-plots-bg"
          >
            <AnimatePresence mode="popLayout">
              {shownSections.map(cfg => (
                <FarmPlot
                  key={cfg.id}
                  config={cfg}
                  count={state.sections[cfg.id]?.count ?? 0}
                  growCount={state.sections[cfg.id]?.growCount ?? 0}
                  unlocked={state.sections[cfg.id]?.unlocked ?? false}
                  coins={state.coins}
                  balance={state.balance}
                  plotFill={state.plotFill[cfg.id] ?? 0}
                  needsReplant={state.sections[cfg.id]?.needsReplant ?? false}
                  level={state.level}
                  canUnlockNow={isNextInUnlockOrder(state.sections, cfg.id)}
                  onTap={() => setSelectedId(s => s === cfg.id ? null : cfg.id)}
                  onHarvest={() => harvestPlot(cfg.id)}
                  onReplant={() => replantPlot(cfg.id)}
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
            coins={state.coins}
            level={state.level}
            canUnlockNow={isNextInUnlockOrder(state.sections, selectedConfig.id)}
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

      {/* ══ SETTINGS PANEL (custom, no Radix) ══ */}
      <AnimatePresence>
        {settingsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              key="settings-backdrop"
              className="absolute inset-0 z-[200]"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSettingsOpen(false)}
            />
            {/* Panel */}
            <motion.div
              key="settings-panel"
              className="absolute bottom-0 left-0 right-0 z-[201] rounded-t-3xl px-5 pt-5 pb-10"
              style={{ background: 'linear-gradient(180deg, #1a2e0a 0%, #0d1a05 100%)', borderTop: '2px solid rgba(255,255,255,0.12)' }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            >
              {/* Handle */}
              <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: 'rgba(255,255,255,0.2)' }} />

              <div className="flex items-center gap-2 mb-5">
                <Settings size={18} className="text-yellow-400" />
                <span className="text-white font-black text-lg">Ayarlar</span>
              </div>

              <div className="flex flex-col gap-5">
                {/* Music volume */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white/80">🎵 Müzik Sesi</span>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-300 font-black text-sm w-8 text-right">{musicVol}%</span>
                      <button
                        onClick={handleMusicToggle}
                        className="px-3 py-1 rounded-lg text-xs font-black transition-all active:scale-90"
                        style={musicOn
                          ? { background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80' }
                          : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff60' }}
                      >
                        {musicOn ? 'Açık' : 'Kapalı'}
                      </button>
                    </div>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={musicVol}
                    onChange={e => handleVolumeChange(Number(e.target.value))}
                    disabled={!musicOn}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer disabled:opacity-30"
                    style={{ accentColor: '#f5c842' }}
                  />
                  <div className="flex justify-between text-[10px] text-white/30 font-bold px-0.5">
                    <span>Sessiz</span><span>Orta</span><span>Tam</span>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }} />

                {/* Sound effects */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-bold text-sm text-white/80">
                    {soundOn ? <Volume2 size={16} className="text-white/70" /> : <VolumeX size={16} className="text-white/40" />}
                    Efekt Sesleri
                  </span>
                  <button
                    onClick={toggleSound}
                    className="px-3 py-1 rounded-lg text-xs font-black transition-all active:scale-90"
                    style={soundOn
                      ? { background: 'rgba(74,222,128,0.2)', border: '1px solid rgba(74,222,128,0.4)', color: '#4ade80' }
                      : { background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff60' }}
                  >
                    {soundOn ? 'Açık' : 'Kapalı'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
