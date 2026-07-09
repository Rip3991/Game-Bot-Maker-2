import React, { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useUser } from '../hooks/use-user';
import { SECTIONS, SPECIAL_ITEMS } from '../hooks/use-game-engine';

const API = `${import.meta.env.BASE_URL}api`;
const SAVE_KEY = 'farmGameState_v8';

// ── localStorage helpers ───────────────────────────────────────────────────────

function readLocalItems() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return { regular: {} as Record<string, number>, special: {} as Record<string, number> };
    const p = JSON.parse(raw);
    return { regular: (p.storage ?? {}) as Record<string, number>, special: (p.specialStorage ?? {}) as Record<string, number> };
  } catch { return { regular: {}, special: {} }; }
}

function patchLocalStorage(fn: (state: Record<string, unknown>) => Record<string, unknown>) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    const s = raw ? JSON.parse(raw) : {};
    localStorage.setItem(SAVE_KEY, JSON.stringify(fn(s)));
  } catch {}
}

function deductLocalItem(itemId: string, qty: number, isSpecial: boolean) {
  patchLocalStorage(s => {
    if (isSpecial) {
      const sp = { ...((s.specialStorage as Record<string, number>) ?? {}) };
      sp[itemId] = Math.max(0, (sp[itemId] ?? 0) - qty);
      return { ...s, specialStorage: sp };
    } else {
      const st = { ...((s.storage as Record<string, number>) ?? {}) };
      st[itemId] = Math.max(0, (st[itemId] ?? 0) - qty);
      return { ...s, storage: st };
    }
  });
}

function addLocalItem(itemId: string, qty: number, isSpecial: boolean) {
  patchLocalStorage(s => {
    if (isSpecial) {
      const sp = { ...((s.specialStorage as Record<string, number>) ?? {}) };
      sp[itemId] = (sp[itemId] ?? 0) + qty;
      return { ...s, specialStorage: sp };
    } else {
      const st = { ...((s.storage as Record<string, number>) ?? {}) };
      st[itemId] = (st[itemId] ?? 0) + qty;
      return { ...s, storage: st };
    }
  });
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface ListingItem {
  id: string;
  emoji: string;
  name: string;
  qty: number;
  isSpecial: boolean;
}

interface Listing {
  id: string;
  sellerId: string;
  sellerName: string;
  itemId: string;
  itemEmoji: string;
  itemName: string;
  quantity: number;
  priceCoins: number;
  isSpecial: boolean;
  status: string;
  createdAt: string;
}

// ── Rarity badge ──────────────────────────────────────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  uncommon: '#22c55e',
  rare: '#a855f7',
  epic: '#f59e0b',
};

function RarityBadge({ rarity }: { rarity: string }) {
  const color = RARITY_COLORS[rarity] ?? '#6b7280';
  const label = rarity === 'uncommon' ? 'Sıradan Dışı' : rarity === 'rare' ? 'Nadir' : 'Efsanevi';
  return (
    <span style={{
      fontSize: 9, fontWeight: 900, letterSpacing: 0.5, padding: '1px 5px',
      borderRadius: 6, border: `1px solid ${color}`, color, background: `${color}22`,
    }}>{label}</span>
  );
}

// ── Listing card ──────────────────────────────────────────────────────────────

