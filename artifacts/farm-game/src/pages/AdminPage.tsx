import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Shield, Users, Plus, Coins, RefreshCw, Search } from 'lucide-react';

const API = `${import.meta.env.BASE_URL}api`;
const ADMIN_KEY_STORAGE = 'farm_admin_key';

interface UserRow {
  telegramId: string;
  firstName: string;
  username: string | null;
  balance: string;
  coins: string;
  streakCount: number;
  totalReferrals: number;
  lastLoginAt: string | null;
  createdAt: string;
}

function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

function timeAgo(iso: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Az önce';
  if (m < 60) return `${m}dk önce`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}s önce`;
  return `${Math.floor(h / 24)}g önce`;
}

export default function AdminPage() {
  const [key, setKey] = useState(() => localStorage.getItem(ADMIN_KEY_STORAGE) ?? '');
  const [authed, setAuthed] = useState(false);
  const [keyInput, setKeyInput] = useState('');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState<UserRow | null>(null);
  const [addAmount, setAddAmount] = useState('');
  const [addCoins, setAddCoins] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [onlineCount, setOnlineCount] = useState<number | null>(null);

  const fetchUsers = async (k: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/users`, { headers: { 'x-admin-key': k } });
      if (res.status === 401) { toast.error('Yanlış şifre'); setAuthed(false); return; }
      const data = await res.json();
      setUsers(data);
      setAuthed(true);
      localStorage.setItem(ADMIN_KEY_STORAGE, k);
    } catch { toast.error('Sunucu hatası'); }
    setLoading(false);
  };

  const fetchOnline = async () => {
    try {
      const res = await fetch(`${API}/stats/online`);
      const d = await res.json();
      setOnlineCount(d.onlineCount);
    } catch {}
  };

  useEffect(() => {
    if (key) fetchUsers(key);
    fetchOnline();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const id = setInterval(fetchOnline, 30000);
    return () => clearInterval(id);
  }, []);

  const handleLogin = () => {
    if (!keyInput.trim()) return;
    setKey(keyInput.trim());
    fetchUsers(keyInput.trim());
  };

  const handleAddBalance = async () => {
    if (!selected || !addAmount) return;
    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) { toast.error('Geçersiz miktar'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/admin/add-balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ telegramId: selected.telegramId, amount }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`✅ ${selected.firstName}'e ${fmtNum(amount)} TL eklendi! Yeni bakiye: ${fmtNum(data.newBalance)} TL`);
      setAddAmount('');
      await fetchUsers(key);
      setSelected(u => u ? { ...u, balance: data.newBalance.toString() } : null);
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  const handleAddCoins = async () => {
    if (!selected || !addCoins) return;
    const amount = parseFloat(addCoins);
    if (isNaN(amount) || amount <= 0) { toast.error('Geçersiz miktar'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/admin/add-coins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': key },
        body: JSON.stringify({ telegramId: selected.telegramId, amount }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`✅ ${selected.firstName}'e ${fmtNum(amount)} Coin eklendi!`);
      setAddCoins('');
      await fetchUsers(key);
    } catch (e: any) { toast.error(e.message); }
    setSubmitting(false);
  };

  const filtered = users.filter(u =>
    u.firstName.toLowerCase().includes(search.toLowerCase()) ||
    (u.username ?? '').toLowerCase().includes(search.toLowerCase()) ||
    u.telegramId.includes(search)
  );

  if (!authed) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 gap-4"
        style={{ background: '#080c10', color: 'white' }}>
        <Shield size={48} className="text-yellow-400" />
        <div className="font-black text-2xl text-white">Yönetici Paneli</div>
        <div className="text-white/40 text-sm text-center">Bu alana sadece yetkili kişiler girebilir</div>
        <div className="w-full max-w-xs flex flex-col gap-3 mt-2">
          <input
            type="password"
            placeholder="Admin şifresi..."
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full rounded-xl px-4 py-3 bg-white/10 border border-white/20 text-white outline-none focus:border-yellow-400 text-center font-bold"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-xl font-black text-yellow-900 active:scale-95 transition-all"
            style={{ background: 'linear-gradient(135deg, #f5c842, #e6a800)' }}
          >
            🔓 Giriş Yap
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: '#080c10', color: 'white' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)' }}>
        <Shield size={16} className="text-yellow-400" />
        <span className="font-black text-yellow-300">Yönetici Paneli</span>
        <div className="flex-1" />
        <div className="flex items-center gap-1 bg-green-500/20 border border-green-500/30 rounded-full px-2 py-0.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-300 font-black text-[10px]">{onlineCount ?? '...'} aktif</span>
        </div>
        <button onClick={() => fetchUsers(key)} className="p-1.5 rounded-lg bg-white/5 active:scale-90">
          <RefreshCw size={14} className="text-white/50" />
        </button>
      </div>

      {/* Stats strip */}
      <div className="flex gap-2 px-3 py-2 flex-shrink-0" style={{ background: 'rgba(255,255,255,0.03)' }}>
        <div className="flex-1 rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-[10px] text-white/40 font-bold">Toplam Oyuncu</div>
          <div className="font-black text-white text-sm">{fmtNum(users.length)}</div>
        </div>
        <div className="flex-1 rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-[10px] text-white/40 font-bold">Şu An Aktif</div>
          <div className="font-black text-green-300 text-sm">{onlineCount ?? '...'}</div>
        </div>
        <div className="flex-1 rounded-xl p-2 text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="text-[10px] text-white/40 font-bold">Toplam TL</div>
          <div className="font-black text-yellow-300 text-sm">
            {fmtNum(users.reduce((s, u) => s + Number(u.balance), 0))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-2 flex-shrink-0">
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <Search size={14} className="text-white/30" />
          <input
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/20"
            placeholder="İsim, kullanıcı adı veya ID ara..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* User list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 flex flex-col gap-1.5">
        {loading ? (
          <div className="text-center text-white/30 py-8">Yükleniyor...</div>
        ) : filtered.map(u => (
          <motion.button
            key={u.telegramId}
            onClick={() => setSelected(s => s?.telegramId === u.telegramId ? null : u)}
            className="w-full text-left rounded-2xl p-3 transition-all"
            style={selected?.telegramId === u.telegramId ? {
              background: 'linear-gradient(135deg, #1a3d08, #2e6012)',
              border: '1.5px solid #4ade80',
            } : {
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
            layout
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 font-black text-base"
                style={{ background: 'linear-gradient(135deg, #c4832e, #8b5c1e)' }}>
                {u.firstName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-sm truncate">{u.firstName}</span>
                  {u.username && <span className="text-white/30 text-[10px]">@{u.username}</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-yellow-300 font-bold text-[10px]">💵 {fmtNum(Number(u.balance))} TL</span>
                  <span className="text-yellow-500/60 font-bold text-[10px]">🪙 {fmtNum(Number(u.coins))}</span>
                  <span className="text-white/20 text-[9px]">{timeAgo(u.lastLoginAt)}</span>
                </div>
              </div>
              <div className="flex-shrink-0 flex flex-col items-end gap-0.5">
                <span className="text-[9px] font-bold text-white/20">{u.telegramId}</span>
                <span className="text-[9px] text-orange-300/60">🔥 {u.streakCount}g</span>
              </div>
            </div>

            {/* Expand: add balance/coins */}
            <AnimatePresence>
              {selected?.telegramId === u.telegramId && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                  onClick={e => e.stopPropagation()}
                >
                  <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-white/10">
                    {/* Add TL */}
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 flex items-center gap-1.5 bg-black/30 border border-yellow-500/30 rounded-xl px-2.5 py-1.5">
                        <span className="text-yellow-400 text-sm">💵</span>
                        <input
                          type="number"
                          placeholder="TL miktarı..."
                          value={addAmount}
                          onChange={e => setAddAmount(e.target.value)}
                          className="flex-1 bg-transparent text-white text-sm outline-none font-bold placeholder:text-white/20"
                          min="1"
                        />
                      </div>
                      <button
                        onClick={handleAddBalance}
                        disabled={submitting || !addAmount}
                        className="px-3 py-2 rounded-xl font-black text-xs text-white active:scale-95 transition-all disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {/* Add Coins */}
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 flex items-center gap-1.5 bg-black/30 border border-yellow-400/30 rounded-xl px-2.5 py-1.5">
                        <span className="text-yellow-300 text-sm">🪙</span>
                        <input
                          type="number"
                          placeholder="Coin miktarı..."
                          value={addCoins}
                          onChange={e => setAddCoins(e.target.value)}
                          className="flex-1 bg-transparent text-white text-sm outline-none font-bold placeholder:text-white/20"
                          min="1"
                        />
                      </div>
                      <button
                        onClick={handleAddCoins}
                        disabled={submitting || !addCoins}
                        className="px-3 py-2 rounded-xl font-black text-xs text-white active:scale-95 transition-all disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #b45309, #92400e)' }}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {/* Quick amounts */}
                    <div className="flex gap-1.5 flex-wrap">
                      {[100, 500, 1000, 5000, 10000].map(n => (
                        <button key={n}
                          onClick={() => setAddAmount(String(n))}
                          className="px-2 py-1 rounded-lg text-[10px] font-black text-yellow-300 active:scale-90"
                          style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.3)' }}>
                          +{fmtNum(n)} TL
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
