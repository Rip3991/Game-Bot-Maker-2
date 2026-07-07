import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { NftArtwork } from './NftArtwork';

interface ShowcaseNft {
  id: string;
  nftType: string;
  rarity: 'common' | 'rare' | 'special' | 'legendary';
  name: string;
  emoji: string;
  ownerName: string;
}

import { useUser } from '../hooks/use-user';

const API = `${import.meta.env.BASE_URL}api`;

const RARITY_COLORS: Record<string, { border: string; glow: string; text: string; badge: string }> = {
  common:    { border: '#6b7280', glow: 'rgba(107,114,128,0.4)',  text: '#d1d5db', badge: '#374151' },
  rare:      { border: '#3b82f6', glow: 'rgba(59,130,246,0.6)',   text: '#93c5fd', badge: '#1d4ed8' },
  special:   { border: '#a855f7', glow: 'rgba(168,85,247,0.6)',   text: '#d8b4fe', badge: '#7e22ce' },
  legendary: { border: '#f59e0b', glow: 'rgba(245,158,11,0.85)', text: '#fbbf24', badge: '#92400e' },
};

function NftMiniCard({ nft, index }: { nft: ShowcaseNft; index: number }) {
  const r = RARITY_COLORS[nft.rarity] ?? RARITY_COLORS.common;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 22 }}
      className="flex-shrink-0 flex flex-col rounded-xl overflow-hidden"
      style={{
        width: 80,
        border: `1.5px solid ${r.border}`,
        boxShadow: `0 0 12px ${r.glow}, 0 2px 8px rgba(0,0,0,0.5)`,
        background: '#0a0a14',
      }}
    >
      {/* Artwork */}
      <div style={{ height: 64, flexShrink: 0 }}>
        <NftArtwork nftType={nft.nftType} emoji={nft.emoji} rarity={nft.rarity} size="card" animated={nft.rarity === 'legendary'} />
      </div>

      {/* Info */}
      <div className="flex flex-col gap-0.5 px-1.5 pt-1 pb-1.5">
        <div
          className="text-[8px] font-black truncate leading-tight"
          style={{ color: r.text }}
        >
          {nft.name}
        </div>
        <div className="flex items-center gap-1">
          <span
            className="text-[7px] font-black px-1 py-px rounded-full leading-none"
            style={{ background: r.badge, color: r.text }}
          >
            {nft.rarity === 'legendary' ? '🏆' : nft.rarity === 'rare' ? '💎' : '⭐'}
          </span>
        </div>
        <div className="text-[8px] font-bold text-white/50 truncate leading-none mt-0.5">
          👤 {nft.ownerName}
        </div>
      </div>
    </motion.div>
  );
}

export function LiveNftShowcase() {
  const { telegramId } = useUser();
  const [nfts, setNfts] = useState<ShowcaseNft[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const posRef = useRef(0);

  const fetchShowcase = async () => {
    try {
      const params = telegramId ? `?exclude=${encodeURIComponent(telegramId)}` : '';
      const res = await fetch(`${API}/nfts/showcase${params}`);
      if (!res.ok) return;
      const data: ShowcaseNft[] = await res.json();
      setNfts(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShowcase();
    const t = setInterval(fetchShowcase, 30_000);
    return () => clearInterval(t);
  }, []);

  // Smooth auto-scroll marquee — time-based for consistent speed across frame rates
  const lastTsRef = useRef<number | null>(null);
  const SPEED_PX_PER_SEC = 40; // pixels per second

  useEffect(() => {
    if (!nfts.length || collapsed) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      animRef.current = null;
      return;
    }
    const el = scrollRef.current;
    if (!el) return;

    lastTsRef.current = null;

    const scroll = (ts: number) => {
      if (!el) return;
      const prev = lastTsRef.current;
      lastTsRef.current = ts;
      if (prev !== null) {
        const delta = ((ts - prev) / 1000) * SPEED_PX_PER_SEC;
        posRef.current += delta;
        // Seamless loop: reset when we've scrolled half the duplicated content
        const half = el.scrollWidth / 2;
        if (posRef.current >= half) posRef.current -= half;
        el.scrollLeft = posRef.current;
      }
      animRef.current = requestAnimationFrame(scroll);
    };

    animRef.current = requestAnimationFrame(scroll);
    return () => { if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; } };
  }, [nfts, collapsed]);

  // Pause scroll on hover/touch
  const pause = () => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    lastTsRef.current = null;
  };
  const resume = () => {
    if (animRef.current || !nfts.length || collapsed) return;
    const el = scrollRef.current;
    if (!el) return;
    lastTsRef.current = null;
    const scroll = (ts: number) => {
      if (!el) return;
      const prev = lastTsRef.current;
      lastTsRef.current = ts;
      if (prev !== null) {
        const delta = ((ts - prev) / 1000) * SPEED_PX_PER_SEC;
        posRef.current += delta;
        const half = el.scrollWidth / 2;
        if (posRef.current >= half) posRef.current -= half;
        el.scrollLeft = posRef.current;
      }
      animRef.current = requestAnimationFrame(scroll);
    };
    animRef.current = requestAnimationFrame(scroll);
  };

  if (loading) return null;
  if (nfts.length === 0) return null;

  // Duplicate for seamless loop
  const doubled = [...nfts, ...nfts];

  return (
    <div
      className="flex-shrink-0"
      style={{ background: 'rgba(0,0,0,0.55)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
    >
      {/* Header row */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="w-full flex items-center gap-2 px-3 py-1.5 active:opacity-70 transition-opacity"
      >
        {/* Live pulse */}
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
        <span className="font-black text-white text-[10px] tracking-wide">CANLI KOLEKSİYONLAR</span>
        <span className="text-white/30 text-[9px] font-bold">
          {nfts.length} NFT
        </span>
        <div className="flex-1" />
        <span className="text-white/40 text-[9px]">{collapsed ? '▼' : '▲'}</span>
      </button>

      {/* Scroll strip */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            style={{ overflow: 'hidden' }}
          >
            <div
              ref={scrollRef}
              onMouseEnter={pause}
              onMouseLeave={resume}
              onTouchStart={pause}
              onTouchEnd={resume}
              className="flex gap-2 pb-2 px-2 overflow-x-hidden"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {doubled.map((nft, i) => (
                <NftMiniCard key={`${nft.id}-${i}`} nft={nft} index={i % nfts.length} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
