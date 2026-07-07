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
import { useUser } from './hooks/use-user';
import { UserProvider } from './context/UserProvider';
import { BottomNav } from './components/BottomNav';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState } from 'react';
import mascotAvatar from './assets/mascot-avatar.png';
import { WithdrawModal } from './components/WithdrawModal';
import { Toaster as SonnerToaster } from 'sonner';

const queryClient = new QueryClient();

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
      <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-[#5ab327] items-center justify-center shadow-2xl">
        <motion.img
          src={mascotAvatar}
          alt="Sarı"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          className="w-24 h-24 drop-shadow-xl mb-6 bg-yellow-400 rounded-full border-4 border-white shadow-inner"
        />
        <div className="font-black text-white text-xl drop-shadow-md animate-pulse">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-[#5ab327] overflow-hidden relative shadow-2xl">
      <div className="flex-1 relative overflow-hidden bg-[#5ab327]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={location}
            initial={{ opacity: 0, x: 10, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            className="h-full w-full absolute inset-0"
          >
            <Switch location={location}>
              <Route path="/" component={GameView} />
              <Route path="/spin" component={SpinPage} />
              <Route path="/invite" component={InvitePage} />
              <Route path="/stars" component={StarsShopPage} />
              <Route path="/leaderboard" component={LeaderboardPage} />
              <Route component={NotFound} />
            </Switch>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Withdraw button — only on main game screen */}
      {location === '/' && (
        <div className="absolute bottom-[80px] inset-x-0 p-4 bg-gradient-to-t from-black/50 to-transparent z-40 pointer-events-none">
          <button
            onClick={() => setWithdrawOpen(true)}
            className="w-full bg-gradient-to-b from-[#2AABEE] to-[#229ED9] text-white font-black text-lg py-4 rounded-2xl shadow-[0_6px_0_#1b7ea8,0_15px_20px_rgba(0,0,0,0.4)] border-2 border-white/20 active:translate-y-[6px] active:shadow-[0_0px_0_#1b7ea8,0_5px_10px_rgba(0,0,0,0.4)] transition-all pointer-events-auto flex items-center justify-center gap-2"
          >
            💸 Para Çek (max 350 TL)
          </button>
        </div>
      )}

      <BottomNav />

      {/* Withdraw modal */}
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
