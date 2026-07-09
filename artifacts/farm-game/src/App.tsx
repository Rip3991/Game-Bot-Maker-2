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
import AdminPage from './pages/AdminPage';
import TasksPage from './pages/TasksPage';
import ProfilePage from './pages/ProfilePage';
import TradePage from './pages/TradePage';
import { useUser } from './hooks/use-user';
import { UserProvider } from './context/UserProvider';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useState, useEffect, useCallback } from 'react';
import { WithdrawModal } from './components/WithdrawModal';
import { AchievementsPanel, useAchievementCount } from './components/AchievementsPanel';
import { Toaster as SonnerToaster } from 'sonner';
import { initI18n } from './lib/i18n';
import LoadingScreen from './components/LoadingScreen';
import { initBackgroundMusic, resumeBackgroundMusic, setMusicEnabled, isMusicEnabled } from './lib/sound';
import {
  FarmIcon, SpinIcon, NftIcon, TaskIcon, InviteIcon,
  LeaderboardIcon, ShopIcon, AchievementIcon, MusicIcon, AdminIcon, TradeIcon,
} from './components/NavIcons';

initI18n();

const queryClient = new QueryClient();

/* ── Permanent right-side navigation strip ── */
const RIGHT_NAV = [
  { label: 'Çiftlik', Icon: FarmIcon,        path: '/',            accentColor: '#4ade80', shadowColor: 'rgba(74,222,128,0.35)' },
  { label: 'Çark',   Icon: SpinIcon,         path: '/spin',        accentColor: '#fde68a', shadowColor: 'rgba(253,230,138,0.35)' },
  { label: 'İlanlar', Icon: NftIcon,          path: '/nfts',        accentColor: '#c084fc', shadowColor: 'rgba(192,132,252,0.35)' },
  { label: 'Görev',  Icon: TaskIcon,         path: '/tasks',       accentColor: '#fde68a', shadowColor: 'rgba(251,191,36,0.35)' },
  { label: 'Davet',  Icon: InviteIcon,       path: '/invite',      accentColor: '#4ade80', shadowColor: 'rgba(74,222,128,0.35)' },
  { label: 'Liste',  Icon: LeaderboardIcon,  path: '/leaderboard', accentColor: '#fbbf24', shadowColor: 'rgba(251,191,36,0.35)' },
  { label: 'Mağaza', Icon: ShopIcon,         path: '/stars',       accentColor: '#fde68a', shadowColor: 'rgba(253,230,138,0.35)' },
] as const;

const ADMIN_IDS = ['8652151076'];

