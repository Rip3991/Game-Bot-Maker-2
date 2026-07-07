import React, { useState, useRef, useEffect } from 'react';
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
import { X, ShoppingBag, Repeat2, Inbox, Package } from 'lucide-react';
import { NftArtwork } from '../components/NftArtwork';

// ── Types ────────────────────────────────────────────────────────────────────

type Rarity = 'common' | 'rare' | 'legendary';
type TabType = 'cases' | 'mine' | 'market' | 'offers';

interface CaseDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  description: string;
  bgGradient: string;
  drops: { common: number; rare: number; legendary: number };
}

interface NftDef {
  key: string;
  emoji: string;
  name: string;
  rarity: Rarity;
  mintLimit: number;
  sellPrice: number;
}

interface NftItem {
  id: string;
  ownerTelegramId: string;
  nftType: string;
  rarity: Rarity;
  name: string;
  emoji: string;
  mintNumber: number;
  isListedForTrade: boolean;
  sellPrice?: number;
  createdAt: string;
}

// ── Rarity styles ─────────────────────────────────────────────────────────────

const RARITY: Record<Rarity, { label: string; border: string; glow: string; badge: string; bg: string; text: string }> = {
  common:    { label: 'Sıradan',   border: '#6b7280', glow: 'rgba(107,114,128,0.5)',  badge: '#4b5563', bg: '#1f2937', text: '#d1d5db' },
  rare:      { label: 'Nadir',     border: '#3b82f6', glow: 'rgba(59,130,246,0.7)',   badge: '#1d4ed8', bg: '#1e3a5f', text: '#93c5fd' },
  legendary: { label: 'Efsanevi', border: '#f59e0b', glow: 'rgba(245,158,11,0.9)',   badge: '#b45309', bg: '#451a00', text: '#fbbf24' },
};

// ── API base ──────────────────────────────────────────────────────────────────

const API = `${import.meta.env.BASE_URL}api`;

// ── Case Opening Reel Animation ───────────────────────────────────────────────

function CaseOpenReel({
  items,
  winner,
  onDone,
}: {
  items: NftDef[];
  winner: NftDef;
  onDone: () => void;
}) {
  const reelRef = useRef<HTMLDivElement>(null);
  const CARD_W = 80; // px including gap
  const VISIBLE = 7;
  const CENTER_IDX = Math.floor(VISIBLE / 2); // 3
  const REEL_COUNT = 60;

  // Build reel: many random items, winner placed at the center-of-end
  const reel = useRef<NftDef[]>([]);
  if (reel.current.length === 0) {
    for (let i = 0; i < REEL_COUNT; i++) {
      reel.current.push(items[Math.floor(Math.random() * items.length)]);
    }
    // Put winner at position REEL_COUNT - VISIBLE + CENTER_IDX
    reel.current[REEL_COUNT - VISIBLE + CENTER_IDX] = winner;
  }

  useEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    // Instantly place at start
    el.style.transition = 'none';
    el.style.transform = 'translateX(0)';

    const finalX = -(REEL_COUNT - VISIBLE + CENTER_IDX - CENTER_IDX) * CARD_W;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'transform 4s cubic-bezier(0.05, 0.9, 0.1, 1)';
        el.style.transform = `translateX(${finalX}px)`;
      });
    });

    const timeout = setTimeout(onDone, 4200);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ width: VISIBLE * CARD_W, height: 106, border: '2px solid rgba(255,255,255,0.2)' }}>
      {/* Center pointer */}
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

// ── NFT Card ──────────────────────────────────────────────────────────────────

