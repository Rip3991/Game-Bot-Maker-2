import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useUser } from '../hooks/use-user';
import { useGetVaultDeposits, useVaultDeposit, useClaimVaultDeposit } from '@workspace/api-client-react';
import { getGetVaultDepositsQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useT } from '../lib/i18n';

const VAULT_OPTIONS = [
  { days: 3,  multiplier: 1.10, label: '3 Gün', color: '#5ab327', icon: '🌱' },
  { days: 7,  multiplier: 1.25, label: '7 Gün', color: '#3b82f6', icon: '💧' },
  { days: 14, multiplier: 1.50, label: '14 Gün', color: '#8b5cf6', icon: '⚡' },
  { days: 30, multiplier: 2.00, label: '30 Gün', color: '#f97316', icon: '🔥' },
];

export default function VaultPage() {
  const t = useT();
  const { user, telegramId, refresh: refreshUser } = useUser();
  const queryClient = useQueryClient();

  const [coins, setCoins] = useState('');
  const [selectedDays, setSelectedDays] = useState(7);

  const { data: deposits = [], refetch } = useGetVaultDeposits(telegramId, {
    query: { queryKey: getGetVaultDepositsQueryKey(telegramId), enabled: !!telegramId }
  });

  const depositMut = useVaultDeposit();
  const claimMut = useClaimVaultDeposit();

  const selectedOption = VAULT_OPTIONS.find(o => o.days === selectedDays)!;
  const coinAmount = parseInt(coins) || 0;
  const coinsToReceive = coinAmount > 0 ? Math.floor(coinAmount * selectedOption.multiplier) : 0;

  const availableCoins = user?.coins ?? 0;

  const handleDeposit = async () => {
    if (coinAmount < 100) { toast.error(t('minDeposit')); return; }
    if (coinAmount > availableCoins) { toast.error(t('notEnoughCoins')); return; }
    try {
      await depositMut.mutateAsync({ data: { telegramId, coins: coinAmount, lockDays: selectedDays } });
      toast.success(`🔒 ${coinAmount} ${t('depositSuccess')}`);
      setCoins('');
      await Promise.all([refetch(), refreshUser()]);
    } catch {
      toast.error(t('error'));
    }
  };

  const handleClaim = async (depositId: string) => {
    try {
      const result = await claimMut.mutateAsync({ data: { telegramId, depositId } });
      toast.success(`🎉 +${result.coinsReceived} ${t('claimSuccess')}`);
      await Promise.all([refetch(), refreshUser()]);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t('error');
      toast.error(msg);
    }
  };

  const activeDeposits = deposits.filter(d => d.status !== 'claimed');
  const matureDeposits = deposits.filter(d => d.status === 'mature');

  return (
    <div className="h-full flex flex-col overflow-y-auto pb-4">
      {/* Header */}
      <div className="bg-[#468f1c] border-b-4 border-[#3a7517] px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black drop-shadow-md">💎 {t('vaultTitle')}</h1>
            <p className="text-sm font-bold text-white/80">{t('vaultDesc')}</p>
          </div>
          <div className="wood-panel py-1.5 px-3 text-[#f5c842] font-black text-sm">
            🪙 {availableCoins.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-4 space-y-5">
        {/* Mature notification */}
        {matureDeposits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-yellow-500/20 border-2 border-yellow-400 rounded-2xl p-3 flex items-center justify-between"
          >
            <span className="font-black text-yellow-300">🎉 {matureDeposits.length} yatırımın hazır!</span>
          </motion.div>
        )}

        {/* Deposit Form */}
        <div className="bg-black/20 border-2 border-white/10 rounded-2xl p-4 space-y-4">
          <h2 className="font-black text-lg">💰 Yeni Yatırım</h2>

          {/* Duration selector */}
          <div className="grid grid-cols-2 gap-2">
            {VAULT_OPTIONS.map(opt => (
              <button
                key={opt.days}
                onClick={() => setSelectedDays(opt.days)}
                className={`p-3 rounded-xl border-2 font-bold text-sm transition-all flex flex-col items-center gap-1 ${
                  selectedDays === opt.days
                    ? 'border-[#f5c842] bg-[#f5c842]/20 scale-105'
                    : 'border-white/20 bg-black/20'
                }`}
              >
                <span className="text-xl">{opt.icon}</span>
                <span>{opt.label}</span>
                <span className="text-[#f5c842] font-black">×{opt.multiplier.toFixed(2)}</span>
              </button>
            ))}
          </div>

          {/* Amount input */}
          <div>
            <label className="text-sm font-bold text-white/70 mb-1 block">{t('coinsToDeposit')}</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={coins}
                onChange={e => setCoins(e.target.value)}
                placeholder="0"
                className="flex-1 bg-black/30 border-2 border-white/20 rounded-xl px-3 py-2.5 font-mono text-lg font-bold text-white focus:border-[#f5c842] focus:outline-none"
              />
              <button
                onClick={() => setCoins(String(Math.floor(availableCoins / 2)))}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm font-bold hover:bg-white/20"
              >
                ½
              </button>
              <button
                onClick={() => setCoins(String(availableCoins))}
                className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm font-bold hover:bg-white/20"
              >
                MAX
              </button>
            </div>
          </div>

          {/* Preview */}
          {coinAmount > 0 && (
            <div className="bg-[#f5c842]/10 border border-[#f5c842]/40 rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm font-bold text-white/70">{t('youGet')}</span>
              <span className="text-[#f5c842] font-black text-lg">🪙 {coinsToReceive.toLocaleString()}</span>
            </div>
          )}

          <button
            onClick={handleDeposit}
            disabled={depositMut.isPending || coinAmount < 100 || coinAmount > availableCoins}
            className="w-full wood-button py-3 font-black text-lg rounded-xl disabled:opacity-50 disabled:grayscale"
          >
            {depositMut.isPending ? '...' : `🔒 ${t('lockAndEarn')}`}
          </button>
        </div>

        {/* Active Deposits */}
        <div>
          <h2 className="font-black text-lg mb-3">📦 Aktif Yatırımlar</h2>
          {activeDeposits.length === 0 ? (
            <p className="text-center text-white/60 py-6 font-bold">{t('noDeposits')}</p>
          ) : (
            <div className="space-y-3">
              <AnimatePresence>
                {activeDeposits.map(dep => {
                  const isMature = dep.status === 'mature';
                  const maturesAt = new Date(dep.maturesAt);
                  const now = Date.now();
                  const msLeft = maturesAt.getTime() - now;
                  const hoursLeft = Math.max(0, Math.ceil(msLeft / 3600000));
                  const daysLeft = Math.floor(hoursLeft / 24);

                  return (
                    <motion.div
                      key={dep.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`rounded-2xl border-2 p-4 flex items-center justify-between ${
                        isMature
                          ? 'border-yellow-400 bg-yellow-400/10'
                          : 'border-white/10 bg-black/20'
                      }`}
                    >
                      <div>
                        <div className="font-black text-sm">
                          🪙 {dep.coinsDeposited.toLocaleString()} → {dep.coinsToReceive.toLocaleString()}
                        </div>
                        <div className="text-xs text-white/60 font-bold mt-0.5">
                          ×{dep.multiplier} · {dep.lockDays} gün
                        </div>
                        <div className={`text-xs font-bold mt-1 ${isMature ? 'text-yellow-300' : 'text-white/50'}`}>
                          {isMature ? `✅ ${t('mature')}` : `⏳ ${daysLeft > 0 ? `${daysLeft} gün` : `${hoursLeft} saat`} kaldı`}
                        </div>
                      </div>
                      {isMature && (
                        <button
                          onClick={() => handleClaim(dep.id)}
                          disabled={claimMut.isPending}
                          className="bg-yellow-500 text-black font-black text-sm px-4 py-2 rounded-xl shadow-md hover:bg-yellow-400 active:scale-95 transition-all disabled:opacity-50"
                        >
                          {t('claimNow')} 🎁
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
