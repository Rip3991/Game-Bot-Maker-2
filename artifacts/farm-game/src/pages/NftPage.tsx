import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useUser } from '../hooks/use-user';
import {
  useGetUserNfts, useGetNftMarket, useListNftForTrade,
  useCreateTradeOffer, useGetTradeOffers, useAcceptTradeOffer,
  getGetUserNftsQueryKey, getGetNftMarketQueryKey, getGetTradeOffersQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useT } from '../lib/i18n';

const RARITY_STYLE: Record<string, { border: string; bg: string; label: string }> = {
  common:    { border: 'border-gray-400',   bg: 'bg-gray-700/30',   label: 'Sıradan'   },
  rare:      { border: 'border-blue-400',   bg: 'bg-blue-900/30',   label: 'Nadir'     },
  special:   { border: 'border-purple-400', bg: 'bg-purple-900/30', label: 'Özel'      },
  legendary: { border: 'border-yellow-400', bg: 'bg-yellow-900/30', label: 'Efsanevi'  },
};

type TabType = 'mine' | 'market' | 'offers';

export default function NftPage() {
  const t = useT();
  const { telegramId } = useUser();
  const qc = useQueryClient();
  const [tab, setTab] = useState<TabType>('mine');
  const [offerTarget, setOfferTarget] = useState<string | null>(null);

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

  const handleListToggle = async (nftId: string, currentListed: boolean) => {
    await listMut.mutateAsync({ data: { telegramId, nftId, list: !currentListed } });
    toast.success(currentListed ? t('removeFromTrade') : t('listForTrade'));
    refetchMine();
    refetchMarket();
  };

  const handleOffer = async (offeredNftId: string, targetNftId: string) => {
    try {
      await offerMut.mutateAsync({ data: { offererTelegramId: telegramId, offeredNftId, targetTelegramId: undefined, wantedNftType: undefined } });
      toast.success(t('tradeSent'));
      setOfferTarget(null);
      refetchMine();
    } catch {
      toast.error(t('error'));
    }
  };

  const handleAccept = async (offerId: string, acceptorNftId: string) => {
    try {
      await acceptMut.mutateAsync({ data: { telegramId, offerId, acceptorNftId } });
      toast.success(t('tradeAccepted'));
      refetchMine();
      refetchOffers();
    } catch {
      toast.error(t('error'));
    }
  };

  const marketExcludingMine = market.filter(n => n.ownerTelegramId !== telegramId);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-[#468f1c] border-b-4 border-[#3a7517] px-4 py-4 flex-shrink-0">
        <h1 className="text-2xl font-black drop-shadow-md">🃏 {t('nftTitle')}</h1>
        <p className="text-sm font-bold text-white/80">{t('nftDesc')}</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-[#3a7517] border-b-2 border-[#2e5c14] flex-shrink-0">
        {([['mine', '👜 Benim'], ['market', '🏪 Pazar'], ['offers', `📬 Teklifler${offers.length > 0 ? ` (${offers.length})` : ''}`]] as [TabType, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 text-sm font-black transition-all ${tab === key ? 'text-[#f5c842] border-b-2 border-[#f5c842]' : 'text-white/70'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-6">
        {/* MY NFTs */}
        {tab === 'mine' && (
          <>
            {myNfts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                <div className="text-6xl mb-4">🌾</div>
                <p className="font-black text-lg">Henüz NFT'n yok!</p>
                <p className="text-sm text-white/70 mt-2">{t('noNfts')}</p>
                <div className="mt-6 space-y-2 text-sm bg-black/20 rounded-2xl p-4 text-left w-full">
                  <p className="font-black text-[#f5c842] mb-2">🎯 Nasıl Kazanılır?</p>
                  <p>🌾 Buğdayı Lv10'a çıkar → <span className="text-yellow-300 font-bold">Altın Buğday</span></p>
                  <p>🐔 Tavuğu Lv10'a çıkar → <span className="text-blue-300 font-bold">Elmas Tavuk</span></p>
                  <p>🐄 İneği Lv10'a çıkar → <span className="text-purple-300 font-bold">Kraliyet İneği</span></p>
                  <p>🎰 3 Jackpot kazan → <span className="text-yellow-300 font-bold">Jackpot Ustası</span></p>
                  <p>👑 5 Arkadaş davet et → <span className="text-orange-300 font-bold">Referans Kral</span></p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {myNfts.map(nft => {
                  const style = RARITY_STYLE[nft.rarity] ?? RARITY_STYLE.common;
                  return (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`rounded-2xl border-2 ${style.border} ${style.bg} p-3 flex flex-col items-center gap-2`}
                    >
                      <div className="text-5xl drop-shadow-lg">{nft.emoji}</div>
                      <div className="text-center">
                        <div className="font-black text-sm">{nft.name}</div>
                        <div className={`text-xs font-bold ${style.border.replace('border-', 'text-')}`}>
                          {style.label} #{nft.mintNumber}
                        </div>
                      </div>
                      <button
                        onClick={() => handleListToggle(nft.id, nft.isListedForTrade)}
                        className={`w-full text-xs font-bold py-1.5 rounded-lg border transition-all ${
                          nft.isListedForTrade
                            ? 'border-red-400 text-red-300 bg-red-900/20 hover:bg-red-900/40'
                            : 'border-green-400 text-green-300 bg-green-900/20 hover:bg-green-900/40'
                        }`}
                      >
                        {nft.isListedForTrade ? '⬇️ Geri Al' : '🔄 Takasa Çıkar'}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* MARKET */}
        {tab === 'market' && (
          <>
            <p className="text-xs text-white/60 font-bold mb-3">Takasa çıkarılan NFT'ler</p>
            {marketExcludingMine.length === 0 ? (
              <p className="text-center text-white/60 py-10 font-bold">Şu an pazarda NFT yok.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {marketExcludingMine.map(nft => {
                  const style = RARITY_STYLE[nft.rarity] ?? RARITY_STYLE.common;
                  const myListedNft = myNfts.find(n => n.id !== nft.id);
                  return (
                    <motion.div
                      key={nft.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`rounded-2xl border-2 ${style.border} ${style.bg} p-3 flex flex-col items-center gap-2`}
                    >
                      <div className="text-5xl drop-shadow-lg">{nft.emoji}</div>
                      <div className="text-center">
                        <div className="font-black text-sm">{nft.name}</div>
                        <div className={`text-xs font-bold ${style.border.replace('border-', 'text-')}`}>
                          {style.label} #{nft.mintNumber}
                        </div>
                      </div>
                      {offerTarget === nft.id ? (
                        <div className="w-full space-y-1.5">
                          <p className="text-xs text-white/70 text-center font-bold">Hangi NFT'ni ver?</p>
                          {myNfts.map(myNft => (
                            <button
                              key={myNft.id}
                              onClick={() => handleOffer(myNft.id, nft.id)}
                              className="w-full text-xs font-bold py-1.5 rounded-lg bg-blue-900/40 border border-blue-400 text-blue-300 hover:bg-blue-900/60"
                            >
                              {myNft.emoji} {myNft.name}
                            </button>
                          ))}
                          <button onClick={() => setOfferTarget(null)} className="w-full text-xs py-1 text-white/50">İptal</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => myNfts.length > 0 ? setOfferTarget(nft.id) : toast.error(t('noNfts'))}
                          className="w-full text-xs font-bold py-1.5 rounded-lg border border-blue-400 text-blue-300 bg-blue-900/20 hover:bg-blue-900/40"
                        >
                          🤝 {t('offerTrade')}
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* INCOMING OFFERS */}
        {tab === 'offers' && (
          <>
            {offers.length === 0 ? (
              <p className="text-center text-white/60 py-10 font-bold">Bekleyen teklif yok.</p>
            ) : (
              <div className="space-y-3">
                {offers.map(offer => {
                  const offeredNft = offer.offeredNft;
                  const style = offeredNft ? RARITY_STYLE[offeredNft.rarity] ?? RARITY_STYLE.common : RARITY_STYLE.common;
                  const myListedNfts = myNfts.filter(n => n.isListedForTrade);
                  return (
                    <div key={offer.id} className={`rounded-2xl border-2 ${style.border} ${style.bg} p-4`}>
                      <p className="text-xs text-white/60 font-bold mb-2">Teklif Geliyor</p>
                      {offeredNft && (
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-4xl">{offeredNft.emoji}</span>
                          <div>
                            <div className="font-black">{offeredNft.name}</div>
                            <div className="text-xs text-white/60">{style.label} #{offeredNft.mintNumber}</div>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-white/70 font-bold mb-2">Kabul için hangi NFT'yi veriyorsun?</p>
                      {myListedNfts.length === 0 ? (
                        <p className="text-xs text-white/50">Takasa çıkarılmış NFT'n yok.</p>
                      ) : (
                        <div className="space-y-2">
                          {myListedNfts.map(myNft => (
                            <button
                              key={myNft.id}
                              onClick={() => handleAccept(offer.id, myNft.id)}
                              className="w-full flex items-center gap-2 py-2 px-3 rounded-xl bg-green-900/30 border border-green-400 text-green-300 text-sm font-bold hover:bg-green-900/50"
                            >
                              <span>{myNft.emoji}</span>
                              <span>{myNft.name}</span>
                              <span className="ml-auto text-xs">✅ Kabul Et</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
