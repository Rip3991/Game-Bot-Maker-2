import { createContext, useContext, Dispatch, SetStateAction } from 'react';
import { User } from '@workspace/api-client-react';

export interface UserContextType {
  user: User | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  setUser: Dispatch<SetStateAction<User | null>>;
  telegramId: string;
}

export const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
