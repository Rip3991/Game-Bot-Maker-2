import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import GameView from './pages/GameView';
import SpinPage from './pages/SpinPage';
import InvitePage from './pages/InvitePage';
import StarsShopPage from './pages/StarsShopPage';
import LeaderboardPage from './pages/LeaderboardPage';
import WelcomePage from './pages/WelcomePage';
import VaultPage from './pages/VaultPage';
import NftPage from './pages/NftPage';
import { useUser } from './hooks/use-user';
import { UserProvider } from './context/UserProvider';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import mascotAvatar from './assets/mascot-avatar.png';
import { WithdrawModal } from './components/WithdrawModal';
import { Toaster as SonnerToaster } from 'sonner';
import { initI18n } from './lib/i18n';

initI18n();

const queryClient = new QueryClient();

/* ── Permanent right-side navigation strip ── */
const RIGHT_NAV = [
  { label: 'Çiftlik', icon: '🌾', path: '/' },
  { label: 'Çark',   icon: '🎡', path: '/spin' },
  { label: 'Kasa',   icon: '🏦', path: '/vault' },
  { label: 'NFT',    icon: '✨', path: '/nfts' },
  { label: 'Davet',  icon: '👥', path: '/invite' },
  { label: 'Liste',  icon: '🏆', path: '/leaderboard' },
  { label: 'Mağaza', icon: '🌟', path: '/stars' },
] as const;

function RightNav() {
  const [location, navigate] = useLocation();
  return (
    <div
      className="flex-shrink-0 flex flex-col items-center py-3 gap-2 overflow-y-auto"
      style={{
        width: 54,
        background: 'rgba(0,0,0,0.28)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {RIGHT_NAV.map(item => {
        const isActive = location === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="right-nav-btn flex-shrink-0"
            style={isActive ? {
              background: 'linear-gradient(180deg, #5cb82a 0%, #3d8b1c 100%)',
              borderColor: '#2e6612',
              boxShadow: '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25)',
            } : undefined}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span
              className="text-[8px] font-black leading-tight text-center"
              style={{ color: isActive ? 'white' : '#333' }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const [isWelcomed, setIsWelcomed] = useState(
    () => localStorage.getItem('farm_welcomed_v1') === 'true'
  );
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const { isLoading } = useUser();

  if (!isWelcomed) {
    return <WelcomePage onComplete={() => setIsWelcomed(true)} />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-[#4ea824] items-center justify-center shadow-2xl">
        <motion.img
          src={mascotAvatar}
          alt="Sarı"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-24 h-24 drop-shadow-xl mb-6 bg-yellow-400 rounded-full border-4 border-white shadow-inner"
        />
        <div className="font-black text-white text-xl drop-shadow-md animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    /* Outer shell */
    <div
      className="flex flex-col h-[100dvh] w-full max-w-md mx-auto overflow-hidden shadow-2xl"
      style={{ background: '#4ea824' }}
    >
      {/* Content row: page content LEFT + right nav RIGHT (always visible) */}
      <div className="flex flex-1 overflow-hidden">

        {/* Page area */}
        <div className="flex-1 relative overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={location}
              initial={{ opacity: 0, x: 10, scale: 0.99 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -10, scale: 0.99 }}
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
              className="h-full w-full absolute inset-0"
            >
              <Switch location={location}>
                <Route path="/" component={GameView} />
                <Route path="/spin" component={SpinPage} />
                <Route path="/vault" component={VaultPage} />
                <Route path="/nfts" component={NftPage} />
                <Route path="/invite" component={InvitePage} />
                <Route path="/stars" component={StarsShopPage} />
                <Route path="/leaderboard" component={LeaderboardPage} />
                <Route component={NotFound} />
              </Switch>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Permanent right nav */}
        <RightNav />
      </div>

      <WithdrawModal isOpen={withdrawOpen} onClose={() => setWithdrawOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
          <SonnerToaster position="top-center" richColors />
        </TooltipProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
