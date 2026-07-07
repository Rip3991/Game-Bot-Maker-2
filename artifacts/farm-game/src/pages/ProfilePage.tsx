import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '../hooks/use-user';
import { NftArtwork } from '../components/NftArtwork';
import { useLocation } from 'wouter';

const API = `${import.meta.env.BASE_URL}api`;

type Rarity = 'common' | 'rare' | 'special' | 'legendary';

interface ProfileUser {
  telegramId: string;
  firstName: string;
  username?: string | null;
  coins: number;
  balance: number;
  streakCount: number;
  totalReferrals: number;
  createdAt: string;
}

interface NftItem {
  id: string;
  nftType: string;
  rarity: Rarity;
  name: string;
  emoji: string;
  mintNumber: number;
  isListedForTrade: boolean;
  listPrice?: number | null;
}

const RARITY_STYLE: Record<string, { border: string; glow: string; badge: string; text: string; label: string }> = {
  common:    { border: '#6b7280', glow: 'rgba(107,114,128,0.4)', badge: '#374151', text: '#d1d5db', label: 'Sıradan'  },
  rare:      { border: '#3b82f6', glow: 'rgba(59,130,246,0.6)',  badge: '#1d4ed8', text: '#93c5fd', label: 'Nadir'    },
  special:   { border: '#a855f7', glow: 'rgba(168,85,247,0.6)',  badge: '#7e22ce', text: '#d8b4fe', label: 'Özel'     },
  legendary: { border: '#f59e0b', glow: 'rgba(245,158,11,0.8)', badge: '#b45309', text: '#fbbf24', label: 'Efsanevi' },
};

const STAT_ICONS: Record<string, string> = {
  coins: '🪙', balance: '💵', streak: '🔥', referrals: '👥', nfts: '✨',
};

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function NftCard({ nft }: { nft: NftItem }) {
  const r = RARITY_STYLE[nft.rarity] ?? RARITY_STYLE.common;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: '#0a0a14', border: `2px solid ${r.border}`, boxShadow: `0 0 16px ${r.glow}` }}>
      <div style={{ height: 72 }}>
        <NftArtwork nftType={nft.nftType} emoji={nft.emoji} rarity={nft.rarity} size="card" animated={nft.rarity === 'legendary'} />
      </div>
      <div className="px-1.5 pb-1.5 pt-1">
        <div className="text-[9px] font-black truncate leading-tight" style={{ color: r.text }}>{nft.name}</div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-[7px] font-black px-1.5 py-px rounded-full" style={{ background: r.badge, color: r.text }}>{r.label}</span>
          <span className="text-[7px] font-bold text-white/40">#{nft.mintNumber}</span>
        </div>
        {nft.isListedForTrade && (
          <div className="text-[7px] font-black text-green-400 mt-0.5 text-center">🏪 Satışta</div>
        )}
      </div>
    </motion.div>
  );
}

interface Props { telegramId: string }

