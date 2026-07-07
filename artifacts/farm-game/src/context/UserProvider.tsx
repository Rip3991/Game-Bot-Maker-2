import React, { useEffect, useState, useCallback } from 'react';
import { useInitUser, User } from '@workspace/api-client-react';
import { UserContext } from '../hooks/use-user';

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initUserMut = useInitUser();

  const telegramId =
    window.Telegram?.WebApp?.initDataUnsafe?.user?.id?.toString() ?? "demo_user";

  const refresh = useCallback(async () => {
    try {
      const firstName =
        window.Telegram?.WebApp?.initDataUnsafe?.user?.first_name ?? "Demo Çiftçi";
      const username =
        window.Telegram?.WebApp?.initDataUnsafe?.user?.username ?? null;
      const initData = window.Telegram?.WebApp?.initData ?? "";
      const urlParams = new URLSearchParams(initData);
      const referredBy = urlParams.get("start_param") ?? null;

      const data = await initUserMut.mutateAsync({
        data: { telegramId, firstName, username, referredBy },
      });
      setUser(data);
    } catch (e) {
      console.error("Failed to init user", e);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [telegramId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <UserContext.Provider value={{ user, isLoading, setUser, refresh, telegramId }}>
      {children}
    </UserContext.Provider>
  );
}
