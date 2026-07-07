import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useUser } from '../hooks/use-user';
import {
  useGetUserNfts, useGetNftMarket, useListNftForTrade,
  useCreateTradeOffer, useGetTradeOffers, useAcceptTradeOffer,
  getGetUserNftsQueryKey, getGetNftMarketQueryKey, getGetTradeOffersQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useGameEngine } from '../hooks/use-game-engine';
import { X, ShoppingBag, Repeat2, Inbox, Package, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { NftArtwork } from '../components/NftArtwork';

type Rarity = 'common' | 'rare' | 'epic' | 'special' | 'legendary';
type TabType = 'cases' | 'mine' | 'market' | 'offers';
type RarityFilter = 'all' | Rarity;

interface CaseDef {
  id: string; name: string; emoji: string; price: number;
  description: string; bgGradient: string;
  drops: { common: number; rare: number; legendary: number };
}
interface NftDef {
  key: string; emoji: string; name: string; rarity: Rarity;
  mintLimit: number; sellPrice: number;
}
interface NftItem {
  id: string; ownerTelegramId: string; nftType: string; rarity: Rarity;
  name: string; emoji: string; mintNumber: number;
  isListedForTrade: boolean; listPrice?: number | null;
  sellPrice?: number; marketPrice?: number; createdAt: string;
}
interface MarketPrice {
  nftType: string; emoji: string; name: string; rarity: Rarity;
  basePrice: number; currentPrice: number; change: number;
  history: number[]; allTimeHigh: number; allTimeLow: number;
}

const RARITY: Record<Rarity, { label: string; border: string; glow: string; badge: string; bg: string; text: string; accent: string }> = {
  common:    { label: 'Sıradan',   border: '#6b7280', glow: 'rgba(107,114,128,0.5)',  badge: '#4b5563', bg: '#1f2937', text: '#d1d5db', accent: '#9ca3af' },
  rare:      { label: 'Nadir',     border: '#3b82f6', glow: 'rgba(59,130,246,0.7)',   badge: '#1d4ed8', bg: '#1e3a5f', text: '#93c5fd', accent: '#60a5fa' },
  epic:      { label: 'Epik',      border: '#dc2626', glow: 'rgba(220,38,38,0.85)',   badge: '#991b1b', bg: '#450a0a', text: '#fca5a5', accent: '#f87171' },
  special:   { label: 'Özel',      border: '#a855f7', glow: 'rgba(168,85,247,0.8)',   badge: '#7e22ce', bg: '#2e1065', text: '#d8b4fe', accent: '#c084fc' },
  legendary: { label: 'Efsanevi', border: '#f59e0b', glow: 'rgba(245,158,11,0.9)',   badge: '#b45309', bg: '#451a00', text: '#fbbf24', accent: '#fcd34d' },
};

const API = `${import.meta.env.BASE_URL}api`;

function fmtPrice(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ── Sparkline SVG chart ────────────────────────────────────────────────────────

function Sparkline({ data, positive, width = 80, height = 28 }: { data: number[]; positive: boolean; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  const color = positive ? '#22c55e' : '#ef4444';
  const last = data[data.length - 1];
  const lastX = width;
  const lastY = height - ((last - min) / range) * (height - 4) - 2;
  return (
    <svg width={width} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`sg-${positive}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="2.5" fill={color} />
    </svg>
  );
}

// ── CaseOpenReel ──────────────────────────────────────────────────────────────

function CaseOpenReel({ items, winner, onDone }: { items: NftDef[]; winner: NftDef; onDone: () => void }) {
  const reelRef = useRef<HTMLDivElement>(null);
  const CARD_W = 80; const VISIBLE = 7; const CENTER_IDX = Math.floor(VISIBLE / 2); const REEL_COUNT = 60;
  const reel = useRef<NftDef[]>([]);
  if (reel.current.length === 0) {
    for (let i = 0; i < REEL_COUNT; i++) reel.current.push(items[Math.floor(Math.random() * items.length)]);
    reel.current[REEL_COUNT - VISIBLE + CENTER_IDX] = winner;
  }
  useEffect(() => {
    const el = reelRef.current; if (!el) return;
    el.style.transition = 'none'; el.style.transform = 'translateX(0)';
    const finalX = -(REEL_COUNT - VISIBLE + CENTER_IDX - CENTER_IDX) * CARD_W;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      el.style.transition = 'transform 4s cubic-bezier(0.05, 0.9, 0.1, 1)';
      el.style.transform = `translateX(${finalX}px)`;
    }));
    const t = setTimeout(onDone, 4200); return () => clearTimeout(t);
  }, []);
  return (
    <div className="relative overflow-hidden rounded-xl" style={{ width: VISIBLE * CARD_W, height: 106, border: '2px solid rgba(255,255,255,0.2)' }}>
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[82px] pointer-events-none z-20"
        style={{ border: '2px solid #f59e0b', borderRadius: 10, background: 'rgba(245,158,11,0.08)', boxShadow: '0 0 20px rgba(245,158,11,0.5)' }} />
      <div ref={reelRef} className="flex gap-1 py-0.5 px-1 absolute" style={{ willChange: 'transform' }}>
        {reel.current.map((item, i) => {
          const r = RARITY[item.rarity];
          return (
            <div key={i} style={{ width: CARD_W - 4, flexShrink: 0, border: `2px solid ${r.border}`, borderRadius: 10, overflow: 'hidden', height: 100 }}>
              <NftArtwork nftType={item.key} emoji={item.emoji} rarity={item.rarity} size="card" animated={false} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── NFT Card (my collection) ──────────────────────────────────────────────────

function NftCard({ nft, onSellToSystem, onListForSale }: {
  nft: NftItem;
  onSellToSystem: (nft: NftItem) => void;
  onListForSale: (nft: NftItem) => void;
}) {
  const r = RARITY[nft.rarity] ?? RARITY.common;
  return (
    <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl flex flex-col relative overflow-hidden"
      style={{ background: '#0a0a14', border: `2px solid ${r.border}`, boxShadow: `0 0 20px ${r.glow}, 0 4px 16px rgba(0,0,0,0.6)` }}>
      <NftArtwork nftType={nft.nftType} emoji={nft.emoji} rarity={nft.rarity} size="card" animated={true} />
      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg"
        style={{ background: r.badge, color: r.text, border: `1px solid ${r.border}` }}>{r.label}</div>
      {nft.listPrice && (
        <div className="absolute top-2 right-2 bg-green-600/90 border border-green-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
          💰 {fmtPrice(nft.listPrice)}
        </div>
      )}
      <div className="flex flex-col gap-1.5 p-2.5 pt-2">
        <div>
          <div className="font-black text-white text-[11px] leading-tight truncate">{nft.name}</div>
          <div className="flex items-center justify-between mt-0.5">
            <div className="text-[9px] font-bold" style={{ color: r.text }}>#{nft.mintNumber}</div>
            {nft.marketPrice && <div className="text-[9px] font-black text-yellow-300">📈 {fmtPrice(nft.marketPrice)}</div>}
          </div>
        </div>
        <div className="flex gap-1">
          <button onClick={() => onSellToSystem(nft)}
            className="flex-1 py-1.5 rounded-lg text-[10px] font-black active:scale-95"
            style={{ background: 'linear-gradient(135deg, #374151, #1f2937)', color: '#9ca3af', border: '1px solid #4b5563' }}>
            🏦 Bankaya
          </button>
          <button onClick={() => onListForSale(nft)}
            className="flex-1 py-1.5 rounded-lg text-[10px] font-black active:scale-95"
            style={nft.listPrice ? {
              background: 'linear-gradient(135deg, #7f1d1d, #991b1b)', color: 'white'
            } : {
              background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white'
            }}>
            {nft.listPrice ? '❌ Geri Al' : '🏪 Satışa Çıkar'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── List For Sale Modal ────────────────────────────────────────────────────────

function ListForSaleModal({ nft, onConfirm, onCancel, marketPrice }: {
  nft: NftItem; onConfirm: (price: number) => void; onCancel: () => void; marketPrice: number;
}) {
  const r = RARITY[nft.rarity] ?? RARITY.common;
  const [price, setPrice] = useState(nft.listPrice ? String(nft.listPrice) : String(marketPrice));
  const parsed = parseInt(price, 10);
  const valid = !isNaN(parsed) && parsed > 0;

  return (
    <motion.div className="fixed inset-0 z-[200] flex items-end justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onCancel} />
      <motion.div className="relative w-full max-w-md rounded-3xl p-5 flex flex-col gap-4"
        style={{ background: '#0d1117', border: `2px solid ${r.border}`, boxShadow: `0 0 40px ${r.glow}` }}
        initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}>
        <div className="flex items-center gap-3">
          <span className="text-4xl">{nft.emoji}</span>
          <div>
            <div className="font-black text-white text-base">{nft.name}</div>
            <div className="text-xs font-bold" style={{ color: r.text }}>{r.label} #{nft.mintNumber}</div>
          </div>
        </div>
        <div className="bg-white/5 rounded-2xl p-3 flex items-center justify-between">
          <span className="text-white/50 text-xs font-bold">Piyasa Fiyatı</span>
          <span className="text-yellow-300 font-black">{fmtPrice(marketPrice)} TL</span>
        </div>
        <div>
          <label className="text-white/60 text-xs font-bold mb-1 block">Satış Fiyatı (TL)</label>
          <input
            type="number" value={price}
            onChange={e => setPrice(e.target.value)}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2.5 text-white font-black text-lg text-center outline-none focus:border-green-400"
            style={{ appearance: 'none' }}
          />
          {valid && (
            <div className={`text-[11px] font-bold mt-1 text-center ${parsed > marketPrice ? 'text-yellow-400' : parsed < marketPrice ? 'text-blue-400' : 'text-green-400'}`}>
              {parsed > marketPrice ? `Piyasadan %${Math.round((parsed - marketPrice) / marketPrice * 100)} pahalı 📈` :
               parsed < marketPrice ? `Piyasadan %${Math.round((marketPrice - parsed) / marketPrice * 100)} ucuz 🔥` :
               'Piyasa fiyatında ✓'}
            </div>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-black text-white/60 border border-white/20 active:scale-95">Vazgeç</button>
          <button onClick={() => valid && onConfirm(parsed)} disabled={!valid}
            className="flex-1 py-3 rounded-2xl font-black text-white active:scale-95"
            style={{ background: valid ? 'linear-gradient(135deg, #22c55e, #15803d)' : '#374151', border: '1px solid #166534' }}>
            🏪 Listele!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Sell to System Modal ───────────────────────────────────────────────────────

function SellModal({ nft, onConfirm, onCancel }: { nft: NftItem; onConfirm: () => void; onCancel: () => void }) {
  const r = RARITY[nft.rarity] ?? RARITY.common;
  return (
    <motion.div className="fixed inset-0 z-[200] flex items-end justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <motion.div className="relative w-full max-w-md rounded-3xl p-5 flex flex-col gap-4"
        style={{ background: '#1a1a2e', border: `2px solid ${r.border}`, boxShadow: `0 0 40px ${r.glow}` }}
        initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}>
        <div className="flex flex-col items-center gap-2">
          <span className="text-6xl">{nft.emoji}</span>
          <div className="font-black text-white text-lg text-center">{nft.name}</div>
          <div className="text-sm font-bold" style={{ color: r.text }}>{r.label} #{nft.mintNumber}</div>
        </div>
        <div className="bg-black/30 rounded-2xl p-3 text-center">
          <div className="text-white/60 text-xs font-bold mb-1">Sabit satış fiyatı</div>
          <div className="text-3xl font-black text-yellow-300">{nft.sellPrice?.toLocaleString()} TL</div>
          <div className="text-white/40 text-[10px] mt-1">Piyasa fiyatına kıyasla daha az kazanabilirsin</div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-black text-white/60 border border-white/20 active:scale-95">Vazgeç</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-black text-white active:scale-95"
            style={{ background: 'linear-gradient(135deg, #374151, #1f2937)', border: '1px solid #4b5563' }}>
            🏦 Bankaya Sat
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Exchange market card ───────────────────────────────────────────────────────

function ExchangeNftCard({
  price, myNfts, telegramId, onBuy, onRefresh,
}: {
  price: MarketPrice;
  myNfts: NftItem[];
  telegramId: string;
  onBuy: (nftId: string, priceTl: number, name: string) => Promise<void>;
  onRefresh: () => void;
}) {
  const r = RARITY[price.rarity] ?? RARITY.common;
  const positive = price.change >= 0;
  const [expanded, setExpanded] = useState(false);
  const [market, setMarket] = useState<NftItem[]>([]);
  const [loadingMarket, setLoadingMarket] = useState(false);
  const [buying, setBuying] = useState<string | null>(null);

  const loadListings = async () => {
    if (!expanded) {
      setLoadingMarket(true);
      try {
        const res = await fetch(`${API}/nfts/market`);
        const all: NftItem[] = await res.json();
        setMarket(all.filter(n => n.nftType === price.nftType && n.ownerTelegramId !== telegramId));
      } catch {}
      setLoadingMarket(false);
      setExpanded(true);
    } else {
      setExpanded(false);
    }
  };

  const handleBuy = async (nft: NftItem) => {
    if (!nft.listPrice) return;
    setBuying(nft.id);
    await onBuy(nft.id, nft.listPrice, nft.name);
    setBuying(null);
    const res = await fetch(`${API}/nfts/market`);
    const all: NftItem[] = await res.json();
    setMarket(all.filter(n => n.nftType === price.nftType && n.ownerTelegramId !== telegramId));
    onRefresh();
  };

  return (
    <motion.div layout className="rounded-2xl overflow-hidden"
      style={{ background: '#0d1117', border: `1px solid ${r.border}33` }}>
      {/* Header row — always visible */}
      <button onClick={loadListings} className="w-full flex items-center gap-2.5 px-3 py-2.5 active:bg-white/5 transition-colors">
        <div className="text-2xl w-8 text-center flex-shrink-0">{price.emoji}</div>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-black text-white text-[11px] truncate">{price.name}</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: r.badge + '80', color: r.text }}>{r.label}</span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="flex-shrink-0">
          <Sparkline data={price.history} positive={positive} width={64} height={24} />
        </div>

        {/* Price + change */}
        <div className="flex-shrink-0 text-right min-w-[60px]">
          <div className="font-black text-white text-[12px]">{fmtPrice(price.currentPrice)}</div>
          <div className={`flex items-center justify-end gap-0.5 text-[10px] font-black ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {positive ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
            {positive ? '+' : ''}{price.change.toFixed(1)}%
          </div>
        </div>
      </button>

      {/* ATH / ATL strip */}
      <div className="flex gap-2 px-3 pb-1.5 text-[9px] text-white/30 font-bold">
        <span>En Yüksek: <span className="text-green-400/70">{fmtPrice(price.allTimeHigh)}</span></span>
        <span>En Düşük: <span className="text-red-400/70">{fmtPrice(price.allTimeLow)}</span></span>
      </div>

      {/* Expanded listings */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', borderTop: `1px solid ${r.border}33` }}>
            <div className="px-3 py-2">
              {loadingMarket ? (
                <div className="text-center text-white/40 text-[11px] py-2">Yükleniyor...</div>
              ) : market.length === 0 ? (
                <div className="text-center text-white/30 text-[11px] italic py-2">Bu NFT için satış listesi yok</div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <div className="text-[10px] font-black text-white/50 mb-1">
                    {market.length} satıcı bulunan listing
                  </div>
                  {market.slice(0, 5).map(nft => (
                    <div key={nft.id} className="flex items-center gap-2 bg-white/5 rounded-xl px-2.5 py-2">
                      <span className="text-base">{nft.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-black text-white">#{nft.mintNumber}</div>
                        <div className="text-[9px] text-white/40">
                          {nft.listPrice && nft.marketPrice && nft.listPrice < nft.marketPrice
                            ? <span className="text-green-400">🔥 Ucuz fırsat!</span>
                            : nft.listPrice && nft.marketPrice && nft.listPrice > nft.marketPrice
                            ? <span className="text-yellow-400">⬆ Piyasa üstü</span>
                            : 'Piyasa fiyatı'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-yellow-300 text-[12px]">{fmtPrice(nft.listPrice ?? 0)} TL</span>
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleBuy(nft)}
                          disabled={buying === nft.id}
                          className="px-2.5 py-1 rounded-lg text-[10px] font-black text-white active:scale-95"
                          style={{ background: buying === nft.id ? '#374151' : 'linear-gradient(135deg, #22c55e, #15803d)' }}>
                          {buying === nft.id ? '...' : '💳 AL'}
                        </motion.button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Case Opening Overlay ───────────────────────────────────────────────────────

function CaseOpenOverlay({ caseDef, allNfts, onBalanceSync, onClose, onOpenAnother, onNftMinted }: {
  caseDef: CaseDef; allNfts: NftDef[]; onBalanceSync: (b: number) => void;
  onClose: () => void; onOpenAnother: () => void; onNftMinted: () => void;
}) {
  const { telegramId } = useUser();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<'spinning' | 'result' | 'error'>('spinning');
  const [won, setWon] = useState<NftItem | null>(null);
  const [wonDef, setWonDef] = useState<NftDef | null>(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    fetch(`${API}/nfts/cases/open`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, caseType: caseDef.id }),
    }).then(async r => {
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? 'Kasa açılamadı');
      return data as NftItem;
    }).then((nft: NftItem) => {
      fetch(`${API}/users/${telegramId}`).then(r => r.json()).then(u => { if (typeof u.balance === 'number') onBalanceSync(u.balance); }).catch(() => {});
      setWon(nft);
      const def = allNfts.find(d => d.key === nft.nftType) ?? { key: nft.nftType, emoji: nft.emoji, name: nft.name, rarity: nft.rarity, mintLimit: 1000, sellPrice: (nft as any).sellPrice ?? 10 };
      setWonDef(def);
      qc.invalidateQueries({ queryKey: getGetUserNftsQueryKey(telegramId) });
      onNftMinted();
    }).catch(e => { setErrMsg(e.message); setPhase('error'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClose = () => { qc.invalidateQueries({ queryKey: getGetUserNftsQueryKey(telegramId) }); onClose(); };
  const r = won ? (RARITY[won.rarity] ?? RARITY.common) : RARITY.common;

  return (
    <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}>
      <button onClick={handleClose} className="absolute top-4 right-4 text-white/50"><X size={24} /></button>
      <div className="text-center mb-6">
        <div className="text-4xl mb-1">{caseDef.emoji}</div>
        <div className="font-black text-white text-xl">{caseDef.name} Açılıyor</div>
      </div>
      {phase === 'error' && (
        <div className="flex flex-col items-center gap-4 px-8">
          <div className="text-red-400 font-bold text-center">{errMsg || 'Hata oluştu'}</div>
          <button onClick={handleClose} className="px-8 py-3 rounded-2xl font-black text-white"
            style={{ background: 'linear-gradient(135deg, #374151, #1f2937)', border: '1px solid #4b5563' }}>Kapat</button>
        </div>
      )}
      {wonDef && phase === 'spinning' && <CaseOpenReel items={allNfts} winner={wonDef} onDone={() => setPhase('result')} />}
      {!wonDef && phase === 'spinning' && <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-6xl">{caseDef.emoji}</motion.div>}
      <AnimatePresence>
        {phase === 'result' && won && (
          <motion.div className="flex flex-col items-center gap-4 px-6 w-full max-w-xs"
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}>
            <motion.div className="w-full rounded-2xl overflow-hidden"
              style={{ border: `3px solid ${r.border}`, boxShadow: `0 0 60px ${r.glow}` }}
              animate={{ boxShadow: [`0 0 30px ${r.glow}`, `0 0 80px ${r.glow}`, `0 0 30px ${r.glow}`] }}
              transition={{ repeat: Infinity, duration: 2 }}>
              <NftArtwork nftType={won.nftType} emoji={won.emoji} rarity={won.rarity} size="large" animated={true} />
              <div className="px-4 py-3 flex flex-col gap-1" style={{ background: '#0a0a14' }}>
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-base">{won.name}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: r.badge, color: r.text }}>{r.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/40">#{won.mintNumber}</span>
                  {won.marketPrice && <span className="text-sm font-black text-yellow-300">📈 {fmtPrice(won.marketPrice)} TL</span>}
                </div>
              </div>
            </motion.div>
            {won.rarity === 'legendary' && <motion.div className="text-yellow-300 font-black text-base text-center" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1 }}>🎊 EFSANEVİ KAZANIM! 🎊</motion.div>}
            {won.rarity === 'epic' && <motion.div className="text-red-400 font-black text-base text-center" animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>🔥 EPİK KAZANIM! 🔥</motion.div>}
            {won.rarity === 'special' && <motion.div className="text-purple-300 font-black text-sm text-center" animate={{ scale: [1, 1.04, 1] }} transition={{ repeat: Infinity, duration: 1.4 }}>✨ ÖZEL NFT KAZANDIN! ✨</motion.div>}
            {won.rarity === 'rare' && <div className="text-blue-300 font-black text-sm text-center">💙 Nadir NFT Kazandın!</div>}
            <div className="flex gap-3 w-full">
              <button onClick={onOpenAnother} className="flex-1 py-3 rounded-2xl font-black text-yellow-900 active:scale-95" style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)' }}>🎰 Bir Daha</button>
              <button onClick={handleClose} className="flex-1 py-3 rounded-2xl font-black text-white active:scale-95" style={{ background: 'linear-gradient(135deg, #374151, #1f2937)', border: '1px solid #4b5563' }}>✅ Koleksiyona Git</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main NftPage ───────────────────────────────────────────────────────────────

export default function NftPage() {
  const { telegramId } = useUser();
  const { state, setBalance } = useGameEngine();
  const qc = useQueryClient();

  const [tab, setTab] = useState<TabType>('cases');
  const [cases, setCases] = useState<CaseDef[]>([]);
  const [allNftDefs, setAllNftDefs] = useState<NftDef[]>([]);
  const [openingCase, setOpeningCase] = useState<CaseDef | null>(null);
  const [sellTarget, setSellTarget] = useState<NftItem | null>(null);
  const [listTarget, setListTarget] = useState<NftItem | null>(null);
  const [rarityFilter, setRarityFilter] = useState<RarityFilter>('all');

  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const priceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { data: myNfts = [], refetch: refetchMine } = useGetUserNfts(telegramId, {
    query: { queryKey: getGetUserNftsQueryKey(telegramId), enabled: !!telegramId },
  });
  const { data: market = [], refetch: refetchMarket } = useGetNftMarket({
    query: { queryKey: getGetNftMarketQueryKey() },
  });
  const { data: offers = [], refetch: refetchOffers } = useGetTradeOffers(telegramId, {
    query: { queryKey: getGetTradeOffersQueryKey(telegramId), enabled: !!telegramId },
  });

  const listMut = useListNftForTrade();
  const offerMut = useCreateTradeOffer();
  const acceptMut = useAcceptTradeOffer();

  // Load case definitions
  useEffect(() => {
    fetch(`${API}/nfts/cases`).then(r => r.json()).then((data: any[]) => {
      setCases(data);
      const defs: NftDef[] = [];
      data.forEach(c => { if (c.nftPool) defs.push(...c.nftPool.common, ...c.nftPool.rare, ...c.nftPool.legendary); });
      const seen = new Set<string>();
      setAllNftDefs(defs.filter(d => { if (seen.has(d.key)) return false; seen.add(d.key); return true; }));
    }).catch(() => {});
  }, []);

  // Load & refresh market prices
  const fetchPrices = useCallback(() => {
    fetch(`${API}/nfts/market/prices`).then(r => r.json()).then(setMarketPrices).catch(() => {});
  }, []);

  useEffect(() => {
    fetchPrices();
    priceTimerRef.current = setInterval(fetchPrices, 15000);
    return () => { if (priceTimerRef.current) clearInterval(priceTimerRef.current); };
  }, [fetchPrices]);

  // Sell to system
  const handleSell = async () => {
    if (!sellTarget) return;
    try {
      const res = await fetch(`${API}/nfts/sell`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, nftId: sellTarget.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBalance(state.balance + data.earnedTl);
      toast.success(`🏦 +${data.earnedTl.toLocaleString()} TL bankaya yatırıldı!`);
      setSellTarget(null); refetchMine();
    } catch (e: any) { toast.error(e.message || 'Satış başarısız'); }
  };

  // List for sale on exchange
  const handleListForSale = async (price: number) => {
    if (!listTarget) return;
    try {
      const isDelisting = !!listTarget.listPrice;
      const res = await fetch(`${API}/nfts/list-for-sale`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, nftId: listTarget.id, price: isDelisting ? null : price }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(isDelisting ? '📦 Listeden çekildi' : `🏪 ${fmtPrice(price)} TL'ye satışa çıkarıldı!`);
      setListTarget(null); refetchMine(); refetchMarket();
    } catch (e: any) { toast.error(e.message || 'İşlem başarısız'); }
  };

  const handleDelistOrList = async (nft: NftItem) => {
    if (nft.listPrice) {
      // Delist directly
      try {
        const res = await fetch(`${API}/nfts/list-for-sale`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegramId, nftId: nft.id, price: null }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        toast.success('📦 Listeden çekildi');
        refetchMine(); refetchMarket();
      } catch (e: any) { toast.error(e.message || 'İşlem başarısız'); }
    } else {
      // Open listing modal
      setListTarget(nft);
    }
  };

  // Buy from exchange
  const handleBuy = async (nftId: string, priceTl: number, name: string) => {
    try {
      if (state.balance < priceTl) { toast.error(`Yetersiz TL! Gerekli: ${fmtPrice(priceTl)} TL`); return; }
      const res = await fetch(`${API}/nfts/buy`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, nftId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBalance(state.balance - priceTl);
      toast.success(`✅ ${name} satın alındı! -${fmtPrice(priceTl)} TL`);
      refetchMine(); refetchMarket(); fetchPrices();
    } catch (e: any) { toast.error(e.message || 'Satın alma başarısız'); }
  };

  const handleAccept = async (offerId: string, acceptorNftId: string) => {
    try {
      await acceptMut.mutateAsync({ data: { telegramId, offerId, acceptorNftId } });
      toast.success('✅ Takas tamamlandı!'); refetchMine(); refetchOffers();
    } catch { toast.error('Takas başarısız'); }
  };

  const filteredPrices = rarityFilter === 'all' ? marketPrices : marketPrices.filter(p => p.rarity === rarityFilter);

  const tabs: { key: TabType; icon: React.ReactNode; label: string; badge?: number }[] = [
    { key: 'cases',  icon: <Package size={14} />,    label: 'Kasalar' },
    { key: 'mine',   icon: <ShoppingBag size={14} />, label: 'Koleksiyon', badge: (myNfts as NftItem[]).length },
    { key: 'market', icon: <TrendingUp size={14} />,  label: 'Borsa' },
    { key: 'offers', icon: <Inbox size={14} />,       label: 'Teklifler', badge: (offers as any[]).length || undefined },
  ];

  return (
    <div className="h-full flex flex-col" style={{ background: '#080c10', color: 'white' }}>

      {/* Top balance bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b border-white/10 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)' }}>
        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
          <span>💵</span>
          <span className="font-black text-white text-sm tabular-nums">{fmtPrice(state.balance)}</span>
          <span className="text-white/40 text-[10px]">TL</span>
        </div>
        <div className="flex-1" />
        <div className="text-white/40 text-[10px] font-bold">NFT Pazarı</div>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-white/10 flex-shrink-0" style={{ background: 'rgba(0,0,0,0.4)' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 relative transition-colors"
            style={{ color: tab === t.key ? '#22c55e' : 'rgba(255,255,255,0.4)', borderBottom: tab === t.key ? '2px solid #22c55e' : '2px solid transparent' }}>
            {t.icon}
            <span className="text-[9px] font-black">{t.label}</span>
            {t.badge ? (
              <div className="absolute top-1 right-1 min-w-[16px] h-4 bg-green-500 rounded-full flex items-center justify-center text-[8px] font-black text-white px-1">{t.badge}</div>
            ) : null}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* ══ KASALAR ══ */}
        {tab === 'cases' && (
          <div className="p-3 flex flex-col gap-3">
            {cases.map(c => (
              <motion.button key={c.id} onClick={() => {
                if (state.balance < c.price) { toast.error(`Gerekli: ${c.price} TL`); return; }
                setOpeningCase(c);
              }}
                className="w-full rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition-all"
                style={{ background: c.bgGradient, border: '2px solid rgba(255,255,255,0.15)', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}
                whileTap={{ scale: 0.97 }}>
                <div className="text-5xl">{c.emoji}</div>
                <div className="flex-1 text-left">
                  <div className="font-black text-white text-base">{c.name}</div>
                  <div className="text-white/70 text-xs font-bold mt-0.5">{c.description}</div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <span className="bg-white/10 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      🟫 {Math.round((c.drops.common ?? 0) * 100)}%
                    </span>
                    <span className="bg-blue-500/20 text-blue-300 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      🔵 {Math.round((c.drops.rare ?? 0) * 100)}%
                    </span>
                    {(c.drops as any).epic > 0 && (
                      <span className="bg-red-600/30 text-red-300 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        🔴 {Math.round(((c.drops as any).epic ?? 0) * 100)}%
                      </span>
                    )}
                    {(c.drops as any).special > 0 && (
                      <span className="bg-purple-500/20 text-purple-300 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        🟣 {Math.round(((c.drops as any).special ?? 0) * 100)}%
                      </span>
                    )}
                    <span className="bg-yellow-500/20 text-yellow-300 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      ⭐ {Math.round((c.drops.legendary ?? 0) * 100)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-white text-lg">{c.price}</div>
                  <div className="text-white/60 text-[10px] font-bold">TL</div>
                  <div className={`text-[9px] font-bold mt-1 ${state.balance >= c.price ? 'text-green-400' : 'text-red-400'}`}>
                    {state.balance >= c.price ? '✓ Yeterli' : '✗ Yetersiz'}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {/* ══ KOLEKSİYON ══ */}
        {tab === 'mine' && (
          <div className="p-3">
            {(myNfts as NftItem[]).length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <span className="text-6xl opacity-30">🃏</span>
                <div className="text-white/30 text-sm font-bold text-center">Henüz NFT yok<br />Kasa aç ve koleksiyonunu oluştur!</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {(myNfts as NftItem[]).map(nft => (
                  <NftCard key={nft.id} nft={nft}
                    onSellToSystem={n => setSellTarget(n)}
                    onListForSale={n => handleDelistOrList(n)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ BORSA ══ */}
        {tab === 'market' && (
          <div className="flex flex-col">
            {/* Exchange header */}
            <div className="px-3 py-2 border-b border-white/10 flex items-center gap-2"
              style={{ background: 'rgba(0,0,0,0.3)' }}>
              <TrendingUp size={14} className="text-green-400" />
              <span className="font-black text-green-400 text-xs">NFT BORSASI</span>
              <span className="text-white/30 text-[10px]">canlı fiyatlar</span>
              <div className="flex-1" />
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            </div>

            {/* Rarity filter */}
            <div className="flex gap-1 px-3 py-2 border-b border-white/10 overflow-x-auto no-scrollbar">
              {(['all', 'common', 'rare', 'epic', 'special', 'legendary'] as const).map(f => (
                <button key={f} onClick={() => setRarityFilter(f)}
                  className="px-2 py-1 rounded-full text-[9px] font-black transition-all flex-shrink-0"
                  style={rarityFilter === f ? {
                    background: f === 'all' ? '#22c55e' : f === 'common' ? '#6b7280' : f === 'rare' ? '#3b82f6' : f === 'epic' ? '#dc2626' : f === 'special' ? '#a855f7' : '#f59e0b',
                    color: 'white',
                  } : {
                    background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)',
                  }}>
                  {f === 'all' ? 'Tümü' : f === 'common' ? 'Sıradan' : f === 'rare' ? 'Nadir' : f === 'epic' ? 'Epik' : f === 'special' ? 'Özel' : 'Efsanevi'}
                </button>
              ))}
            </div>

            {/* Market summary */}
            <div className="flex gap-2 px-3 py-2 border-b border-white/10 overflow-x-auto no-scrollbar">
              <div className="flex-shrink-0 bg-white/5 rounded-lg px-2 py-1 text-center min-w-[60px]">
                <div className="text-[9px] text-white/40 font-bold">Toplam</div>
                <div className="text-green-400 font-black text-xs">{(market as NftItem[]).length} ilan</div>
              </div>
              <div className="flex-shrink-0 bg-white/5 rounded-lg px-2 py-1 text-center min-w-[60px]">
                <div className="text-[9px] text-white/40 font-bold">Yükselen</div>
                <div className="text-green-400 font-black text-xs">{marketPrices.filter(p => p.change > 0).length}</div>
              </div>
              <div className="flex-shrink-0 bg-white/5 rounded-lg px-2 py-1 text-center min-w-[60px]">
                <div className="text-[9px] text-white/40 font-bold">Düşen</div>
                <div className="text-red-400 font-black text-xs">{marketPrices.filter(p => p.change < 0).length}</div>
              </div>
            </div>

            {/* NFT price rows */}
            <div className="flex flex-col gap-1 px-2 py-2">
              {filteredPrices.length === 0 && (
                <div className="text-center text-white/30 py-8 text-sm">Yükleniyor...</div>
              )}
              {filteredPrices.map(price => (
                <ExchangeNftCard
                  key={price.nftType}
                  price={price}
                  myNfts={myNfts as NftItem[]}
                  telegramId={telegramId}
                  onBuy={handleBuy}
                  onRefresh={() => { refetchMarket(); fetchPrices(); }}
                />
              ))}
            </div>
          </div>
        )}

        {/* ══ TEKLİFLER ══ */}
        {tab === 'offers' && (
          <div className="p-3 flex flex-col gap-3">
            {(offers as any[]).length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <span className="text-5xl opacity-30">📭</span>
                <div className="text-white/30 text-sm font-bold text-center">Bekleyen teklif yok</div>
              </div>
            ) : (
              (offers as any[]).map((offer: any) => (
                <div key={offer.id} className="rounded-2xl p-3 flex flex-col gap-3"
                  style={{ background: '#1e3a5f', border: '1px solid #3b82f6' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{offer.offeredNft?.emoji}</span>
                    <div>
                      <div className="font-black text-white text-sm">{offer.offeredNft?.name}</div>
                      <div className="text-blue-300 text-xs font-bold">#{offer.offeredNft?.mintNumber}</div>
                    </div>
                    <div className="ml-auto text-white/40 text-[10px]">Takas Teklifi</div>
                  </div>
                  {(myNfts as NftItem[]).length > 0 && (
                    <div className="flex flex-col gap-1">
                      <div className="text-white/50 text-[10px] font-bold">Hangi NFT'ini ver?</div>
                      {(myNfts as NftItem[]).slice(0, 3).map(myNft => (
                        <button key={myNft.id}
                          onClick={() => handleAccept(offer.id, myNft.id)}
                          className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg active:scale-95"
                          style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)' }}>
                          <span>{myNft.emoji}</span>
                          <span className="font-bold text-white text-[11px]">{myNft.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      <AnimatePresence>
        {openingCase && (
          <CaseOpenOverlay key={openingCase.id} caseDef={openingCase} allNfts={allNftDefs}
            onBalanceSync={b => setBalance(b)}
            onClose={() => { setOpeningCase(null); setTab('mine'); }}
            onOpenAnother={() => setOpeningCase({ ...openingCase })}
            onNftMinted={() => { refetchMine(); }} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sellTarget && (
          <SellModal nft={sellTarget} onConfirm={handleSell} onCancel={() => setSellTarget(null)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {listTarget && !listTarget.listPrice && (
          <ListForSaleModal
            nft={listTarget}
            marketPrice={marketPrices.find(p => p.nftType === listTarget.nftType)?.currentPrice ?? listTarget.sellPrice ?? 10}
            onConfirm={handleListForSale}
            onCancel={() => setListTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