function NftCard({
  nft,
  owned = false,
  onSell,
  onTrade,
  onOffer,
  myNfts,
}: {
  nft: NftItem;
  owned?: boolean;
  onSell?: (nft: NftItem) => void;
  onTrade?: (nft: NftItem) => void;
  onOffer?: (offered: NftItem, target: NftItem) => void;
  myNfts?: NftItem[];
}) {
  const r = RARITY[nft.rarity] ?? RARITY.common;
  const [offerOpen, setOfferOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl flex flex-col relative overflow-hidden"
      style={{
        background: '#0a0a14',
        border: `2px solid ${r.border}`,
        boxShadow: `0 0 20px ${r.glow}, 0 4px 16px rgba(0,0,0,0.6)`,
      }}
    >
      {/* ── Artwork area ── */}
      <NftArtwork
        nftType={nft.nftType}
        emoji={nft.emoji}
        rarity={nft.rarity}
        size="card"
        animated={true}
      />

      {/* Rarity badge — overlaid on artwork */}
      <div
        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black shadow-lg"
        style={{ background: r.badge, color: r.text, border: `1px solid ${r.border}` }}
      >
        {r.label}
      </div>

      {/* Trade indicator */}
      {nft.isListedForTrade && (
        <div className="absolute top-2 right-2 bg-blue-600/90 border border-blue-400 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full">
          🔄
        </div>
      )}

      {/* ── Info + actions ── */}
      <div className="flex flex-col gap-1.5 p-2.5 pt-2">
        {/* Name + mint */}
        <div>
          <div className="font-black text-white text-[11px] leading-tight truncate">{nft.name}</div>
          <div className="flex items-center justify-between mt-0.5">
            <div className="text-[9px] font-bold" style={{ color: r.text }}>#{nft.mintNumber}</div>
            {nft.sellPrice && (
              <div className="text-[9px] font-black text-yellow-300">💰 {nft.sellPrice.toLocaleString()}</div>
            )}
          </div>
        </div>

        {/* Actions */}
        {owned && (
          <div className="flex gap-1">
            <button
              onClick={() => onSell?.(nft)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', color: 'white' }}
            >
              💵 Sat
            </button>
            <button
              onClick={() => onTrade?.(nft)}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-95"
              style={{
                background: nft.isListedForTrade
                  ? 'linear-gradient(135deg, #7f1d1d, #991b1b)'
                  : 'linear-gradient(135deg, #1d4ed8, #1e40af)',
                color: 'white',
              }}
            >
              {nft.isListedForTrade ? '⬇️ Al' : '🔄 Takas'}
            </button>
          </div>
        )}

        {/* Offer for market items */}
        {!owned && myNfts && (
          <div className="w-full">
            {offerOpen ? (
              <div className="space-y-1">
                <p className="text-[10px] text-white/60 text-center font-bold">Hangi NFT'ni ver?</p>
                {myNfts.map(myNft => (
                  <button
                    key={myNft.id}
                    onClick={() => { onOffer?.(myNft, nft); setOfferOpen(false); }}
                    className="w-full text-[10px] font-bold py-1 rounded-lg active:scale-95"
                    style={{ background: '#1d4ed8', color: 'white', border: '1px solid #1e40af' }}
                  >
                    {myNft.emoji} {myNft.name}
                  </button>
                ))}
                <button onClick={() => setOfferOpen(false)} className="w-full text-[10px] py-0.5 text-white/40">İptal</button>
              </div>
            ) : (
              <button
                onClick={() => myNfts.length > 0 ? setOfferOpen(true) : toast.error('Önce bir NFT edin!')}
                className="w-full py-1.5 rounded-lg text-[10px] font-black active:scale-95"
                style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)', color: 'white' }}
              >
                🤝 Teklif Ver
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Sell Confirmation Modal ───────────────────────────────────────────────────

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
          <div className="text-white/60 text-xs font-bold mb-1">Satış fiyatı</div>
          <div className="text-3xl font-black text-yellow-300">{nft.sellPrice?.toLocaleString()} TL</div>
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-black text-white/60 border border-white/20 active:scale-95">
            Vazgeç
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 rounded-2xl font-black text-white active:scale-95"
            style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', border: '1px solid #166534' }}
          >
            💵 Sat!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Case Opening Overlay ──────────────────────────────────────────────────────

function CaseOpenOverlay({
  caseDef,
  allNfts,
  onBalanceSync,
  onClose,
  onOpenAnother,
  onNftMinted,
}: {
  caseDef: CaseDef;
  allNfts: NftDef[];
  onBalanceSync: (newBalance: number) => void;
  onClose: () => void;
  onOpenAnother: () => void;
  onNftMinted: () => void;
}) {
  const { telegramId } = useUser();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<'spinning' | 'result' | 'error'>('spinning');
  const [won, setWon] = useState<NftItem | null>(null);
  const [reelItems] = useState<NftDef[]>(allNfts);
  const [wonDef, setWonDef] = useState<NftDef | null>(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    fetch(`${API}/nfts/cases/open`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ telegramId, caseType: caseDef.id }),
    })
      .then(async r => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? 'Kasa açılamadı');
        return data as NftItem;
      })
      .then((nft: NftItem) => {
        // Fetch updated balance from server to sync client state
        fetch(`${API}/users/${telegramId}`)
          .then(r => r.json())
          .then(u => { if (typeof u.balance === 'number') onBalanceSync(u.balance); })
          .catch(() => {});

        setWon(nft);
        const def = allNfts.find(d => d.key === nft.nftType) ?? {
          key: nft.nftType,
          emoji: nft.emoji,
          name: nft.name,
          rarity: nft.rarity,
          mintLimit: 1000,
          sellPrice: (nft as any).sellPrice ?? 10,
        };
        setWonDef(def);
        // Invalidate NFT list immediately so it's ready when user closes
        qc.invalidateQueries({ queryKey: getGetUserNftsQueryKey(telegramId) });
        onNftMinted();
      })
      .catch(e => { setErrMsg(e.message); setPhase('error'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReelDone = () => setPhase('result');

  const handleClose = () => {
    qc.invalidateQueries({ queryKey: getGetUserNftsQueryKey(telegramId) });
    onClose();
  };

  const r = won ? (RARITY[won.rarity] ?? RARITY.common) : RARITY.common;

  return (
    <motion.div className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)' }}>

      <button onClick={handleClose} className="absolute top-4 right-4 text-white/50 hover:text-white">
        <X size={24} />
      </button>

      <div className="text-center mb-6">
        <div className="text-4xl mb-1">{caseDef.emoji}</div>
        <div className="font-black text-white text-xl">{caseDef.name} Açılıyor</div>
      </div>

      {phase === 'error' && (
        <div className="flex flex-col items-center gap-4 px-8">
          <div className="text-red-400 font-bold text-center">{errMsg || 'Bir hata oluştu'}</div>
          <button onClick={handleClose}
            className="px-8 py-3 rounded-2xl font-black text-white active:scale-95"
            style={{ background: 'linear-gradient(135deg, #374151, #1f2937)', border: '1px solid #4b5563' }}>
            Kapat
          </button>
        </div>
      )}

      {wonDef && phase === 'spinning' && (
        <CaseOpenReel items={reelItems} winner={wonDef} onDone={handleReelDone} />
      )}

      {!wonDef && phase === 'spinning' && (
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-6xl">
          {caseDef.emoji}
        </motion.div>
      )}

      <AnimatePresence>
        {phase === 'result' && won && (
          <motion.div className="flex flex-col items-center gap-4 px-6 w-full max-w-xs"
            initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 20 }}>

            {/* Winner card with full NftArtwork */}
            <motion.div
              className="w-full rounded-2xl overflow-hidden"
              style={{ border: `3px solid ${r.border}`, boxShadow: `0 0 60px ${r.glow}` }}
              animate={{ boxShadow: [`0 0 30px ${r.glow}`, `0 0 80px ${r.glow}`, `0 0 30px ${r.glow}`] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              {/* Large artwork */}
              <NftArtwork
                nftType={won.nftType}
                emoji={won.emoji}
                rarity={won.rarity}
                size="large"
                animated={true}
              />

              {/* Info strip */}
              <div className="px-4 py-3 flex flex-col gap-1" style={{ background: '#0a0a14' }}>
                <div className="flex items-center justify-between">
                  <span className="font-black text-white text-base leading-tight">{won.name}</span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: r.badge, color: r.text }}>{r.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white/40">#{won.mintNumber}</span>
                  {won.sellPrice && (
                    <span className="text-sm font-black text-yellow-300">💰 {won.sellPrice.toLocaleString()} TL</span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Legendary banner */}
            {won.rarity === 'legendary' && (
              <motion.div className="text-yellow-300 font-black text-base text-center"
                animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                🎊 EFSANEVİ KAZANIM! 🎊
              </motion.div>
            )}
            {won.rarity === 'rare' && (
              <div className="text-blue-300 font-black text-sm text-center">✨ Nadir NFT Kazandın!</div>
            )}

            <div className="flex gap-3 w-full">
              <button onClick={onOpenAnother}
                className="flex-1 py-3 rounded-2xl font-black text-yellow-900 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)' }}>
                🎰 Bir Daha
              </button>
              <button onClick={handleClose}
                className="flex-1 py-3 rounded-2xl font-black text-white active:scale-95"
                style={{ background: 'linear-gradient(135deg, #374151, #1f2937)', border: '1px solid #4b5563' }}>
                ✅ Koleksiyona Git
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main NftPage ──────────────────────────────────────────────────────────────

export default function NftPage() {
  const { telegramId } = useUser();
  const { state, setBalance } = useGameEngine();
  const qc = useQueryClient();

  const [tab, setTab] = useState<TabType>('cases');
  const [cases, setCases] = useState<CaseDef[]>([]);
  const [allNftDefs, setAllNftDefs] = useState<NftDef[]>([]);
  const [openingCase, setOpeningCase] = useState<CaseDef | null>(null);
  const [sellTarget, setSellTarget] = useState<NftItem | null>(null);

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
    fetch(`${API}/nfts/cases`)
      .then(r => r.json())
      .then((data: any[]) => {
        setCases(data);
        // Flatten all NFT defs for reel
        const defs: NftDef[] = [];
        data.forEach(c => {
          if (c.nftPool) {
            defs.push(...c.nftPool.common, ...c.nftPool.rare, ...c.nftPool.legendary);
          }
        });
        // Deduplicate
        const seen = new Set<string>();
        setAllNftDefs(defs.filter(d => { if (seen.has(d.key)) return false; seen.add(d.key); return true; }));
      })
      .catch(() => {});
  }, []);

  const handleOpenCase = (caseDef: CaseDef) => {
    if (state.balance < caseDef.price) {
      toast.error(`Yeterli TL yok! Gerekli: ${caseDef.price} TL`);
      return;
    }
    // Balance deducted ONLY after server confirms — see CaseOpenOverlay
    setOpeningCase(caseDef);
  };

  const handleListToggle = async (nft: NftItem) => {
    await listMut.mutateAsync({ data: { telegramId, nftId: nft.id, list: !nft.isListedForTrade } });
    toast.success(nft.isListedForTrade ? '📦 Pazardan çekildi' : '🔄 Pazara çıkarıldı!');
    refetchMine();
    refetchMarket();
  };

  const handleSell = async () => {
    if (!sellTarget) return;
    try {
      const res = await fetch(`${API}/nfts/sell`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, nftId: sellTarget.id }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setBalance(state.balance + data.earnedTl);
      toast.success(`💵 +${data.earnedTl.toLocaleString()} TL kazandın!`);
      setSellTarget(null);
      refetchMine();
    } catch (e: any) {
      toast.error(e.message || 'Satış başarısız');
    }
  };

  const handleOffer = async (offeredNft: NftItem, targetNft: NftItem) => {
    try {
      await offerMut.mutateAsync({ data: { offererTelegramId: telegramId, offeredNftId: offeredNft.id } });
      toast.success('🤝 Teklif gönderildi!');
      refetchMine();
    } catch { toast.error('Teklif gönderilemedi'); }
  };

  const handleAccept = async (offerId: string, acceptorNftId: string) => {
    try {
      await acceptMut.mutateAsync({ data: { telegramId, offerId, acceptorNftId } });
      toast.success('✅ Takas tamamlandı!');
      refetchMine();
      refetchOffers();
    } catch { toast.error('Takas başarısız'); }
  };

  const marketExcludingMine = (market as NftItem[]).filter(n => n.ownerTelegramId !== telegramId);

  const tabs: { key: TabType; icon: React.ReactNode; label: string; badge?: number }[] = [
    { key: 'cases',  icon: <Package size={14} />,    label: 'Kasalar'  },
    { key: 'mine',   icon: <ShoppingBag size={14} />, label: 'Koleksiyon', badge: myNfts.length },
    { key: 'market', icon: <Repeat2 size={14} />,     label: 'Pazar'   },
    { key: 'offers', icon: <Inbox size={14} />,       label: 'Teklifler', badge: offers.length || undefined },
  ];

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: '#0f172a' }}>

      {/* ── Header ── */}
      <div className="px-4 py-3 flex-shrink-0 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1e3a5f, #0f172a)', borderBottom: '2px solid #1e3a5f' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #f59e0b 0%, transparent 50%)' }} />
        <h1 className="text-2xl font-black text-white relative">🃏 NFT Koleksiyonu</h1>
        <p className="text-xs text-white/50 font-bold relative">60 benzersiz NFT — Aç, Sat, Takas Et</p>
        <div className="mt-2 flex items-center gap-2 relative">
          <span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 text-xs font-black px-2 py-0.5 rounded-full">
            💵 {state.balance.toFixed(0)} TL
          </span>
          <span className="text-white/30 text-xs font-bold">|</span>
          <span className="text-white/50 text-xs font-bold">{myNfts.length} NFT sahibisin</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex flex-shrink-0" style={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-black transition-all relative"
            style={{ color: tab === t.key ? '#f59e0b' : 'rgba(255,255,255,0.4)' }}>
            {t.icon}
            {t.label}
            {t.badge ? (
              <span className="absolute top-1 right-2 bg-red-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">{t.badge}</span>
            ) : null}
            {tab === t.key && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 inset-x-0 h-0.5 bg-yellow-400" />
            )}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">

          {/* ════ CASES TAB ════ */}
          {tab === 'cases' && (
            <motion.div key="cases" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4 space-y-4">
              <p className="text-white/40 text-xs font-bold text-center">Kasa aç, şansını dene — nadir NFT'ler kazan!</p>

              {cases.map(c => (
                <motion.div key={c.id}
                  className="rounded-3xl overflow-hidden"
                  style={{ background: c.bgGradient, border: '2px solid rgba(255,255,255,0.15)' }}
                  whileTap={{ scale: 0.98 }}>

                  {/* Top: name + price */}
                  <div className="p-4 flex items-center gap-4">
                    <motion.div className="text-6xl"
                      animate={{ rotate: [-3, 3, -3], scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}>
                      {c.emoji}
                    </motion.div>
                    <div className="flex-1">
                      <div className="font-black text-white text-xl">{c.name}</div>
                      <div className="text-white/60 text-xs font-bold mb-2">{c.description}</div>
                      {/* Drop rates */}
                      <div className="flex gap-1 flex-wrap">
                        <span className="text-[9px] font-black bg-black/30 rounded-full px-1.5 py-0.5 text-gray-300">
                          ⚪ {(c.drops.common * 100).toFixed(0)}%
                        </span>
                        <span className="text-[9px] font-black bg-black/30 rounded-full px-1.5 py-0.5 text-blue-300">
                          🔵 {(c.drops.rare * 100).toFixed(0)}%
                        </span>
                        <span className="text-[9px] font-black bg-black/30 rounded-full px-1.5 py-0.5 text-yellow-300">
                          🟡 {(c.drops.legendary * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-white text-2xl">{c.price}</div>
                      <div className="text-white/60 text-xs font-bold">TL</div>
                    </div>
                  </div>

                  {/* Open button */}
                  <button
                    onClick={() => handleOpenCase(c)}
                    disabled={state.balance < c.price}
                    className="w-full py-3.5 font-black text-base transition-all active:scale-95 disabled:opacity-40"
                    style={{
                      background: state.balance >= c.price
                        ? 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 100%)'
                        : 'rgba(0,0,0,0.3)',
                      color: state.balance >= c.price ? 'white' : 'rgba(255,255,255,0.4)',
                      borderTop: '1px solid rgba(255,255,255,0.15)',
                    }}>
                    {state.balance >= c.price ? `🎰 Kasayı Aç — ${c.price} TL` : `💸 Yetersiz bakiye (${c.price} TL gerek)`}
                  </button>
                </motion.div>
              ))}

              {cases.length === 0 && (
                <div className="text-center text-white/30 py-10 font-bold">Yükleniyor...</div>
              )}
            </motion.div>
          )}

          {/* ════ MY NFTs TAB ════ */}
          {tab === 'mine' && (
            <motion.div key="mine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
              {myNfts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="text-7xl mb-4">🃏</div>
                  <p className="font-black text-white text-lg">Henüz NFT'n yok!</p>
                  <p className="text-sm text-white/50 mt-2">Kasaları aç ve koleksiyonunu oluştur.</p>
                  <button onClick={() => setTab('cases')}
                    className="mt-6 px-8 py-3 rounded-2xl font-black text-yellow-900 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)' }}>
                    🎰 Kasa Aç
                  </button>
                </div>
              ) : (
                <>
                  {/* Rarity breakdown */}
                  <div className="flex gap-2 mb-4">
                    {(['legendary', 'rare', 'common'] as Rarity[]).map(rar => {
                      const count = (myNfts as NftItem[]).filter(n => n.rarity === rar).length;
                      if (!count) return null;
                      const r = RARITY[rar];
                      return (
                        <div key={rar} className="flex-1 rounded-xl p-2 text-center" style={{ background: r.bg, border: `1px solid ${r.border}` }}>
                          <div className="font-black text-lg" style={{ color: r.text }}>{count}</div>
                          <div className="text-[9px] font-bold text-white/60">{r.label}</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(myNfts as NftItem[]).map(nft => (
                      <NftCard
                        key={nft.id}
                        nft={nft}
                        owned
                        onSell={setSellTarget}
                        onTrade={handleListToggle}
                        myNfts={myNfts as NftItem[]}
                      />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ════ MARKET TAB ════ */}
          {tab === 'market' && (
            <motion.div key="market" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
              <p className="text-white/40 text-xs font-bold text-center mb-4">Takasa çıkarılan NFT'ler</p>
              {marketExcludingMine.length === 0 ? (
                <div className="text-center text-white/30 py-16 font-bold">
                  <div className="text-5xl mb-4">🏪</div>
                  Şu an pazarda NFT yok.
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {marketExcludingMine.map(nft => (
                    <NftCard
                      key={nft.id}
                      nft={nft as NftItem}
                      owned={false}
                      myNfts={myNfts as NftItem[]}
                      onOffer={handleOffer}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ════ OFFERS TAB ════ */}
          {tab === 'offers' && (
            <motion.div key="offers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
              {offers.length === 0 ? (
                <div className="text-center text-white/30 py-16 font-bold">
                  <div className="text-5xl mb-4">📬</div>
                  Bekleyen teklif yok.
                </div>
              ) : (
                <div className="space-y-3">
                  {(offers as any[]).map(offer => {
                    const offeredNft = offer.offeredNft as NftItem | null;
                    const r = offeredNft ? (RARITY[offeredNft.rarity] ?? RARITY.common) : RARITY.common;
                    const myListedNfts = (myNfts as NftItem[]).filter(n => n.isListedForTrade);
                    return (
                      <div key={offer.id} className="rounded-2xl p-4 space-y-3"
                        style={{ background: r.bg, border: `2px solid ${r.border}`, boxShadow: `0 0 15px ${r.glow}` }}>
                        <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Gelen Teklif</p>
                        {offeredNft && (
                          <div className="flex items-center gap-3">
                            <span className="text-4xl">{offeredNft.emoji}</span>
                            <div>
                              <div className="font-black text-white">{offeredNft.name}</div>
                              <div className="text-xs font-bold" style={{ color: r.text }}>{r.label} #{offeredNft.mintNumber}</div>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-white/60 font-bold">Hangi NFT'yi veriyorsun?</p>
                        {myListedNfts.length === 0 ? (
                          <p className="text-xs text-white/30 font-bold">Takasa çıkarılmış NFT'n yok.</p>
                        ) : (
                          <div className="space-y-2">
                            {myListedNfts.map(myNft => (
                              <button key={myNft.id}
                                onClick={() => handleAccept(offer.id, myNft.id)}
                                className="w-full flex items-center gap-2 py-2 px-3 rounded-xl font-bold text-sm active:scale-95"
                                style={{ background: '#16a34a', color: 'white' }}>
                                <span>{myNft.emoji}</span>
                                <span className="flex-1 text-left">{myNft.name}</span>
                                <span className="text-xs opacity-80">✅ Kabul</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Case Opening Overlay ── */}
      <AnimatePresence>
        {openingCase && (
          <CaseOpenOverlay
            caseDef={openingCase}
            allNfts={allNftDefs}
            onBalanceSync={(newBalance) => setBalance(newBalance)}
            onNftMinted={() => refetchMine()}
            onClose={() => {
              setOpeningCase(null);
              // Switch to collection tab so user sees their new NFT
              setTab('mine');
            }}
            onOpenAnother={() => {
              const c = openingCase;
              setOpeningCase(null);
              setTimeout(() => handleOpenCase(c), 150);
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Sell Confirmation Modal ── */}
      <AnimatePresence>
        {sellTarget && (
          <SellModal nft={sellTarget} onConfirm={handleSell} onCancel={() => setSellTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