function RightNav({ onAchievementsOpen, musicOn, onMusicToggle }: { onAchievementsOpen: () => void; musicOn: boolean; onMusicToggle: () => void }) {
  const [location, navigate] = useLocation();
  const achievementCount = useAchievementCount();
  const { telegramId } = useUser();
  const isAdmin = ADMIN_IDS.includes(telegramId);

  return (
    <div
      className="flex-shrink-0 flex flex-col items-center py-2 gap-1.5 overflow-y-auto"
      style={{
        width: 52,
        background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(5,18,3,0.6) 100%)',
        borderLeft: '1px solid rgba(74,122,47,0.22)',
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
              background: 'linear-gradient(180deg, #3d8b1c 0%, #2a6010 100%)',
              borderColor: '#6abf30',
              boxShadow: `0 3px 0 #1a4008, 0 0 10px ${item.shadowColor}`,
            } : {}}
          >
            <item.Icon size={20} active={isActive} />
            <span
              className="font-black leading-tight text-center"
              style={{ fontSize: 7.5, color: isActive ? item.accentColor : 'rgba(180,220,140,0.55)' }}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      {/* Separator */}
      <div className="w-7 h-px my-0.5" style={{ background: 'rgba(74,122,47,0.3)' }} />

      {/* Achievements button */}
      <button
        onClick={onAchievementsOpen}
        className="right-nav-btn flex-shrink-0 relative"
        style={{
          background: 'linear-gradient(180deg, #2d1060 0%, #1a0840 100%)',
          borderColor: 'rgba(167,139,250,0.5)',
          boxShadow: '0 3px 0 #0a0420, 0 0 10px rgba(167,139,250,0.3)',
        }}
      >
        <AchievementIcon size={20} active />
        <span className="font-black leading-tight text-center" style={{ fontSize: 7.5, color: '#c084fc' }}>
          Ödül
        </span>
        {achievementCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-red-300 leading-none" style={{ fontSize: 7 }}>
            {achievementCount}
          </span>
        )}
      </button>

      {/* Music toggle button */}
      <button
        onClick={onMusicToggle}
        className="right-nav-btn flex-shrink-0"
        style={musicOn ? {
          background: 'linear-gradient(180deg, #5c3a08 0%, #3a2004 100%)',
          borderColor: 'rgba(245,200,66,0.5)',
          boxShadow: '0 3px 0 #1a1000, 0 0 10px rgba(245,200,66,0.3)',
        } : {
          background: 'linear-gradient(180deg, #1a1a1a 0%, #111 100%)',
          borderColor: 'rgba(255,255,255,0.1)',
        }}
      >
        <MusicIcon size={20} active={musicOn} on={musicOn} />
        <span className="font-black leading-tight text-center" style={{ fontSize: 7.5, color: musicOn ? '#fde68a' : 'rgba(255,255,255,0.3)' }}>
          {musicOn ? 'Müzik' : 'Sessiz'}
        </span>
      </button>

      {/* Admin button — only for admin users */}
      {isAdmin && (
        <button
          onClick={() => navigate('/admin')}
          className="right-nav-btn flex-shrink-0"
          style={{
            background: location === '/admin'
              ? 'linear-gradient(180deg, #5a0808 0%, #3a0404 100%)'
              : 'linear-gradient(180deg, #2a0404 0%, #1a0202 100%)',
            borderColor: location === '/admin' ? 'rgba(252,165,165,0.5)' : 'rgba(200,50,50,0.3)',
            boxShadow: location === '/admin' ? '0 3px 0 #0a0000, 0 0 10px rgba(220,38,38,0.4)' : '0 3px 0 rgba(0,0,0,0.4)',
          }}
        >
          <AdminIcon size={20} active={location === '/admin'} />
          <span className="font-black leading-tight text-center" style={{ fontSize: 7.5, color: '#fca5a5' }}>
            Admin
          </span>
        </button>
      )}
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  const [isWelcomed, setIsWelcomed] = useState(
    () => localStorage.getItem('farm_welcomed_v1') === 'true'
  );
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [musicOn, setMusicOn] = useState(() => isMusicEnabled());
  const { isLoading } = useUser();

  // Initialize music on first user gesture
  useEffect(() => {
    const handleGesture = () => {
      initBackgroundMusic();
      resumeBackgroundMusic();
    };
    window.addEventListener('touchstart', handleGesture, { once: true });
    window.addEventListener('click', handleGesture, { once: true });
    return () => {
      window.removeEventListener('touchstart', handleGesture);
      window.removeEventListener('click', handleGesture);
    };
  }, []);

  const handleMusicToggle = useCallback(() => {
    const next = !musicOn;
    setMusicOn(next);
    setMusicEnabled(next);
  }, [musicOn]);

  // Show loading screen once per session — gate by animation, not by isLoading
  // (the 2.4s animation outlasts the API call in all realistic cases)
  const [screenDone, setScreenDone] = useState(
    () => sessionStorage.getItem('farm_loaded') === '1'
  );

  const handleScreenDone = () => {
    sessionStorage.setItem('farm_loaded', '1');
    setScreenDone(true);
  };

  if (!isWelcomed) {
    return <WelcomePage onComplete={() => setIsWelcomed(true)} />;
  }

  // First load this session: show the full animated intro screen
  if (!screenDone) {
    return (
      <AnimatePresence mode="wait">
        <LoadingScreen key="loading-screen" onDone={handleScreenDone} />
      </AnimatePresence>
    );
  }

  // Screen done but API still loading (rare / slow network): lightweight fallback
  if (isLoading) {
    return (
      <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #2e6012 0%, #4ea824 100%)' }}>
        <motion.div className="text-5xl" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>🌾</motion.div>
        <div className="mt-4 font-black text-white text-lg">Hazırlanıyor...</div>
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
                <Route path="/tasks" component={TasksPage} />
                <Route path="/stars" component={StarsShopPage} />
                <Route path="/leaderboard" component={LeaderboardPage} />
                <Route path="/admin" component={AdminPage} />
                <Route path="/profile/:telegramId" component={({ params }: { params: { telegramId: string } }) => <ProfilePage telegramId={params.telegramId} />} />
                <Route component={NotFound} />
              </Switch>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Permanent right nav */}
        <RightNav onAchievementsOpen={() => setAchievementsOpen(true)} musicOn={musicOn} onMusicToggle={handleMusicToggle} />
      </div>

      <AchievementsPanel isOpen={achievementsOpen} onClose={() => setAchievementsOpen(false)} />
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
