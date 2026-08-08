import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../services/authService';
import { getCurrentUser, signIn, signUp, confirmSignUp, signOut as doSignOut } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser().then((u) => { setUser(u); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleSignIn = useCallback(async (email: string, password: string) => {
    const u = await signIn(email, password);
    setUser(u);
  }, []);

  const handleSignUp = useCallback(async (email: string, password: string, name?: string) => {
    await signUp(email, password, name);
  }, []);

  const handleConfirm = useCallback(async (email: string, code: string) => {
    await confirmSignUp(email, code);
  }, []);

  const handleSignOut = useCallback(() => {
    doSignOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn: handleSignIn, signUp: handleSignUp, confirmSignUp: handleConfirm, signOut: handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}
