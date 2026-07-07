import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Grip as Ticket, Users, Star, Trophy } from 'lucide-react';

export function BottomNav() {
  const [location] = useLocation();

  const tabs = [
    { path: '/', icon: Home, label: 'Çiftlik' },
    { path: '/spin', icon: Ticket, label: 'Çark' },
    { path: '/invite', icon: Users, label: 'Davet' },
    { path: '/stars', icon: Star, label: 'Mağaza' },
    { path: '/leaderboard', icon: Trophy, label: 'Sıralama' },
  ];

  return (
    <div className="h-[72px] w-full bg-[#a06235] border-t-4 border-[#5c3a21] shadow-[0_-4px_15px_rgba(0,0,0,0.4)] z-50 flex items-center justify-around px-1 relative">
       <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,black_1px,transparent_1px)] bg-[size:4px_4px] pointer-events-none" />
       {tabs.map((tab) => {
         const isActive = location === tab.path;
         const Icon = tab.icon;
         return (
           <Link key={tab.path} href={tab.path} className="flex-1 flex flex-col items-center justify-center gap-1 relative h-full py-1 z-10 touch-manipulation">
             <div className={`transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isActive ? 'scale-125 text-[#f5c842] -translate-y-1' : 'text-white/70 scale-100 hover:text-white'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : ''} />
             </div>
             <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${isActive ? 'text-[#f5c842]' : 'text-white/70'}`}>
               {tab.label}
             </span>
             {isActive && (
               <div className="absolute bottom-0 w-10 h-1.5 bg-[#f5c842] rounded-t-full shadow-[0_0_8px_rgba(245,200,66,0.6)]" />
             )}
           </Link>
         );
       })}
    </div>
  );
}
