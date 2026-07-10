import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/use-user';
import { useGetReferralStats } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Star, ShoppingBag, Zap, RefreshCw, Lock } from 'lucide-react';
import { AUTO_SELL_PURCHASED_KEY } from '../hooks/use-game-engine';
import { useLocation } from 'wouter';
import { formatNum } from '../utils/format';

/* ── Coin → TL converter teaser — moved here from the farm view (was
   cluttering Çiftlik); this is the natural home since Coin→TL conversion
   itself lives in the "Coin Harca" tab below. Tapping jumps straight to it. ── */
function CoinConverterTeaser({ coins, onOpen }: { coins: number; onOpen: () => void }) {
  const [rate, setRate] = useState<{ rate: number; minCoins: number } | null>(null);
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}api/stars/coin-convert-rate`).then(r => r.json()).then(setRate).catch(() => {});
  }, []);
  const tlEquivalent = rate ? Math.floor(coins) * rate.rate : 0;
  const canConvert = rate ? coins >= rate.minCoins : false;

  return (
    <motion.button
      onClick={onOpen}
      className="relative mx-4 mt-3 w-[calc(100%-2rem)] rounded-2xl overflow-hidden text-left"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      style={{
        background: 'linear-gradient(120deg, #1a2e1a 0%, #163d1e 45%, #1a3320 100%)',
        border: '1.5px solid rgba(74,222,128,0.35)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 0 22px rgba(74,222,128,0.12)',
      }}
    >
      {/* Drifting coin particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
        {[...Array(6)].map((_, i) => (
          <motion.span
            key={i}
            className="absolute text-xs"
            style={{ left: `${(i * 17 + 6) % 100}%`, top: '110%' }}
            animate={{ top: ['110%', '-15%'], opacity: [0, 0.9, 0], rotate: [0, 45] }}
            transition={{ repeat: Infinity, duration: 4 + (i % 3), delay: i * 0.6, ease: 'linear' }}
          >🪙</motion.span>
        ))}
      </div>

      <div className="relative z-10 flex items-center gap-3 px-3.5 py-3">
        {/* Icon badge with pulsing glow */}
        <motion.div
          className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)', border: '1.5px solid #4ade80' }}
          animate={{ boxShadow: ['0 0 6px rgba(74,222,128,0.3)', '0 0 18px rgba(74,222,128,0.6)', '0 0 6px rgba(74,222,128,0.3)'] }}
          transition={{ repeat: Infinity, duration: 2.2 }}
        >
          <span style={{ fontSize: 20 }}>💵</span>
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-black text-white text-[12px]">Coin'i TL'ye Çevir</span>
            <motion.span animate={{ x: [0, 3, 0] }} transition={{ repeat: Infinity, duration: 1.2 }} className="text-green-400 text-[11px]">→</motion.span>
          </div>
          <div className="text-white/50 text-[10px] font-bold mt-0.5">
            🪙 {formatNum(Math.floor(coins))} Coin biriktin
            {rate && (
              <span className="text-green-400"> · ≈ {tlEquivalent.toFixed(2)} TL değerinde</span>
            )}
          </div>
        </div>

        <div
          className="flex-shrink-0 px-3 py-1.5 rounded-xl font-black text-[11px]"
          style={canConvert
            ? { background: 'linear-gradient(135deg, #4ade80, #16a34a)', color: '#052e0f' }
            : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
        >
          {canConvert ? 'Çevir' : rate ? `Min. ${rate.minCoins}` : '...'}
        </div>
      </div>
    </motion.button>
  );
}

function readLocalCoins(): number {
  try {
    const saved = localStorage.getItem('farmGameState_v8');
    if (saved) {
      const parsed = JSON.parse(saved);
      return Math.floor(parsed.coins ?? 0);
    }
  } catch { /* */ }
  return 0;
}

const API = `${import.meta.env.BASE_URL}api`;

interface CoinPackage {
  id: string;
  stars: number;
  coins: number;
  label: string;
  bonus: string;
  popular: boolean;
}

interface ShopItem {
  id: string;
  coins: number;
  emoji: string;
  label: string;
  desc: string;
  action: string;
}

type Tab = 'buy' | 'spend';

export default function StarsShopPage() {
  const { user, telegramId, refresh } = useUser();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>('buy');
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [lastWon, setLastWon] = useState<{ emoji: string; name: string } | null>(null);
  const [autoSellOwned, setAutoSellOwned] = useState<boolean>(() => {
    try { return localStorage.getItem(AUTO_SELL_PURCHASED_KEY) === 'true'; } catch { return false; }
  });
  const [convertRate, setConvertRate] = useState<{ rate: number; minCoins: number } | null>(null);
  const [convertAmount, setConvertAmount] = useState('');
  const [converting, setConverting] = useState(false);
  const [localCoins, setLocalCoins] = useState<number>(() => readLocalCoins());

  const { data: referralStats } = useGetReferralStats(telegramId);
  const hasInvite = (referralStats?.totalReferrals ?? 0) >= 1;

  useEffect(() => {
    fetch(`${API}/stars/coin-packages`).then(r => r.json()).then(setPackages).catch(() => {});
    fetch(`${API}/stars/coin-shop`).then(r => r.json()).then(setShopItems).catch(() => {});
    fetch(`${API}/stars/coin-convert-rate`).then(r => r.json()).then(setConvertRate).catch(() => {});
  }, []);

  // Refresh local coins every 5s to stay in sync with game engine
  useEffect(() => {
    const id = setInterval(() => setLocalCoins(readLocalCoins()), 5000);
    return () => clearInterval(id);
  }, []);

  // ── Convert Coins → TL ──────────────────────────────────────────────────
  const handleConvert = async () => {
    if (!telegramId || !convertRate) return;
    const amount = parseInt(convertAmount, 10);
    if (!Number.isFinite(amount) || amount < convertRate.minCoins) {
      toast.error(`En az ${convertRate.minCoins} Coin girmelisin`);
      return;
    }
    if (amount > coins) {
      toast.error('Yetersiz Coin bakiyesi');
      return;
    }
    setConverting(true);
    try {
      const res = await fetch(`${API}/stars/convert-coins-to-tl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, coins: amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Hata oluştu');
      toast.success(`💵 ${data.tlReceived} TL bakiyene eklendi!`);
      setConvertAmount('');
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'Çevirme başarısız');
    } finally {
      setConverting(false);
    }
  };

  // ── Buy Coins with Stars ──────────────────────────────────────────────────
  const handleBuyCoins = async (pkg: CoinPackage) => {
    if (!telegramId) return;
    setLoadingPkg(pkg.id);
    try {
      const res = await fetch(`${API}/stars/buy-coins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, packageId: pkg.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Hata oluştu');

      if (data.devMode) {
        toast.success(`🛠️ Dev mode: ${data.coinsGranted} Coin eklendi!`);
        refresh();
        return;
      }

      if (data.invoiceLink) {
        if (window.Telegram?.WebApp?.openInvoice) {
          window.Telegram.WebApp.openInvoice(data.invoiceLink, (status: string) => {
            if (status === 'paid') {
              toast.success(`🎉 ${pkg.coins} Coin hesabına eklendi!`);
              // Webhook grants coins async — poll balance instead of a single fixed wait,
              // so the UI updates the moment the backend has processed the payment.
              const startCoins = user?.coins ?? 0;
              let attempts = 0;
              const poll = async () => {
                attempts += 1;
                const updated = await refresh();
                const newCoins = (updated as any)?.coins ?? undefined;
                if (newCoins !== undefined && newCoins > startCoins) return;
                if (attempts < 10) setTimeout(poll, 800);
              };
              setTimeout(poll, 400);
            } else if (status === 'cancelled') {
              toast.info('Ödeme iptal edildi.');
            } else {
              toast.error('Ödeme tamamlanamadı.');
            }
          });
        } else {
          window.open(data.invoiceLink, '_blank');
        }
      }
    } catch (e: any) {
      toast.error(e.message || 'Satın alma başarısız');
    } finally {
      setLoadingPkg(null);
    }
  };

  // ── Spend Coins on Shop Item ──────────────────────────────────────────────
  const handleBuyItem = async (item: ShopItem) => {
    if (!telegramId) return;
    if ((user?.coins ?? 0) < item.coins) {
      toast.error(`Yetersiz Coin! ${item.coins} Coin gerekiyor.`);
      return;
    }
    setLoadingItem(item.id);
    try {
      const res = await fetch(`${API}/stars/coin-shop/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, itemId: item.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Hata oluştu');

      refresh();

      if (data.spinReset) {
        toast.success('🎡 Çark hakkın sıfırlandı! Hemen çevir!');
      } else if (data.nftWon) {
        setLastWon({ emoji: data.nftWon.emoji, name: data.nftWon.name });
        toast.success(`💎 NFT kazandın: ${data.nftWon.emoji} ${data.nftWon.name}!`);
      } else if (data.autoSellUnlocked) {
        try { localStorage.setItem(AUTO_SELL_PURCHASED_KEY, 'true'); } catch { /* */ }
        try { localStorage.setItem('farmAutoSell_v1', 'true'); } catch { /* */ }
        setAutoSellOwned(true);
        toast.success('🤖 Otomatik Satış aktif edildi! Ürünlerin artık otomatik satılacak!');
      }
    } catch (e: any) {
      toast.error(e.message || 'Satın alma başarısız');
    } finally {
      setLoadingItem(null);
    }
  };

  // Use the higher of server or local coins for display — the local game engine
  // may have unsyced coins not yet pushed to the server (10s sync interval).
  const serverCoins = user?.coins ?? 0;
  const coins = Math.max(serverCoins, localCoins);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="relative overflow-hidden flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #1a0533 0%, #2d1060 50%, #0d2060 100%)' }}>
        {/* Stars bg */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(18)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute text-yellow-300"
              style={{ left: `${(i * 37 + 11) % 100}%`, top: `${(i * 53 + 7) % 80}%`, fontSize: `${8 + (i % 4) * 4}px`, opacity: 0.3 + (i % 3) * 0.2 }}
              animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.3, 1] }}
              transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
            >⭐</motion.div>
          ))}
        </div>
        <div className="relative z-10 px-4 pt-5 pb-4">
          {/* Coin balance pill */}
          <div className="flex justify-center mb-3">
            <motion.div
              className="bg-black/40 border border-yellow-400/40 rounded-full px-5 py-2 flex items-center gap-2"
              animate={{ boxShadow: ['0 0 8px rgba(245,200,66,0.2)', '0 0 20px rgba(245,200,66,0.5)', '0 0 8px rgba(245,200,66,0.2)'] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              <span className="text-xl">🪙</span>
              <span className="font-black text-yellow-300 text-xl tabular-nums">{coins.toLocaleString()}</span>
              <span className="text-yellow-200/60 text-sm font-bold">Coin</span>
            </motion.div>
          </div>
          <div className="text-center">
            <div className="font-black text-white text-lg flex items-center justify-center gap-2">
              <Star className="fill-yellow-400 text-yellow-400" size={20} />
              Coin Mağazası
            </div>
            <div className="text-purple-200 text-xs font-bold mt-0.5 opacity-80">
              Star harca, Coin kazan — Coin harca, ödül al!
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="relative z-10 flex mx-4 mb-0 gap-2 pb-0">
          {([
            { id: 'buy',   label: '⭐ Coin Satın Al',   icon: Star     },
            { id: 'spend', label: '🛍️ Coin Harca',       icon: ShoppingBag },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex-1 py-2.5 rounded-t-xl font-black text-sm transition-all"
              style={tab === t.id
                ? { background: '#0f0f1a', color: '#f5c842', borderBottom: '2px solid #f5c842' }
                : { background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
            >{t.label}</button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ background: '#0f0f1a' }}>
        {/* Coin → TL teaser — moved here from the farm screen; jumps straight
            to the full converter below (in the "Coin Harca" tab). */}
        <CoinConverterTeaser coins={coins} onOpen={() => setTab('spend')} />

        <AnimatePresence mode="wait">

          {/* ── Tab: Buy Coins with Stars ──────────────────────────────── */}
          {tab === 'buy' && (
            <motion.div key="buy" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="p-4 flex flex-col gap-3">

              {/* Info box */}
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-3 flex items-start gap-2.5">
                <span className="text-xl flex-shrink-0">ℹ️</span>
                <div className="text-blue-200 text-[11px] font-bold leading-relaxed">
                  Telegram Stars ile Coin satın al. Coin'lerini oyun içi ödüller, TL'ye çevirme veya ücretsiz NFT kasaları için harca!
                </div>
              </div>

              {packages.map((pkg) => (
                <motion.div
                  key={pkg.id}
                  whileTap={{ scale: 0.97 }}
                  className="relative rounded-2xl overflow-hidden"
                  style={{
                    background: pkg.popular
                      ? 'linear-gradient(135deg, #3b1d6e, #1a3a70)'
                      : 'linear-gradient(135deg, #1a1a2e, #16213e)',
                    border: pkg.popular ? '2px solid #f5c842' : '1px solid rgba(255,255,255,0.1)',
                    boxShadow: pkg.popular ? '0 0 24px rgba(245,200,66,0.25)' : 'none',
                  }}
                >
                  {pkg.popular && (
                    <div className="absolute top-0 right-0 bg-yellow-400 text-yellow-900 text-[9px] font-black px-3 py-1 rounded-bl-xl">
                      🔥 EN POPÜLER
                    </div>
                  )}
                  {pkg.bonus && (
                    <div className="absolute top-0 left-0 bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-br-xl">
                      {pkg.bonus}
                    </div>
                  )}
                  <button
                    onClick={() => handleBuyCoins(pkg)}
                    disabled={loadingPkg === pkg.id}
                    className="w-full flex items-center gap-4 px-4 py-4 active:opacity-80"
                  >
                    {/* Stars side */}
                    <div className="flex flex-col items-center flex-shrink-0 w-16">
                      <motion.div
                        className="text-3xl"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 3, delay: Math.random() * 2 }}
                      >⭐</motion.div>
                      <div className="font-black text-yellow-300 text-base mt-0.5">{pkg.stars}</div>
                      <div className="text-yellow-200/60 text-[9px] font-bold">Stars</div>
                    </div>

                    {/* Arrow */}
                    <div className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className="text-white/30 font-bold text-lg">→</div>
                    </div>

                    {/* Coins side */}
                    <div className="flex flex-col items-start flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-2xl">🪙</span>
                        <span className="font-black text-white text-2xl">{pkg.coins.toLocaleString()}</span>
                      </div>
                      <div className="text-white/50 text-[10px] font-bold mt-0.5">{pkg.label} paketi</div>
                    </div>

                    {/* CTA */}
                    <div className="flex-shrink-0">
                      {loadingPkg === pkg.id ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}>
                          <RefreshCw size={20} className="text-yellow-400" />
                        </motion.div>
                      ) : (
                        <div className="px-3 py-2 rounded-xl font-black text-sm"
                          style={{ background: pkg.popular ? 'linear-gradient(135deg, #f5c842, #e6a800)' : 'rgba(255,255,255,0.1)', color: pkg.popular ? '#1a0533' : 'white' }}>
                          Al
                        </div>
                      )}
                    </div>
                  </button>
                </motion.div>
              ))}

              {/* Telegram Stars info */}
              <div className="bg-white/5 rounded-2xl p-3 text-center mt-1">
                <div className="text-white/40 text-[10px] font-bold leading-relaxed">
                  ⭐ Telegram Stars, Telegram'ın resmi ödeme sistemidir.<br/>
                  Satın almak için botu açarak ödeme ekranını kullanabilirsin.
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Tab: Coin Shop ─────────────────────────────────────────── */}
          {tab === 'spend' && (
            <motion.div key="spend" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="p-4 flex flex-col gap-3">

              <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-2xl p-3 flex items-start gap-2.5">
                <span className="text-xl flex-shrink-0">💡</span>
                <div className="text-yellow-200 text-[11px] font-bold leading-relaxed">
                  Coin'lerini harca, anında ödül kazan! TL bonusu, ekstra çark hakkı veya ücretsiz NFT kasası açabilirsin.
                </div>
              </div>

              {shopItems.map((item) => {
                const isOwned = item.id === 'auto_sell' && autoSellOwned;
                const canAfford = !isOwned && coins >= item.coins;
                const isLoading = loadingItem === item.id;
                return (
                  <motion.div
                    key={item.id}
                    whileTap={canAfford ? { scale: 0.97 } : {}}
                    className="rounded-2xl overflow-hidden relative"
                    style={{
                      background: isOwned
                        ? 'linear-gradient(135deg, #0f2d1a, #0a1f12)'
                        : canAfford
                          ? 'linear-gradient(135deg, #1a2e1a, #162816)'
                          : 'linear-gradient(135deg, #1a1a1a, #111)',
                      border: isOwned
                        ? '1.5px solid rgba(74,222,128,0.5)'
                        : canAfford ? '1px solid rgba(74,200,74,0.3)' : '1px solid rgba(255,255,255,0.06)',
                      boxShadow: isOwned ? '0 0 12px rgba(74,222,128,0.15)' : 'none',
                    }}
                  >
                    {/* Owned badge */}
                    {isOwned && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-bl-xl flex items-center gap-1">
                        ✓ ALINDI
                      </div>
                    )}
                    <button
                      onClick={() => !isOwned && handleBuyItem(item)}
                      disabled={isOwned || (!canAfford) || isLoading}
                      className="w-full flex items-center gap-3 px-4 py-3.5"
                    >
                      {/* Emoji */}
                      <div className="text-3xl flex-shrink-0 w-10 text-center">{item.emoji}</div>

                      {/* Info */}
                      <div className="flex-1 text-left">
                        <div className="font-black text-sm" style={{ color: isOwned ? '#4ade80' : 'white' }}>{item.label}</div>
                        <div className="text-white/50 text-[10px] font-bold mt-0.5">{item.desc}</div>
                        {isOwned && (
                          <div className="text-green-400 text-[9px] font-black mt-0.5">🤖 Aktif — ürünler otomatik satılıyor</div>
                        )}
                      </div>

                      {/* Price + CTA */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {!isOwned && (
                          <div className="flex items-center gap-1">
                            <span className="text-sm">🪙</span>
                            <span className={`font-black text-base ${canAfford ? 'text-yellow-300' : 'text-white/30'}`}>{item.coins}</span>
                          </div>
                        )}
                        {isLoading ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}>
                            <RefreshCw size={14} className="text-green-400" />
                          </motion.div>
                        ) : isOwned ? (
                          <div className="px-2.5 py-1 rounded-lg text-[11px] font-black"
                            style={{ background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                            ✓ Aktif
                          </div>
                        ) : (
                          <div className="px-2.5 py-1 rounded-lg text-[11px] font-black"
                            style={canAfford
                              ? { background: 'linear-gradient(135deg, #22c55e, #15803d)', color: 'white' }
                              : { background: '#1f2937', color: '#4b5563' }}>
                            {canAfford ? 'Satın Al' : 'Yetersiz'}
                          </div>
                        )}
                      </div>
                    </button>
                  </motion.div>
                );
              })}

              {/* Coin → TL Converter — gated behind first invite */}
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1a2e1a, #162816)', border: `1px solid ${hasInvite ? 'rgba(74,200,74,0.3)' : 'rgba(255,200,0,0.25)'}` }}>

                {!hasInvite ? (
                  /* 🔒 Invite gate */
                  <div className="p-4 flex flex-col items-center gap-3 text-center">
                    <motion.div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(255,200,0,0.12)', border: '2px solid rgba(255,200,0,0.35)' }}
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Lock size={24} className="text-yellow-400" />
                    </motion.div>
                    <div>
                      <div className="font-black text-white text-sm mb-1">💵 Coin → TL Dönüşümü Kilitli</div>
                      <div className="text-yellow-300/80 text-[11px] font-bold leading-relaxed">
                        Bu özelliği açmak için en az <span className="text-yellow-300 font-black">1 arkadaşını davet etmelisin!</span>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => navigate('/invite')}
                      className="w-full py-3 rounded-xl font-black text-sm"
                      style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)', color: '#451a00' }}
                      whileTap={{ scale: 0.97 }}
                    >
                      👥 Arkadaş Davet Et → Kilidi Aç
                    </motion.button>
                  </div>
                ) : (
                  /* ✅ Conversion UI */
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">💵</span>
                      <div className="font-black text-white text-sm">Coin'i TL'ye Çevir</div>
                      <div className="ml-auto text-[9px] font-black text-green-400 bg-green-900/30 border border-green-600/30 rounded-full px-2 py-0.5">✓ Açık</div>
                    </div>
                    <div className="text-white/50 text-[10px] font-bold mb-3 leading-relaxed">
                      Coin'lerini anında çekilebilir TL bakiyesine çevir.
                      {convertRate ? ` (${convertRate.minCoins}+ Coin, oran: 1.000 Coin ≈ ${(convertRate.rate * 1000).toFixed(2)} TL)` : ''}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        inputMode="numeric"
                        value={convertAmount}
                        onChange={(e) => setConvertAmount(e.target.value)}
                        placeholder={convertRate ? `Min. ${convertRate.minCoins}` : '...'}
                        className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white font-black text-sm outline-none"
                      />
                      <button
                        onClick={handleConvert}
                        disabled={converting || !convertRate}
                        className="px-4 py-2.5 rounded-xl font-black text-sm text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #22c55e, #15803d)' }}
                      >
                        {converting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}>
                            <RefreshCw size={16} />
                          </motion.div>
                        ) : 'Çevir'}
                      </button>
                    </div>
                    {convertRate && convertAmount && !isNaN(parseInt(convertAmount, 10)) && (
                      <div className="text-green-400 text-[10px] font-bold mt-2">
                        ≈ {(Math.floor(parseInt(convertAmount, 10) * convertRate.rate * 100) / 100).toFixed(2)} TL alacaksın
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Won NFT mini-alert */}
              <AnimatePresence>
                {lastWon && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-yellow-900 border-2 border-yellow-400 rounded-2xl px-5 py-3 text-center shadow-2xl"
                    onClick={() => setLastWon(null)}
                  >
                    <div className="text-4xl mb-1">{lastWon.emoji}</div>
                    <div className="font-black text-yellow-300 text-sm">{lastWon.name}</div>
                    <div className="text-yellow-200/60 text-[10px] font-bold">NFT koleksiyonuna eklendi!</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
