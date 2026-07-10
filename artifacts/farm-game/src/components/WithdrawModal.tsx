import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Banknote, AlertCircle, CheckCircle2, Clock, RefreshCw, ArrowRight } from 'lucide-react';
import { useUser } from '../hooks/use-user';
import { useRequestWithdrawal, useGetWithdrawHistory } from '@workspace/api-client-react';
import { toast } from 'sonner';

const API = `${import.meta.env.BASE_URL}api`;

// Tiered withdrawal amounts — user picks one
const AMOUNTS = [750, 1000, 1500] as const;
type Amount = typeof AMOUNTS[number];

const METHODS = [
  { id: 'papara', label: 'Papara',       emoji: '💳' },
  { id: 'iban',   label: 'IBAN / Banka', emoji: '🏦' },
  { id: 'crypto', label: 'Kripto (USDT)',emoji: '🪙' },
] as const;

type Method = typeof METHODS[number]['id'];

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WithdrawModal({ isOpen, onClose }: WithdrawModalProps) {
  const { user, telegramId, refresh } = useUser();
  const [method, setMethod] = useState<Method>('papara');
  const [amount, setAmount] = useState<Amount>(750);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [lastResult, setLastResult] = useState<{ requestId: string; amount: number } | null>(null);

  // Coin → TL converter state
  const [coinConvertAmount, setCoinConvertAmount] = useState('');
  const [converting, setConverting] = useState(false);

  const withdrawMut = useRequestWithdrawal();
  const { data: history, refetch: refetchHistory } = useGetWithdrawHistory(telegramId);

  const balance = user?.balance ?? 0;
  const coins = user?.coins ?? 0;
  const canWithdraw = balance >= amount;

  // Rate: 1000 coins = 25 TL (0.025 TL per coin), min 1000 coins
  const COIN_RATE = 0.025;
  const MIN_COINS = 1000;
  // Parse strictly — only accept positive integers (no decimals, no scientific notation)
  const parsedCoinAmount = /^\d+$/.test(coinConvertAmount.trim()) ? parseInt(coinConvertAmount.trim(), 10) : NaN;
  const coinInputEmpty = coinConvertAmount.trim() === '';
  const coinInputInvalid = !coinInputEmpty && !Number.isInteger(parsedCoinAmount);
  const coinBelowMin = Number.isInteger(parsedCoinAmount) && parsedCoinAmount < MIN_COINS;
  const coinInsufficientBalance = Number.isInteger(parsedCoinAmount) && parsedCoinAmount > coins;
  const coinAmountValid = Number.isInteger(parsedCoinAmount) && parsedCoinAmount >= MIN_COINS && parsedCoinAmount <= coins;
  const tlPreview = coinAmountValid ? Math.floor(parsedCoinAmount * COIN_RATE * 100) / 100 : 0;

  const handleConvert = async () => {
    if (!coinAmountValid || converting) return;
    setConverting(true);
    try {
      const res = await fetch(`${API}/stars/convert-coins-to-tl`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telegramId, coins: parsedCoinAmount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Hata oluştu');
      toast.success(`💵 ${data.tlReceived.toFixed(2)} TL bakiyene eklendi!`);
      setCoinConvertAmount('');
      await refresh();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Çevirme başarısız');
    } finally {
      setConverting(false);
    }
  };

  const handleSubmit = async () => {
    if (!canWithdraw) return;
    try {
      const result = await withdrawMut.mutateAsync({
        data: { telegramId, amount, method },
      });
      setLastResult({ requestId: result.requestId, amount });
      setStep('success');
      refetchHistory();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Bir hata oluştu';
      toast.error(msg);
    }
  };

  const handleClose = () => {
    setStep('form');
    setCoinConvertAmount('');
    onClose();
  };

  const statusColor = (status: string) => {
    if (status === 'approved') return 'text-green-400';
    if (status === 'rejected') return 'text-red-400';
    return 'text-yellow-400';
  };
  const statusLabel = (status: string) => {
    if (status === 'approved') return 'Onaylandı';
    if (status === 'rejected') return 'Reddedildi';
    return 'Bekliyor';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="w-full max-w-md bg-[#3a2010] rounded-t-3xl border-t-4 border-[#f5c842] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
              <h2 className="font-black text-xl flex items-center gap-2">
                <Banknote size={22} className="text-[#f5c842]" />
                Para Çek
              </h2>
              <button onClick={handleClose} className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition">
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {step === 'form' ? (
                <>
                  {/* Balance + Coins info row */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex flex-col items-center bg-black/30 rounded-xl p-3 border border-white/10">
                      <span className="text-sm font-bold opacity-70 mb-0.5">TL Bakiye</span>
                      <span className="font-black text-lg text-[#f5c842]">💵 {balance.toFixed(2)} TL</span>
                    </div>
                    <div className="flex flex-col items-center bg-black/30 rounded-xl p-3 border border-white/10">
                      <span className="text-sm font-bold opacity-70 mb-0.5">Coin</span>
                      <span className="font-black text-lg text-yellow-300">🪙 {coins.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* ── Coin → TL Converter ── */}
                  <div className="mb-5 rounded-2xl overflow-hidden border-2 border-green-600/50"
                    style={{ background: 'linear-gradient(135deg, #0a2e12, #0f3a18)' }}>
                    <div className="px-4 py-3 border-b border-white/10">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-base">🪙</span>
                        <span className="font-black text-green-300 text-sm">Coin → TL Çevir</span>
                        <span className="ml-auto text-[9px] font-bold bg-green-800/60 border border-green-600/40 text-green-300 px-2 py-0.5 rounded-full">
                          1.000 Coin = 25 TL
                        </span>
                      </div>
                      <p className="text-white/40 text-[10px] font-bold">Min. {MIN_COINS} Coin · Anında TL bakiyene yüklenir</p>
                    </div>
                    <div className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={coinConvertAmount}
                            onChange={(e) => setCoinConvertAmount(e.target.value)}
                            placeholder={`Min. ${MIN_COINS} Coin`}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-white font-black text-sm outline-none placeholder:opacity-30"
                          />
                          {coins > 0 && (
                            <button
                              onClick={() => setCoinConvertAmount(String(coins))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black bg-yellow-700/50 text-yellow-300 px-1.5 py-0.5 rounded"
                            >
                              TÜMÜ
                            </button>
                          )}
                        </div>
                        <ArrowRight size={16} className="text-white/30 flex-shrink-0" />
                        <div className="flex-shrink-0 min-w-[72px] text-center bg-black/40 rounded-xl px-3 py-2.5 border border-white/10">
                          <div className="font-black text-green-300 text-sm">
                            {tlPreview > 0 ? `${tlPreview.toFixed(2)} TL` : '— TL'}
                          </div>
                        </div>
                      </div>
                      {coinInputInvalid && (
                        <div className="text-red-400 text-[10px] font-bold mt-1.5">Lütfen geçerli bir tam sayı gir</div>
                      )}
                      {coinBelowMin && !coinInputInvalid && (
                        <div className="text-red-400 text-[10px] font-bold mt-1.5">En az {MIN_COINS} Coin gerekli</div>
                      )}
                      {coinInsufficientBalance && !coinBelowMin && !coinInputInvalid && (
                        <div className="text-red-400 text-[10px] font-bold mt-1.5">Yetersiz Coin bakiyesi (mevcut: {coins.toLocaleString()})</div>
                      )}
                      <button
                        onClick={handleConvert}
                        disabled={!coinAmountValid || converting}
                        className="w-full mt-2.5 py-2.5 rounded-xl font-black text-sm text-white transition flex items-center justify-center gap-2 disabled:opacity-40"
                        style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                      >
                        {converting ? (
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }}>
                            <RefreshCw size={16} />
                          </motion.div>
                        ) : (
                          <>🔄 Coin'i TL'ye Çevir</>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Amount tiers */}
                  <label className="block text-sm font-bold text-orange-200 mb-2 uppercase tracking-wide">Çekim Tutarı</label>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {AMOUNTS.map((amt) => {
                      const affordable = balance >= amt;
                      return (
                        <button
                          key={amt}
                          onClick={() => setAmount(amt)}
                          className={`flex flex-col items-center py-4 rounded-2xl border-2 transition font-black ${
                            amount === amt
                              ? 'border-[#f5c842] bg-gradient-to-br from-[#f5c842]/25 to-[#f5c842]/5 text-[#f5c842]'
                              : 'border-white/15 bg-black/20 text-white/70'
                          } ${!affordable ? 'opacity-40' : ''}`}
                        >
                          <span className="text-xl">{amt}</span>
                          <span className="text-[10px] font-bold mt-0.5">TL</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Info */}
                  <div className="flex items-start gap-2 mb-5 bg-blue-900/40 border border-blue-500/40 rounded-xl p-3 text-sm">
                    <AlertCircle size={16} className="text-blue-400 mt-0.5 shrink-0" />
                    <p className="text-blue-200 leading-snug">
                      Seçtiğin tutar kadar bakiyenden düşülür. 24 saat içinde işleme alınır. İlk çekim için hesabının en az 3 gündür aktif olması gerekir.
                    </p>
                  </div>

                  {/* Not enough balance warning */}
                  {!canWithdraw && (
                    <div className="flex items-center gap-2 mb-4 bg-red-900/40 border border-red-500/40 rounded-xl p-3 text-sm">
                      <AlertCircle size={16} className="text-red-400 shrink-0" />
                      <p className="text-red-200">
                        Çekim için <b>{amount} TL</b> bakiye gerekli. Şu an: <b>{balance.toFixed(2)} TL</b>
                        {coins >= MIN_COINS && (
                          <span className="block mt-1 text-yellow-300">💡 Yukarıdan Coin'lerini TL'ye çevirebilirsin!</span>
                        )}
                      </p>
                    </div>
                  )}

                  {/* Method */}
                  <label className="block text-sm font-bold text-orange-200 mb-2 uppercase tracking-wide">Ödeme Yöntemi</label>
                  <div className="grid grid-cols-3 gap-2 mb-6">
                    {METHODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`flex flex-col items-center py-3 rounded-xl border-2 transition font-bold text-sm ${
                          method === m.id
                            ? 'border-[#f5c842] bg-[#f5c842]/20 text-[#f5c842]'
                            : 'border-white/20 bg-black/20 text-white/70'
                        }`}
                      >
                        <span className="text-2xl mb-1">{m.emoji}</span>
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!canWithdraw || withdrawMut.isPending}
                    className="w-full wood-button bg-green-600 border-green-900 text-white font-black text-lg py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ boxShadow: '0 4px 0 #14532d' }}
                  >
                    {withdrawMut.isPending ? 'Gönderiliyor...' : `💸 ${amount} TL Çek`}
                  </button>

                  {/* History */}
                  {history && history.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-black text-sm uppercase tracking-wide text-orange-200 mb-3 flex items-center gap-2">
                        <Clock size={14} /> Geçmiş Çekimler
                      </h3>
                      <div className="space-y-2">
                        {history.slice(0, 5).map((h) => (
                          <div key={h.id} className="flex items-center justify-between bg-black/30 rounded-xl px-3 py-2.5 border border-white/10">
                            <div>
                              <span className="font-black">{h.amount} TL</span>
                              <span className="text-xs opacity-50 ml-2">· {h.method}</span>
                            </div>
                            <span className={`text-xs font-bold ${statusColor(h.status)}`}>
                              {statusLabel(h.status)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-20 h-20 rounded-full bg-green-600 flex items-center justify-center mb-4 border-4 border-green-300"
                  >
                    <CheckCircle2 size={40} className="text-white" />
                  </motion.div>
                  <h3 className="font-black text-2xl mb-2">Talep Alındı!</h3>
                  <p className="text-green-300 font-bold text-2xl mb-1">{lastResult?.amount ?? amount} TL 💸</p>
                  <p className="opacity-60 text-sm mb-2">
                    Talep No: <span className="font-mono text-xs">{lastResult?.requestId?.slice(0, 12)}...</span>
                  </p>
                  <p className="opacity-70 text-sm px-4 mb-6">24 saat içinde hesabınıza aktarılacaktır.</p>
                  <button onClick={handleClose} className="wood-button w-full font-black py-3">
                    Tamam
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
