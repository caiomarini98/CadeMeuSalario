import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AuthUser } from '../services/authService';
import { getCurrentUser, signIn, signUp, confirmSignUp, signOut as doSignOut } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isDemo: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  confirmSignUp: (email: string, code: string) => Promise<void>;
  signOut: () => void;
  enterDemo: () => void;
  exitDemo: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}

const DEMO_USER: AuthUser = {
  email: 'visitante@demo.com',
  name: 'Visitante',
  sub: 'demo-user-id',
  role: 'user',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check if demo mode was active
    if (sessionStorage.getItem('kdms-demo') === 'true') {
      setUser(DEMO_USER);
      setIsDemo(true);
      setLoading(false);
      return;
    }
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
    if (isDemo) {
      sessionStorage.removeItem('kdms-demo');
      setIsDemo(false);
      setUser(null);
      // Clear demo data from stores
      localStorage.removeItem('portfolio-storage');
      localStorage.removeItem('fixed-income-storage');
      localStorage.removeItem('invoice-storage');
      window.location.reload();
      return;
    }
    doSignOut();
    setUser(null);
  }, [isDemo]);

  const enterDemo = useCallback(() => {
    sessionStorage.setItem('kdms-demo', 'true');
    setUser(DEMO_USER);
    setIsDemo(true);
  }, []);

  const exitDemo = useCallback(() => {
    sessionStorage.removeItem('kdms-demo');
    setIsDemo(false);
    setUser(null);
    localStorage.removeItem('portfolio-storage');
    localStorage.removeItem('fixed-income-storage');
    localStorage.removeItem('invoice-storage');
    window.location.reload();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isDemo, signIn: handleSignIn, signUp: handleSignUp, confirmSignUp: handleConfirm, signOut: handleSignOut, enterDemo, exitDemo }}>
      {children}
    </AuthContext.Provider>
  );
}
