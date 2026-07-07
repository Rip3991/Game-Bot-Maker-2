import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Ticket, Users, Star, Trophy, Vault, Sparkles } from 'lucide-react';

export function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { path: '/',            icon: Home,     label: 'Çiftlik'  },
    { path: '/spin',        icon: Ticket,   label: 'Çark'     },
    { path: '/vault',       icon: Vault,    label: 'Kasa'     },
    { path: '/nfts',        icon: Sparkles, label: 'NFT'      },
    { path: '/invite',      icon: Users,    label: 'Davet'    },
    { path: '/leaderboard', icon: Trophy,   label: 'Sıralama' },
    { path: '/stars',       icon: Star,     label: 'Mağaza'   },
  ];

  return (
    <div className="h-[72px] w-full bg-[#a06235] border-t-4 border-[#5c3a21] shadow-[0_-4px_15px_rgba(0,0,0,0.4)] z-50 relative overflow-x-auto overflow-y-hidden">
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
      <div className="flex items-center justify-start h-full min-w-max px-1">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className="flex flex-col items-center justify-center gap-1 relative h-full py-1 z-10 touch-manipulation px-3 min-w-[60px]"
            >
              <div className={`transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'scale-125 text-[#f5c842] -translate-y-1' : 'text-white/70 scale-100 hover:text-white'}`}>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : ''} />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-wider transition-colors whitespace-nowrap ${isActive ? 'text-[#f5c842]' : 'text-white/70'}`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-10 h-1.5 bg-[#f5c842] rounded-t-full shadow-[0_0_8px_rgba(245,200,66,0.6)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
