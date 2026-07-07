import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/use-user';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Star, ShoppingBag, Zap, RefreshCw } from 'lucide-react';

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
  const [tab, setTab] = useState<Tab>('buy');
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loadingPkg, setLoadingPkg] = useState<string | null>(null);
  const [loadingItem, setLoadingItem] = useState<string | null>(null);
  const [lastWon, setLastWon] = useState<{ emoji: string; name: string } | null>(null);

  useEffect(() => {
    fetch(`${API}/stars/coin-packages`).then(r => r.json()).then(setPackages).catch(() => {});
    fetch(`${API}/stars/coin-shop`).then(r => r.json()).then(setShopItems).catch(() => {});
  }, []);

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
              setTimeout(refresh, 1500);
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
      } else if (data.tlAdded) {
        toast.success(`💰 +${data.tlAdded.toLocaleString()} TL bakiyene eklendi!`);
      } else if (data.nftWon) {
        setLastWon({ emoji: data.nftWon.emoji, name: data.nftWon.name });
        toast.success(`💎 NFT kazandın: ${data.nftWon.emoji} ${data.nftWon.name}!`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Satın alma başarısız');
    } finally {
      setLoadingItem(null);
    }
  };

  const coins = user?.coins ?? 0;

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
        <AnimatePresence mode="wait">

          {/* ── Tab: Buy Coins with Stars ──────────────────────────────── */}
          {tab === 'buy' && (
            <motion.div key="buy" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
              className="p-4 flex flex-col gap-3">

              {/* Info box */}
              <div className="bg-blue-900/30 border border-blue-500/30 rounded-2xl p-3 flex items-start gap-2.5">
                <span className="text-xl flex-shrink-0">ℹ️</span>
                <div className="text-blue-200 text-[11px] font-bold leading-relaxed">
                  Telegram Stars ile Coin satın al. Coin'lerini oyun içi ödüller, TL bonusu ve ücretsiz NFT kasaları için harca!
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
                const canAfford = coins >= item.coins;
                const isLoading = loadingItem === item.id;
                return (
                  <motion.div
                    key={item.id}
                    whileTap={canAfford ? { scale: 0.97 } : {}}
                    className="rounded-2xl overflow-hidden"
                    style={{
                      background: canAfford
                        ? 'linear-gradient(135deg, #1a2e1a, #162816)'
                        : 'linear-gradient(135deg, #1a1a1a, #111)',
                      border: canAfford ? '1px solid rgba(74,200,74,0.3)' : '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <button
                      onClick={() => handleBuyItem(item)}
                      disabled={!canAfford || isLoading}
                      className="w-full flex items-center gap-3 px-4 py-3.5"
                    >
                      {/* Emoji */}
                      <div className="text-3xl flex-shrink-0 w-10 text-center">{item.emoji}</div>

                      {/* Info */}
                      <div className="flex-1 text-left">
                        <div className="font-black text-white text-sm">{item.label}</div>
                        <div className="text-white/50 text-[10px] font-bold mt-0.5">{item.desc}</div>
                      </div>

                      {/* Price + CTA */}
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm">🪙</span>
                          <span className={`font-black text-base ${canAfford ? 'text-yellow-300' : 'text-white/30'}`}>{item.coins}</span>
                        </div>
                        {isLoading ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}>
                            <RefreshCw size={14} className="text-green-400" />
                          </motion.div>
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