function ListingCard({
  listing, isMine, onBuy, onCancel, buyingId,
}: {
  listing: Listing;
  isMine: boolean;
  onBuy: (id: string) => void;
  onCancel: (id: string, itemId: string, qty: number, isSpecial: boolean) => void;
  buyingId: string | null;
}) {
  const specialItem = SPECIAL_ITEMS.find(s => s.id === listing.itemId);
  const rarity = specialItem?.rarity ?? null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        background: listing.isSpecial
          ? 'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(167,139,250,0.12) 100%)'
          : 'rgba(0,0,0,0.28)',
        border: listing.isSpecial ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(74,122,47,0.25)',
        borderRadius: 12, padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}
    >
      {/* Emoji */}
      <div style={{
        width: 44, height: 44, borderRadius: 10, flexShrink: 0,
        background: listing.isSpecial ? 'rgba(245,158,11,0.15)' : 'rgba(74,122,47,0.15)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
      }}>
        {listing.itemEmoji}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <span style={{ color: '#e8f5e0', fontWeight: 800, fontSize: 13 }}>{listing.itemName}</span>
          {rarity && <RarityBadge rarity={rarity} />}
        </div>
        <div style={{ color: 'rgba(200,230,160,0.6)', fontSize: 11, marginTop: 1 }}>
          {listing.sellerName} · {listing.quantity} adet
        </div>
        <div style={{ color: '#fbbf24', fontWeight: 900, fontSize: 14, marginTop: 2 }}>
          🪙 {listing.priceCoins.toLocaleString()}
        </div>
      </div>

      {/* Action button */}
      {isMine ? (
        <button
          onClick={() => onCancel(listing.id, listing.itemId, listing.quantity, listing.isSpecial)}
          style={{
            padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.4)',
            background: 'rgba(239,68,68,0.15)', color: '#f87171',
            fontSize: 11, fontWeight: 800, cursor: 'pointer', flexShrink: 0,
          }}
        >
          İptal
        </button>
      ) : (
        <button
          onClick={() => onBuy(listing.id)}
          disabled={buyingId === listing.id}
          style={{
            padding: '8px 12px', borderRadius: 8, border: 'none',
            background: buyingId === listing.id
              ? 'rgba(74,122,47,0.4)'
              : 'linear-gradient(135deg, #4ade80, #22c55e)',
            color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer',
            flexShrink: 0, opacity: buyingId === listing.id ? 0.6 : 1,
          }}
        >
          {buyingId === listing.id ? '...' : 'Al'}
        </button>
      )}
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function TradePage() {
  const { telegramId, user } = useUser();
  const [tab, setTab] = useState<'market' | 'mine'>('market');
  const [localItems, setLocalItems] = useState(() => readLocalItems());
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'regular' | 'special'>('regular');
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [priceCoins, setPriceCoins] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  const sellerName = user?.firstName ?? 'Çiftçi';

  const refreshLocal = useCallback(() => setLocalItems(readLocalItems()), []);
  useEffect(() => {
    window.addEventListener('focus', refreshLocal);
    return () => window.removeEventListener('focus', refreshLocal);
  }, [refreshLocal]);

  // Fetch market (others' listings)
  const { data: marketData, refetch: refetchMarket, isLoading: marketLoading } = useQuery({
    queryKey: ['trades-market', telegramId],
    queryFn: async () => {
      const res = await fetch(`${API}/trades?excludeId=${encodeURIComponent(telegramId)}`);
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json() as Promise<{ listings: Listing[] }>;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Fetch my listings
  const { data: myData, refetch: refetchMine, isLoading: mineLoading } = useQuery({
    queryKey: ['trades-mine', telegramId],
    queryFn: async () => {
      const res = await fetch(`${API}/trades/mine?sellerId=${encodeURIComponent(telegramId)}`);
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json() as Promise<{ listings: Listing[] }>;
    },
    refetchInterval: 30000,
  });

  // Build available items for listing
  const regularListable: ListingItem[] = SECTIONS
    .filter(s => Math.floor(localItems.regular[s.id] ?? 0) >= 1)
    .map(s => ({ id: s.id, emoji: s.emoji, name: s.name, qty: Math.floor(localItems.regular[s.id] ?? 0), isSpecial: false }));

  const specialListable: ListingItem[] = SPECIAL_ITEMS
    .filter(s => (localItems.special[s.id] ?? 0) >= 1)
    .map(s => ({ id: s.id, emoji: s.emoji, name: s.name, qty: Math.floor(localItems.special[s.id] ?? 0), isSpecial: true }));

  const totalSpecialCount = SPECIAL_ITEMS.reduce((sum, s) => sum + Math.floor(localItems.special[s.id] ?? 0), 0);

  async function createListing() {
    if (!selectedItem || !priceCoins) return;
    const price = parseInt(priceCoins.replace(/\D/g, ''));
    if (isNaN(price) || price <= 0) { toast.error('Geçerli fiyat girin'); return; }
    if (quantity < 1 || quantity > selectedItem.qty) { toast.error('Geçersiz miktar'); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API}/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: telegramId,
          sellerName,
          itemId: selectedItem.id,
          itemEmoji: selectedItem.emoji,
          itemName: selectedItem.name,
          quantity,
          priceCoins: price,
          isSpecial: selectedItem.isSpecial,
        }),
      });
      if (res.ok) {
        deductLocalItem(selectedItem.id, quantity, selectedItem.isSpecial);
        refreshLocal();
        setShowModal(false);
        setSelectedItem(null);
        setPriceCoins('');
        setQuantity(1);
        refetchMine();
        toast.success(`${selectedItem.emoji} İlan oluşturuldu!`);
        setTab('mine');
      } else {
        const err = await res.json();
        toast.error(err.error ?? 'Hata oluştu');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function buyListing(id: string) {
    setBuyingId(id);
    try {
      const res = await fetch(`${API}/trades/${id}/buy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: telegramId, buyerName: sellerName }),
      });
      if (res.ok) {
        const data = await res.json();
        addLocalItem(data.itemId, data.quantity, data.isSpecial);
        refreshLocal();
        refetchMarket();
        toast.success(`${data.itemEmoji} ${data.quantity}x ${data.itemName} alındı!`);
      } else {
        const err = await res.json();
        toast.error(err.error ?? 'Satın alma başarısız');
      }
    } finally {
      setBuyingId(null);
    }
  }

  async function cancelListing(id: string, itemId: string, qty: number, isSpecial: boolean) {
    const res = await fetch(`${API}/trades/${id}?sellerId=${encodeURIComponent(telegramId)}`, { method: 'DELETE' });
    if (res.ok) {
      addLocalItem(itemId, qty, isSpecial);
      refreshLocal();
      refetchMine();
      toast.success('İlan iptal edildi, ürünler iade edildi');
    } else {
      const err = await res.json();
      toast.error(err.error ?? 'İptal başarısız');
    }
  }

  const marketListings = marketData?.listings ?? [];
  const myListings = myData?.listings ?? [];

  return (
    <div style={{
      height: '100%', display: 'flex', flexDirection: 'column', overflowY: 'auto',
      background: 'linear-gradient(180deg, #1a3d0a 0%, #0d2205 100%)',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 14px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <span style={{ fontSize: 22 }}>🤝</span>
          <div>
            <div style={{ color: '#e8f5e0', fontWeight: 900, fontSize: 16 }}>Takas Pazarı</div>
            <div style={{ color: 'rgba(200,230,160,0.55)', fontSize: 11 }}>Ürün sat · özel eşya takas et</div>
          </div>
          {totalSpecialCount > 0 && (
            <div style={{
              marginLeft: 'auto', background: 'linear-gradient(135deg,#f59e0b,#d97706)',
              borderRadius: 12, padding: '4px 10px', fontSize: 11, fontWeight: 900, color: '#fff',
            }}>
              ✨ {totalSpecialCount} özel
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 6, background: 'rgba(0,0,0,0.25)',
          borderRadius: 10, padding: 4,
        }}>
          {([['market', '🏪 Pazar'], ['mine', '📋 İlanlarım']] as const).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '7px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: 12,
                background: tab === t ? 'linear-gradient(135deg,#3d8b1c,#2a6010)' : 'transparent',
                color: tab === t ? '#a8ff78' : 'rgba(180,220,140,0.5)',
                boxShadow: tab === t ? '0 2px 0 #1a4008' : 'none',
              }}
            >
              {label}
              {t === 'mine' && myListings.length > 0 && (
                <span style={{
                  marginLeft: 5, background: '#ef4444', color: '#fff', borderRadius: '50%',
                  width: 16, height: 16, display: 'inline-flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 9, fontWeight: 900,
                }}>
                  {myListings.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '10px 14px 80px', overflowY: 'auto' }}>
        {tab === 'market' ? (
          <>
            {marketLoading ? (
              <div style={{ textAlign: 'center', color: 'rgba(200,230,160,0.5)', padding: 40 }}>
                <div style={{ fontSize: 32 }}>🔄</div>
                <div style={{ marginTop: 8, fontSize: 13 }}>Yükleniyor...</div>
              </div>
            ) : marketListings.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(200,230,160,0.45)', padding: 40 }}>
                <div style={{ fontSize: 40 }}>🏪</div>
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700 }}>Pazar Boş</div>
                <div style={{ marginTop: 4, fontSize: 12 }}>Henüz başka oyuncuların ilanı yok</div>
                <div style={{ marginTop: 4, fontSize: 12 }}>İlk ilanı sen oluştur!</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AnimatePresence>
                  {marketListings.map(l => (
                    <ListingCard key={l.id} listing={l} isMine={false} onBuy={buyListing} onCancel={cancelListing} buyingId={buyingId} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        ) : (
          <>
            {mineLoading ? (
              <div style={{ textAlign: 'center', color: 'rgba(200,230,160,0.5)', padding: 40 }}>
                <div style={{ fontSize: 32 }}>🔄</div>
                <div style={{ marginTop: 8, fontSize: 13 }}>Yükleniyor...</div>
              </div>
            ) : myListings.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(200,230,160,0.45)', padding: 40 }}>
                <div style={{ fontSize: 40 }}>📋</div>
                <div style={{ marginTop: 8, fontSize: 14, fontWeight: 700 }}>İlanın Yok</div>
                <div style={{ marginTop: 4, fontSize: 12 }}>Depodaki ürünleri satışa çıkar</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AnimatePresence>
                  {myListings.map(l => (
                    <ListingCard key={l.id} listing={l} isMine={true} onBuy={buyListing} onCancel={cancelListing} buyingId={buyingId} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating "Listele" button */}
      <div style={{
        position: 'absolute', bottom: 16, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => { setShowModal(true); setSelectedItem(null); setPriceCoins(''); setQuantity(1); }}
          style={{
            pointerEvents: 'all', padding: '12px 28px', borderRadius: 100,
            border: 'none', cursor: 'pointer', fontWeight: 900, fontSize: 14,
            background: 'linear-gradient(135deg,#4ade80,#22c55e)',
            color: '#fff', boxShadow: '0 4px 0 #166534, 0 0 20px rgba(74,222,128,0.4)',
          }}
        >
          + Yeni İlan
        </motion.button>
      </div>

      {/* Listing modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'flex-end', zIndex: 50,
            }}
            onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 300 }}
              style={{
                width: '100%', background: 'linear-gradient(180deg, #1e4a0a 0%, #122808 100%)',
                borderRadius: '16px 16px 0 0', padding: '16px 16px 28px',
                border: '1px solid rgba(74,122,47,0.35)', maxHeight: '80vh', overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ color: '#e8f5e0', fontWeight: 900, fontSize: 16 }}>Yeni İlan Oluştur</div>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'rgba(200,230,160,0.5)', fontSize: 20, cursor: 'pointer' }}>✕</button>
              </div>

              {/* Modal tabs */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 3 }}>
                {([['regular', '🌾 Ürünler'], ['special', '✨ Özel']] as const).map(([t, label]) => (
                  <button
                    key={t}
                    onClick={() => { setModalTab(t); setSelectedItem(null); }}
                    style={{
                      flex: 1, padding: '7px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                      fontWeight: 800, fontSize: 12,
                      background: modalTab === t ? 'rgba(74,122,47,0.5)' : 'transparent',
                      color: modalTab === t ? '#a8ff78' : 'rgba(180,220,140,0.45)',
                    }}
                  >
                    {label}
                    {t === 'special' && totalSpecialCount > 0 && ` (${totalSpecialCount})`}
                  </button>
                ))}
              </div>

              {/* Item list */}
              {modalTab === 'regular' ? (
                regularListable.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'rgba(200,230,160,0.4)', padding: 24, fontSize: 13 }}>
                    Deponda satılacak ürün yok.<br/>Önce hasat yap!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {regularListable.map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setSelectedItem(item); setQuantity(1); }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '9px 12px', borderRadius: 10, cursor: 'pointer', border: 'none',
                          background: selectedItem?.id === item.id && !selectedItem?.isSpecial
                            ? 'rgba(74,222,128,0.2)'
                            : 'rgba(0,0,0,0.25)',
                          outline: selectedItem?.id === item.id && !selectedItem?.isSpecial
                            ? '1.5px solid #4ade80' : '1px solid rgba(74,122,47,0.2)',
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{item.emoji}</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ color: '#e8f5e0', fontWeight: 800, fontSize: 13 }}>{item.name}</div>
                          <div style={{ color: 'rgba(200,230,160,0.55)', fontSize: 11 }}>Depoda: {item.qty} adet</div>
                        </div>
                        {selectedItem?.id === item.id && !selectedItem?.isSpecial && (
                          <span style={{ color: '#4ade80', fontSize: 16 }}>✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )
              ) : (
                specialListable.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'rgba(200,230,160,0.4)', padding: 24, fontSize: 13 }}>
                    Henüz özel eşyan yok.<br/>Hasat yaparken %8 ihtimalle düşer!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
                    {specialListable.map(item => {
                      const si = SPECIAL_ITEMS.find(s => s.id === item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setSelectedItem(item); setQuantity(1); }}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 12px', borderRadius: 10, cursor: 'pointer', border: 'none',
                            background: selectedItem?.id === item.id && selectedItem?.isSpecial
                              ? 'rgba(245,158,11,0.2)'
                              : 'rgba(0,0,0,0.25)',
                            outline: selectedItem?.id === item.id && selectedItem?.isSpecial
                              ? '1.5px solid #f59e0b' : '1px solid rgba(245,158,11,0.2)',
                          }}
                        >
                          <span style={{ fontSize: 22 }}>{item.emoji}</span>
                          <div style={{ flex: 1, textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                              <span style={{ color: '#e8f5e0', fontWeight: 800, fontSize: 13 }}>{item.name}</span>
                              {si && <RarityBadge rarity={si.rarity} />}
                            </div>
                            <div style={{ color: 'rgba(200,230,160,0.55)', fontSize: 11 }}>Depoda: {item.qty} adet</div>
                          </div>
                          {selectedItem?.id === item.id && selectedItem?.isSpecial && (
                            <span style={{ color: '#f59e0b', fontSize: 16 }}>✓</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )
              )}

              {/* Quantity & price inputs */}
              {selectedItem && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}
                >
                  <div style={{ display: 'flex', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'rgba(200,230,160,0.6)', fontSize: 11, marginBottom: 4, fontWeight: 700 }}>MİKTAR</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(74,122,47,0.4)', background: 'rgba(0,0,0,0.3)', color: '#a8ff78', fontSize: 18, cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>-</button>
                        <input
                          type="number" value={quantity} min={1} max={selectedItem.qty}
                          onChange={e => setQuantity(Math.min(selectedItem.qty, Math.max(1, parseInt(e.target.value) || 1)))}
                          style={{
                            flex: 1, textAlign: 'center', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(74,122,47,0.35)',
                            borderRadius: 8, padding: '6px 0', color: '#e8f5e0', fontWeight: 800, fontSize: 14,
                          }}
                        />
                        <button onClick={() => setQuantity(q => Math.min(selectedItem.qty, q + 1))} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(74,122,47,0.4)', background: 'rgba(0,0,0,0.3)', color: '#a8ff78', fontSize: 18, cursor: 'pointer', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
                      </div>
                    </div>
                    <div style={{ flex: 2 }}>
                      <div style={{ color: 'rgba(200,230,160,0.6)', fontSize: 11, marginBottom: 4, fontWeight: 700 }}>FİYAT (COIN)</div>
                      <input
                        type="number" placeholder="0" value={priceCoins}
                        onChange={e => setPriceCoins(e.target.value)}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(74,122,47,0.35)',
                          borderRadius: 8, padding: '7px 10px', color: '#fbbf24', fontWeight: 800, fontSize: 14,
                        }}
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  {priceCoins && parseInt(priceCoins) > 0 && (
                    <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'rgba(200,230,160,0.6)', fontSize: 12 }}>
                        {selectedItem.emoji} {quantity} × 🪙 {parseInt(priceCoins).toLocaleString()}
                      </span>
                      <span style={{ color: '#fbbf24', fontWeight: 900, fontSize: 13 }}>
                        Toplam: 🪙 {(quantity * parseInt(priceCoins)).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={createListing}
                    disabled={isSubmitting || !priceCoins || parseInt(priceCoins) <= 0}
                    style={{
                      padding: '12px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                      fontWeight: 900, fontSize: 14,
                      background: isSubmitting ? 'rgba(74,122,47,0.4)' : 'linear-gradient(135deg,#4ade80,#22c55e)',
                      color: '#fff', boxShadow: isSubmitting ? 'none' : '0 3px 0 #166534',
                      opacity: (!priceCoins || parseInt(priceCoins) <= 0) ? 0.5 : 1,
                    }}
                  >
                    {isSubmitting ? 'Oluşturuluyor...' : `${selectedItem.emoji} İlanı Yayınla`}
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
