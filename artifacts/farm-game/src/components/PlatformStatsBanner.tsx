import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API = `${import.meta.env.BASE_URL}api`;

interface PlatformStats {
  totalPlayers: number;
  totalCoinsDistributed: number;
  totalTlPaid: number;
  totalWithdrawals: number;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const duration = 1200;
    const step = Math.ceil(value / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplayed(value);
        clearInterval(timer);
      } else {
        setDisplayed(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value]);

  return <>{formatCompact(displayed)}{suffix}</>;
}

interface StatPillProps {
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
  glowColor: string;
  delay?: number;
}

function StatPill({ icon, label, value, suffix = '', color, glowColor, delay = 0 }: StatPillProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl flex-1"
      style={{
        background: 'rgba(0,0,0,0.3)',
        border: `1px solid ${glowColor}30`,
        boxShadow: `0 0 12px ${glowColor}15`,
      }}
    >
      <div className="text-lg leading-none">{icon}</div>
      <div
        className="font-black tabular-nums leading-tight"
        style={{ fontSize: 13, color }}
      >
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
      <div className="font-bold text-center leading-none" style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)' }}>
        {label}
      </div>
    </motion.div>
  );
}

export function PlatformStatsBanner() {
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    fetch(`${API}/stats/platform`)
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <div
      className="mx-3 my-2 rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0a1e04, #0f2a08, #0a1e04)',
        border: '1px solid rgba(74,222,128,0.2)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
      }}
    >
      {/* Header strip */}
      <div
        className="flex items-center gap-2 px-3 py-1.5"
        style={{ background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Pulsing live dot */}
        <span className="relative flex h-1.5 w-1.5 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
        </span>
        <span className="font-black text-[10px] text-green-300 uppercase tracking-widest">
          Platform İstatistikleri
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 rounded-full px-2 py-0.5"
          style={{ background: 'rgba(245,200,66,0.12)', border: '1px solid rgba(245,200,66,0.2)' }}>
          <span style={{ fontSize: 9 }}>⭐</span>
          <span className="font-black text-yellow-300" style={{ fontSize: 8 }}>Stars + 💵 TL</span>
        </div>
      </div>

      {/* Stat pills */}
      <div className="flex gap-2 px-2 py-2">
        <StatPill
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" fill="#1a0a00" stroke="#f5c842" strokeWidth="1.5" />
              <path d="M10 4 L11.5 8.5 L16.5 8.5 L12.5 11.5 L14 16 L10 13 L6 16 L7.5 11.5 L3.5 8.5 L8.5 8.5 Z"
                fill="#f5c842" />
            </svg>
          }
          label="Toplam Yıldız Dağıtıldı"
          value={stats ? stats.totalCoinsDistributed : 0}
          color="#fde68a"
          glowColor="#f5c842"
          delay={0.05}
        />
        <StatPill
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="5" width="16" height="11" rx="2" fill="#0a2a10" stroke="#4ade80" strokeWidth="1.5" />
              <circle cx="10" cy="10.5" r="3" fill="#16a34a" stroke="#4ade80" strokeWidth="1" />
              <line x1="2" y1="8.5" x2="18" y2="8.5" stroke="#4ade80" strokeWidth="0.8" opacity="0.4" />
            </svg>
          }
          label="Ödenen Toplam TL"
          value={stats ? stats.totalTlPaid : 0}
          suffix=" TL"
          color="#4ade80"
          glowColor="#4ade80"
          delay={0.1}
        />
        <StatPill
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <circle cx="7" cy="7" r="3.5" fill="#0a1e30" stroke="#60a5fa" strokeWidth="1.5" />
              <circle cx="13" cy="7" r="3.5" fill="#0a1e30" stroke="#93c5fd" strokeWidth="1.5" opacity="0.7" />
              <path d="M1 17 C1 13 3.5 11 7 11 C9 11 10.5 11.8 11.5 13" stroke="#60a5fa" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              <path d="M11 17 C11 13.5 13 12 16.5 12 C18 12 19 12.5 19 13" stroke="#93c5fd" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.7" />
            </svg>
          }
          label="Toplam Oyuncu"
          value={stats ? stats.totalPlayers : 0}
          color="#93c5fd"
          glowColor="#60a5fa"
          delay={0.15}
        />
        <StatPill
          icon={
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3 10 L8 15 L17 5" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <circle cx="10" cy="10" r="8" stroke="#a78bfa" strokeWidth="1" fill="none" opacity="0.3" />
            </svg>
          }
          label="Onaylanan Çekim"
          value={stats ? stats.totalWithdrawals : 0}
          color="#c4b5fd"
          glowColor="#a78bfa"
          delay={0.2}
        />
      </div>

      {/* Bottom tagline */}
      <div
        className="px-3 py-1.5 text-center"
        style={{ background: 'rgba(0,0,0,0.2)', borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <span className="text-[9px] font-bold text-white/35 tracking-wide">
          Gerçek oyuncular, gerçek ödemeler • Şeffaf platform
        </span>
      </div>
    </div>
  );
}