export default function ProfilePage({ telegramId }: Props) {
  const { telegramId: myId } = useUser();
  const [, navigate] = useLocation();
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [nfts, setNfts] = useState<NftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'nfts' | 'stats'>('nfts');
  const [filter, setFilter] = useState<'all' | Rarity>('all');

  const isMe = telegramId === myId;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/users/${telegramId}`).then(r => r.ok ? r.json() : null),
      fetch(`${API}/nfts/user/${telegramId}`).then(r => r.ok ? r.json() : []),
    ]).then(([u, n]) => {
      setProfile(u);
      setNfts(n);
    }).finally(() => setLoading(false));
  }, [telegramId]);

  const filtered = filter === 'all' ? nfts : nfts.filter(n => n.rarity === filter);

  const rarityCount = (r: Rarity) => nfts.filter(n => n.rarity === r).length;

  return (
    <div className="flex flex-col h-full overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0d1117 0%, #111827 50%, #0d1b2a 100%)' }}>

      {/* Header */}
      <div className="flex-shrink-0 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a3a0a, #2a5c14)', borderBottom: '2px solid rgba(255,255,255,0.08)' }}>

        {/* Back button */}
        <button onClick={() => window.history.back()}
          className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/30 border border-white/15 flex items-center justify-center text-white/70 text-sm active:opacity-70 z-10">
          ←
        </button>

        {isMe && (
          <div className="absolute top-3 right-3 bg-yellow-400/20 border border-yellow-400/50 rounded-full px-2 py-0.5 text-[9px] font-black text-yellow-300 z-10">
            👤 Profilim
          </div>
        )}

        {/* Profile hero */}
        <div className="flex flex-col items-center pt-10 pb-5 gap-3">
          {loading ? (
            <div className="w-20 h-20 rounded-full bg-white/10 animate-pulse" />
          ) : (
            <motion.div
              initial={{ scale: 0.7 }} animate={{ scale: 1 }}
              className="w-20 h-20 rounded-full flex items-center justify-center font-black text-4xl shadow-2xl border-4"
              style={{ background: 'linear-gradient(135deg, #f5c842, #d97706)', borderColor: '#fbbf24', boxShadow: '0 0 24px rgba(251,191,36,0.5)' }}>
              {profile?.firstName?.charAt(0).toUpperCase() ?? '?'}
            </motion.div>
          )}

          <div className="text-center">
            <h1 className="text-xl font-black text-white">
              {profile?.firstName ?? '...'}
              {profile?.username && <span className="text-white/40 font-bold text-sm ml-1">@{profile.username}</span>}
            </h1>
            <div className="text-white/40 text-[11px] mt-0.5">
              {profile ? `Katılım: ${new Date(profile.createdAt).toLocaleDateString('tr-TR')}` : ''}
            </div>
          </div>

          {/* Quick stats row */}
          {profile && (
            <div className="flex gap-3 flex-wrap justify-center">
              {[
                { icon: '🪙', label: 'Coin', value: fmtNum(profile.coins) },
                { icon: '💵', label: 'TL', value: fmtNum(profile.balance) },
                { icon: '🔥', label: 'Streak', value: profile.streakCount },
                { icon: '✨', label: 'NFT', value: nfts.length },
              ].map(s => (
                <div key={s.label} className="flex flex-col items-center bg-black/30 rounded-xl px-3 py-1.5 border border-white/10">
                  <span className="text-base">{s.icon}</span>
                  <span className="text-white font-black text-sm">{s.value}</span>
                  <span className="text-white/40 text-[9px] font-bold">{s.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-shrink-0 flex gap-1 px-3 py-2" style={{ background: 'rgba(0,0,0,0.4)' }}>
        {(['nfts', 'stats'] as const).map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className="flex-1 py-1.5 rounded-xl font-black text-xs transition-all"
            style={activeTab === t
              ? { background: 'linear-gradient(135deg, #22c55e, #15803d)', color: 'white' }
              : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)' }}>
            {t === 'nfts' ? `✨ Koleksiyon (${nfts.length})` : '📊 İstatistikler'}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'nfts' && (
            <motion.div key="nfts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3">
              {loading ? (
                <div className="grid grid-cols-3 gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="rounded-2xl bg-white/5 animate-pulse" style={{ height: 110 }} />
                  ))}
                </div>
              ) : nfts.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center">
                  <span className="text-5xl">🃏</span>
                  <p className="text-white/40 font-bold text-sm">
                    {isMe ? 'Henüz NFT\'n yok.\nKasa aç veya çiftliğini geliştir!' : `${profile?.firstName ?? 'Bu kullanıcı'} henüz NFT kazanmamış.`}
                  </p>
                </div>
              ) : (
                <>
                  {/* Rarity filter pills */}
                  <div className="flex gap-1.5 mb-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {(['all', 'legendary', 'rare', 'special', 'common'] as const).map(f => {
                      const cnt = f === 'all' ? nfts.length : rarityCount(f);
                      if (f !== 'all' && cnt === 0) return null;
                      const r = f !== 'all' ? RARITY_STYLE[f] : null;
                      return (
                        <button key={f} onClick={() => setFilter(f)}
                          className="flex-shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black border transition-all"
                          style={filter === f
                            ? { background: r?.badge ?? '#374151', color: r?.text ?? 'white', borderColor: r?.border ?? '#6b7280' }
                            : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.12)' }}>
                          {f === 'all' ? `Tümü (${cnt})` : `${r?.label} (${cnt})`}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {filtered.map((nft, i) => (
                      <motion.div key={nft.id}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}>
                        <NftCard nft={nft} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Rarity breakdown */}
                  <div className="mt-4 rounded-2xl overflow-hidden border border-white/8"
                    style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <div className="px-3 py-2 text-white/40 text-[10px] font-black uppercase tracking-widest border-b border-white/6">
                      Koleksiyon Özeti
                    </div>
                    {(['legendary', 'rare', 'special', 'common'] as const).map(r => {
                      const cnt = rarityCount(r);
                      if (cnt === 0) return null;
                      const s = RARITY_STYLE[r];
                      return (
                        <div key={r} className="flex items-center gap-2 px-3 py-2 border-b border-white/5 last:border-0">
                          <div className="w-2 h-2 rounded-full" style={{ background: s.border, boxShadow: `0 0 6px ${s.glow}` }} />
                          <span className="font-bold text-xs flex-1" style={{ color: s.text }}>{s.label}</span>
                          <span className="font-black text-xs text-white">{cnt}</span>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ width: 60, background: 'rgba(255,255,255,0.1)' }}>
                            <div className="h-full rounded-full" style={{ width: `${(cnt / nfts.length) * 100}%`, background: s.border }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'stats' && profile && (
            <motion.div key="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-3 flex flex-col gap-2">
              {[
                { icon: '🪙', label: 'Toplam Coin', value: fmtNum(profile.coins), sub: 'tüm zamanlar' },
                { icon: '💵', label: 'TL Bakiye', value: fmtNum(profile.balance), sub: 'çiftlik geliri' },
                { icon: '🔥', label: 'Streak', value: `${profile.streakCount} gün`, sub: 'ardışık giriş' },
                { icon: '👥', label: 'Referans', value: profile.totalReferrals, sub: 'davet edilen' },
                { icon: '✨', label: 'NFT Sayısı', value: nfts.length, sub: 'koleksiyon' },
                { icon: '🏆', label: 'Efsanevi', value: rarityCount('legendary'), sub: 'legendary NFT' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 rounded-2xl px-4 py-3 border border-white/8"
                  style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <span className="text-2xl">{s.icon}</span>
                  <div className="flex-1">
                    <div className="text-white/50 text-[10px] font-bold">{s.label}</div>
                    <div className="text-white font-black text-base">{s.value}</div>
                  </div>
                  <div className="text-white/25 text-[10px] italic">{s.sub}</div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
