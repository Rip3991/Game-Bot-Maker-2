import React from 'react';
import { useUser } from '../hooks/use-user';
import { useGetStarPackages, usePurchaseStars } from '@workspace/api-client-react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

export default function StarsShopPage() {
  const { user, telegramId, refresh } = useUser();
  const { data: packages, isLoading } = useGetStarPackages();
  const purchaseMut = usePurchaseStars();

  const handlePurchase = async (packageId: string, cost: number) => {
    if (!user || user.coins < cost) {
      toast.error("Yetersiz Coin!");
      return;
    }

    try {
      toast.loading("İşlem başlatılıyor...", { id: 'purchase' });
      const result = await purchaseMut.mutateAsync({
        data: { telegramId, packageId }
      });
      
      toast.dismiss('purchase');
      
      if (result.invoiceLink) {
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.openInvoice(result.invoiceLink, (status) => {
            if (status === 'paid') {
              toast.success("Ödeme başarılı! Yıldızlar eklendi.");
              refresh();
            } else if (status === 'cancelled') {
              toast.error("Ödeme iptal edildi.");
            } else {
              toast.error("Ödeme başarısız oldu.");
            }
          });
        } else {
          window.open(result.invoiceLink, '_blank');
        }
      }
    } catch (e: any) {
      toast.error(e.message || "Satın alma işlemi başarısız.");
      toast.dismiss('purchase');
    }
  };

  return (
    <div className="flex flex-col h-full pt-8 pb-4 px-4 overflow-y-auto">
      
      <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-[#5c3a21] rounded-2xl p-6 mb-6 shadow-xl border-2 border-purple-500/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="bg-black/40 rounded-full px-4 py-1.5 mb-4 border border-white/10 flex items-center gap-2">
            <span className="text-[#f5c842] font-black">🪙 {user?.coins?.toLocaleString() ?? 0}</span>
            <span className="opacity-50 text-sm">Coin</span>
          </div>
          <h1 className="text-2xl font-black text-white drop-shadow-lg mb-2 flex items-center justify-center gap-2">
            <Star className="text-yellow-400 fill-yellow-400" size={28} />
            Telegram Stars Mağazası
          </h1>
          <p className="text-purple-200 text-sm font-bold opacity-90">Coinlerini gerçek Telegram Stars'a dönüştür!</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex-1 flex justify-center items-center font-bold opacity-60">Paketler Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {packages?.map((pkg) => (
            <div key={pkg.id} className={`wood-panel relative p-4 flex flex-col items-center text-center ${pkg.popular ? 'border-[#f5c842] ring-2 ring-[#f5c842]/50' : ''}`}>
              {pkg.popular && (
                <div className="absolute -top-3 inset-x-0 mx-auto w-max bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-red-700 shadow-md">
                  EN POPÜLER
                </div>
              )}
              
              <div className="text-4xl drop-shadow-md mb-2 relative">
                ⭐
                {pkg.stars > 100 && <span className="absolute -right-2 -bottom-2 text-2xl">✨</span>}
              </div>
              
              <div className="font-black text-xl mb-1">{pkg.stars} Stars</div>
              
              <div className="text-xs font-bold text-green-200 bg-black/20 px-2 py-1 rounded mb-4">
                {pkg.label}
              </div>
              
              <button 
                onClick={() => handlePurchase(pkg.id, pkg.coinsRequired)}
                className={`w-full py-2 rounded-xl font-black text-sm uppercase tracking-wide transition-transform active:translate-y-1 ${
                  user && user.coins >= pkg.coinsRequired 
                  ? 'bg-gradient-to-b from-[#f5c842] to-[#d97706] text-black shadow-[0_4px_0_#92400e]'
                  : 'bg-gray-600 text-gray-300 shadow-[0_4px_0_#334155] cursor-not-allowed'
                }`}
              >
                🪙 {pkg.coinsRequired.toLocaleString()}
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-auto pt-6 text-center opacity-50 text-xs font-bold px-6">
        Stars, Telegram'da dijital içerikler satın almak için kullanılabilir.
      </div>
    </div>
  );
}
