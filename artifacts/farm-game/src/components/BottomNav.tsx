import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Ticket, Users, Star, Trophy, Vault, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="h-[76px] w-full bg-[#a06235] border-t-[5px] border-[#5c3a21] shadow-[0_-8px_20px_rgba(0,0,0,0.5)] z-50 relative overflow-x-auto overflow-y-hidden custom-scrollbar">
      {/* Wood grain pattern */}
      <div className="absolute inset-0 opacity-15 pointer-events-none bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.4)_10px,rgba(0,0,0,0.4)_20px)]" />
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)]" />
      
      <div className="flex items-center justify-start h-full min-w-max px-2 relative z-10">
        {tabs.map((tab) => {
          const isActive = location === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              href={tab.path}
              className="flex flex-col items-center justify-center relative h-full py-1 z-10 touch-manipulation px-3.5 min-w-[64px]"
            >
              <motion.div 
                className="flex flex-col items-center gap-1.5"
                whileTap={{ scale: 0.85 }}
                animate={isActive ? { y: -4 } : { y: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <motion.div 
                  className={`relative flex items-center justify-center p-2 rounded-xl transition-colors duration-300 ${isActive ? 'bg-[#5c3a21] shadow-inner' : ''}`}
                  animate={isActive ? { 
                    rotate: [-5, 5, -5, 5, 0],
                    boxShadow: ['inset 0 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(245,200,66,0.4)', 'inset 0 2px 4px rgba(0,0,0,0.5), 0 0 20px rgba(245,200,66,0.6)', 'inset 0 2px 4px rgba(0,0,0,0.5), 0 0 10px rgba(245,200,66,0.4)']
                  } : {}}
                  transition={{ 
                    rotate: { duration: 0.4 }, 
                    boxShadow: { repeat: Infinity, duration: 2 } 
                  }}
                >
                  <Icon 
                    size={24} 
                    strokeWidth={isActive ? 2.5 : 2} 
                    color={isActive ? '#f5c842' : 'rgba(255,255,255,0.7)'}
                    className={isActive ? 'drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : ''} 
                  />
                  {isActive && (
                    <motion.div 
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#f5c842] rounded-full border-2 border-[#5c3a21]"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    />
                  )}
                </motion.div>
                
                <motion.span 
                  className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap"
                  animate={{ 
                    color: isActive ? '#f5c842' : 'rgba(255,255,255,0.7)',
                    scale: isActive ? 1.05 : 1
                  }}
                >
                  {tab.label}
                </motion.span>
              </motion.div>

              {isActive && (
                <motion.div 
                  layoutId="activeTabGlow"
                  className="absolute bottom-0 w-12 h-1.5 bg-[#f5c842] rounded-t-full shadow-[0_-2px_10px_rgba(245,200,66,0.8)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
