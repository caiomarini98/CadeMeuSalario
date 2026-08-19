import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { DEMO_STOCKS, DEMO_FIXED_INCOME, DEMO_INVOICES } from './data/demoData';
import { exchangeCodeForTokens } from './services/authService';
import { LoginPage } from './pages/LoginPage';
import { LandingPage } from './pages/LandingPage';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfUse } from './pages/TermsOfUse';
import { Paywall } from './components/Paywall';
import { Sidebar, type Page } from './components/Sidebar';
import { HomePage } from './pages/HomePage';
import { PortfolioPage } from './pages/PortfolioPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { IncomePage } from './pages/IncomePage';
import { enableSync, loadFromCloud } from './store/syncMiddleware';
import { usePortfolioStore } from './store/usePortfolioStore';
import { useInvoiceStore } from './store/useInvoiceStore';
import { useFixedIncomeStore } from './store/useFixedIncomeStore';
import { useGoalsStore } from './store/useGoalsStore';
import { useIncomeStore, type Income } from './store/useIncomeStore';
import type { Stock, Invoice, FixedIncome, SavingsGoal } from './types';
import { Loader2 } from 'lucide-react';
import { RoleSwitcher } from './components/RoleSwitcher';
import { OnboardingTour } from './components/OnboardingTour';
import { useSimStore } from './hooks/useFeatureGate';

function AppContent() {
  const { user, loading: authLoading, isDemo, signOut } = useAuth();
  const [page, setPage] = useState<Page>('home');
  const [syncing, setSyncing] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const simTour = useSimStore((s) => s.simTour);

  // Handle OAuth callback (Google login redirect)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      exchangeCodeForTokens(code)
        .then(() => { window.history.replaceState({}, '', '/'); window.location.reload(); })
        .catch((err) => { console.error('OAuth callback error:', err); window.history.replaceState({}, '', '/'); });
    }
  }, []);

  const completeTour = () => {
    setShowTour(false);
    if (user) localStorage.setItem(`tour-done-${user.sub}`, '1');
  };

  // Load demo data when entering demo mode
  useEffect(() => {
    if (!isDemo || !user) return;
    usePortfolioStore.getState().setStocks(DEMO_STOCKS);
    useFixedIncomeStore.getState().setItems(DEMO_FIXED_INCOME);
    useInvoiceStore.getState().setInvoices(DEMO_INVOICES);
    usePortfolioStore.getState().refreshQuotes();
  }, [isDemo, user]);

  // Load data from cloud when user logs in
  useEffect(() => {
    if (!user || isDemo) return;
    enableSync();
    setSyncing(true);
    Promise.all([
      loadFromCloud<{ stocks: Stock[] }>('portfolio'),
      loadFromCloud<{ invoices: Invoice[] }>('invoices'),
      loadFromCloud<{ items: FixedIncome[] }>('fixedIncome'),
      loadFromCloud<{ goals: SavingsGoal[] }>('goals'),
      loadFromCloud<{ items: Income[] }>('income'),
    ]).then(([portfolio, invoices, fixedIncome, goals, income]) => {
      // Load from cloud, or keep local data and push to cloud
      const localStocks = usePortfolioStore.getState().stocks;
      const localInvoices = useInvoiceStore.getState().invoices;
      const localFi = useFixedIncomeStore.getState().items;
      const localGoals = useGoalsStore.getState().goals;

      if (portfolio?.stocks && portfolio.stocks.length > 0) {
        usePortfolioStore.getState().setStocks(portfolio.stocks);
      } else if (localStocks.length > 0) {
        // Push local data to cloud
        import('./store/syncMiddleware').then(({ saveToCloud }) => saveToCloud('portfolio', { stocks: localStocks }));
      }

      if (invoices?.invoices && invoices.invoices.length > 0) {
        useInvoiceStore.getState().setInvoices(invoices.invoices);
      } else if (localInvoices.length > 0) {
        import('./store/syncMiddleware').then(({ saveToCloud }) => saveToCloud('invoices', { invoices: localInvoices }));
      }

      if (fixedIncome?.items && fixedIncome.items.length > 0) {
        useFixedIncomeStore.getState().setItems(fixedIncome.items);
      } else if (localFi.length > 0) {
        import('./store/syncMiddleware').then(({ saveToCloud }) => saveToCloud('fixedIncome', { items: localFi }));
      }

      if (goals?.goals && goals.goals.length > 0) {
        useGoalsStore.getState().setGoals(goals.goals);
      } else if (localGoals.length > 0) {
        import('./store/syncMiddleware').then(({ saveToCloud }) => saveToCloud('goals', { goals: localGoals }));
      }

      const localIncome = useIncomeStore.getState().items;
      if (income?.items && income.items.length > 0) {
        useIncomeStore.getState().setItems(income.items);
      } else if (localIncome.length > 0) {
        import('./store/syncMiddleware').then(({ saveToCloud }) => saveToCloud('income', { items: localIncome }));
      }

      usePortfolioStore.getState().refreshQuotes();
    }).finally(() => {
      setSyncing(false);
      if (!localStorage.getItem(`tour-done-${user.sub}`)) setShowTour(true);
    });
  }, [user, isDemo]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-[#d4a017]" />
      </div>
    );
  }

  if (!user) {
    // Legal pages accessible without login
    if (window.location.pathname === '/privacidade') return <PrivacyPolicy onBack={() => { window.location.href = '/'; }} />;
    if (window.location.pathname === '/termos') return <TermsOfUse onBack={() => { window.location.href = '/'; }} />;
    // Show login page if navigated to /app, otherwise show landing page
    if (window.location.pathname === '/app') return <LoginPage />;
    return <LandingPage />;
  }

  // If user has no active plan and is not admin/demo, show paywall
  const hasPlan = user.role === 'admin' || isDemo || (user.plan && user.plan !== 'free');
  if (!hasPlan && window.location.search !== '?checkout=success') {
    return <Paywall userName={user.name ?? user.email} />;
  }

  if (syncing) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <Loader2 size={32} className="animate-spin text-[#d4a017]" />
        <p className="text-[#8a8580] text-sm">Carregando seus dados...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {isDemo && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#d4a017]/20 to-[#b8890f]/20 border-b border-[#d4a017]/30 backdrop-blur-sm">
          <div className="flex items-center justify-center gap-3 px-4 py-2 text-sm">
            <span className="bg-[#d4a017] text-[#1a1a1a] px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider">Demo</span>
            <span className="text-[#f0ece4]">Explorando com dados fictícios</span>
            <button onClick={signOut}
              className="ml-2 px-3 py-1 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#d4a017] text-[#d4a017] text-xs rounded-lg transition-all cursor-pointer">
              Sair do demo
            </button>
          </div>
        </div>
      )}
      <Sidebar currentPage={page} onNavigate={setPage} userName={user.name ?? user.email} onSignOut={signOut} />
      <main className={`md:ml-16 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-16 ${isDemo ? 'mt-10' : ''}`}>
        {page === 'home' && <HomePage onNavigate={setPage} />}
        {page === 'portfolio' && <PortfolioPage />}
        {page === 'invoices' && <InvoicesPage />}
        {page === 'income' && <IncomePage />}
      </main>
      <RoleSwitcher />
      {(showTour || simTour) && <OnboardingTour onNavigate={setPage} onComplete={simTour ? () => useSimStore.getState().setSimTour(false) : completeTour} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
