import React from 'react';
import { useUser } from '../hooks/use-user';
import { useGetReferralStats } from '@workspace/api-client-react';
import { Copy, Share, Users, Gift } from 'lucide-react';
import { toast } from 'sonner';
import mascotAvatar from '../assets/mascot-avatar.png';

const BOT_USERNAME = 'MemberGobot';

export default function InvitePage() {
  const { telegramId } = useUser();
  const { data: stats, isLoading } = useGetReferralStats(telegramId);

  // Use the link from the server (has correct BOT_USERNAME) or build fallback
  // ?start= triggers /start webhook which sends the game link with startapp param
  const referralLink =
    stats?.referralLink ?? `https://t.me/${BOT_USERNAME}?start=ref_${telegramId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Bağlantı kopyalandı!");
  };

  const handleShare = () => {
    const text = encodeURIComponent(`Sarı'nın Çiftliği'ni oyna ve 5 Coin kazan! 🌾🪙 Sen davet edersen 12 Coin kazanırsın!`);
    const url = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${text}`;
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full pt-8 pb-4 px-4 overflow-y-auto custom-scrollbar">

      {/* Header */}
      <div className="wood-panel p-6 flex flex-col items-center justify-center text-center mb-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 mb-2 z-10">
          <img src={mascotAvatar} alt="Sarı" className="w-[60px] drop-shadow-md bg-yellow-400 rounded-full border-2 border-white shadow-md" />
          <h1 className="text-3xl font-black drop-shadow-md">Arkadaş Davet Et</h1>
        </div>

        <div className="relative bg-white text-[#a06235] font-black px-4 py-2 rounded-xl mb-4 text-sm shadow-md border-2 border-[#a06235] z-10 mt-2">
          <div className="absolute -top-2 left-6 w-4 h-4 bg-white border-l-2 border-t-2 border-[#a06235] transform rotate-45"></div>
          Sen 12 Coin, arkadaşın 5 Coin kazan!
        </div>

        <div className="bg-[#5c3a21] border-2 border-[#f5c842] rounded-xl px-4 py-2 shadow-lg inline-flex items-center gap-2 z-10">
          <span className="text-xl font-black text-[#f5c842]">Her Davet = 🪙 12 Coin</span>
        </div>
      </div>

      {/* Invite link */}
      <div className="wood-panel p-4 mb-4">
        <label className="text-sm font-bold text-orange-200 mb-2 block uppercase tracking-wide">Davet Bağlantın</label>
        <div className="flex gap-2">
          <div className="flex-1 bg-black/30 rounded-lg px-3 py-3 border-2 border-black/20 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap opacity-80 select-all">
            {referralLink}
          </div>
          <button onClick={handleCopy} className="wood-button px-4 py-2 flex items-center justify-center">
            <Copy size={20} />
          </button>
        </div>
        <button
          onClick={handleShare}
          className="w-full mt-4 wood-button bg-blue-500 border-blue-800 text-white font-bold py-3 flex items-center justify-center gap-2"
          style={{ boxShadow: '0 4px 0 #1e3a8a' }}
        >
          <Share size={20} /> TELEGRAM'DA PAYLAŞ
        </button>
      </div>

      {/* Invite Event - NFT Milestones */}
      <div className="wood-panel p-4 mb-4 relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-28 h-28 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
        <h3 className="font-black text-sm uppercase tracking-wide text-orange-200 mb-3 flex items-center gap-2">
          🎁 Davet Olayı — NFT Ödülleri
        </h3>
        <p className="text-xs opacity-70 mb-3 font-semibold">Belirli sayıda arkadaş davet edince özel NFT kazanırsın!</p>
        <div className="space-y-2">
          {[
            { count: 1,  reward: 'Mistik Mühür',   emoji: '🔯', rarity: 'Özel',     color: '#a855f7', done: (stats?.totalReferrals ?? 0) >= 1  },
            { count: 5,  reward: 'Antik Tapınak',  emoji: '🏛️', rarity: 'Epik',     color: '#dc2626', done: (stats?.totalReferrals ?? 0) >= 5  },
            { count: 10, reward: 'Titan Baltası',  emoji: '🪓', rarity: 'Epik',     color: '#dc2626', done: (stats?.totalReferrals ?? 0) >= 10 },
            { count: 25, reward: 'Ejder Kulesi',   emoji: '🗼', rarity: 'Epik',     color: '#dc2626', done: (stats?.totalReferrals ?? 0) >= 25 },
            { count: 50, reward: 'Kader Kilidi',   emoji: '🔐', rarity: 'Epik',     color: '#dc2626', done: (stats?.totalReferrals ?? 0) >= 50 },
          ].map((item) => (
            <div key={item.count} className={`flex items-center gap-3 rounded-xl px-3 py-2 border ${item.done ? 'border-green-500/40 bg-green-900/20' : 'border-white/10 bg-black/20'}`}>
              <div className="text-2xl">{item.emoji}</div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm text-white leading-tight">{item.reward}</div>
                <div className="text-[10px] font-bold" style={{ color: item.color }}>{item.rarity} NFT</div>
              </div>
              <div className="text-right flex-shrink-0">
                {item.done ? (
                  <div className="text-green-400 font-black text-sm">✅ Kazanıldı</div>
                ) : (
                  <div className="text-center">
                    <div className="font-black text-white text-sm">{item.count}</div>
                    <div className="text-[9px] opacity-50 font-bold">davet</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div className="wood-panel p-4 mb-4">
        <h3 className="font-black text-sm uppercase tracking-wide text-orange-200 mb-3 flex items-center gap-2">
          <Gift size={14} /> Nasıl Çalışır?
        </h3>
        <div className="space-y-2 text-sm">
          {[
            { step: '1', text: 'Bağlantını arkadaşlarınla paylaş' },
            { step: '2', text: 'Arkadaşın oyuna katılır' },
            { step: '3', text: 'Sen 12 Coin, arkadaşın 5 Coin kazanır' },
            { step: '4', text: 'Davet sayına göre özel NFT kazan!' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#f5c842] text-[#5c3a21] font-black flex items-center justify-center text-xs shrink-0">
                {item.step}
              </div>
              <span className="font-semibold opacity-90">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="wood-panel p-4 flex flex-col items-center text-center">
          <span className="text-sm font-bold opacity-80 uppercase tracking-wide">Toplam Davet</span>
          <span className="text-3xl font-black mt-1">{stats?.totalReferrals ?? 0}</span>
        </div>
        <div className="wood-panel p-4 flex flex-col items-center text-center border-[#f5c842]">
          <span className="text-sm font-bold text-[#f5c842] uppercase tracking-wide">Kazanılan</span>
          <span className="text-3xl font-black mt-1 text-[#f5c842]">🪙 {stats?.coinsFromReferrals ?? 0}</span>
        </div>
      </div>

      {/* Recent invites */}
      <div className="wood-panel p-4 flex-1 min-h-[200px] flex flex-col">
        <h3 className="font-black text-lg mb-4 flex items-center gap-2"><Users size={20} /> Son Davet Edilenler</h3>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center opacity-50">Yükleniyor...</div>
        ) : (stats?.recentReferrals?.length ?? 0) === 0 ? (
          <div className="flex-1 flex items-center justify-center text-center opacity-60 font-bold px-8">
            Henüz kimseyi davet etmedin. Bağlantını paylaşarak başla!
          </div>
        ) : (
          <div className="flex flex-col gap-3 overflow-y-auto">
            {stats?.recentReferrals.map((ref, i) => (
              <div key={i} className="flex items-center justify-between bg-black/20 p-3 rounded-xl border border-black/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center font-black text-lg border-2 border-white/20 shadow-inner">
                    {ref.firstName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-sm">{ref.firstName}</span>
                    <span className="text-[10px] opacity-60">{new Date(ref.joinedAt).toLocaleDateString('tr-TR')}</span>
                  </div>
                </div>
                <div className="font-black text-[#f5c842] bg-[#5c3a21] px-2 py-1 rounded-md text-sm border border-[#a06235]">
                  +🪙{ref.coinsEarned}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
