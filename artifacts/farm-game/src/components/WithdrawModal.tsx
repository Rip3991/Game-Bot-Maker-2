import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Banknote, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { useUser } from '../hooks/use-user';
import { useRequestWithdrawal, useGetWithdrawHistory } from '@workspace/api-client-react';
import { toast } from 'sonner';

// Tiered withdrawal amounts — user picks one
const AMOUNTS = [150, 350, 750] as const;
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
  const { user, telegramId } = useUser();
  const [method, setMethod] = useState<Method>('papara');
  const [amount, setAmount] = useState<Amount>(150);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [lastResult, setLastResult] = useState<{ requestId: string; amount: number } | null>(null);

  const withdrawMut = useRequestWithdrawal();
  const { data: history, refetch: refetchHistory } = useGetWithdrawHistory(telegramId);

  const balance = user?.balance ?? 0;
  const canWithdraw = balance >= amount;

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

            <div className="px-5 py-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {step === 'form' ? (
                <>
                  {/* Balance info */}
                  <div className="flex items-center justify-between mb-4 bg-black/30 rounded-xl p-3 border border-white/10">
                    <span className="text-sm font-bold opacity-70">Mevcut Bakiye</span>
                    <span className="font-black text-lg text-[#f5c842]">💵 {balance.toFixed(2)} TL</span>
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
