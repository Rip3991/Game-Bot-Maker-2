import React, { useEffect, useState, useCallback } from 'react';
import { useInitUser, User } from '@workspace/api-client-react';
import { UserContext } from '../hooks/use-user';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const initUserMut = useInitUser();

  const telegramId =
    window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() ?? "demo_user";

  const refresh = useCallback(async (): Promise<User | null> => {
    try {
      const firstName =
        window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name ?? "Demo Çiftçi";
      const username =
        window.Telegram?.WebApp?.initDataUnsafe?.user?.username ?? null;

      // Correct way to read start_param — from initDataUnsafe, not from initData string
      const startParam =
        window.Telegram?.WebApp?.initDataUnsafe?.start_param ?? null;

      const data = await initUserMut.mutateAsync({
        data: { telegramId, firstName, username, referredBy: startParam },
      });
      setUser(data);
      // isNewUser is true only when the backend created the account for the first time
      setIsNewUser(data.isNewUser === true);
      return data;
    } catch (e) {
      console.error("Failed to init user", e);
      return null;
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telegramId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll balance + coins every 30 seconds so admin-added funds appear automatically
  useEffect(() => {
    if (!telegramId || telegramId === 'demo_user') return;
    const id = setInterval(async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}api/users/${telegramId}/balance`);
        if (!res.ok) return;
        const { balance, coins } = await res.json();
        setUser(prev => prev ? { ...prev, balance, coins } : prev);
      } catch {}
    }, 30_000);
    return () => clearInterval(id);
  }, [telegramId]);

  return (
    <UserContext.Provider value={{ user, isLoading, setUser, refresh, telegramId, isNewUser }}>
      {children}
    </UserContext.Provider>
  );
}
