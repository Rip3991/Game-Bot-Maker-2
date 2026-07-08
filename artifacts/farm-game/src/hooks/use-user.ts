import { createContext, useContext, Dispatch, SetStateAction } from 'react';
import { User } from '@workspace/api-client-react';

export interface UserContextType {
  user: User | null;
  isLoading: boolean;
  refresh: () => Promise<User | null>;
  setUser: Dispatch<SetStateAction<User | null>>;
  telegramId: string;
  /** True only on the very first app open (new account just created) */
  isNewUser: boolean;
}

export const UserContext = createContext<UserContextType | null>(null);

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
