import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Stock, StockQuote } from '../types';
import { fetchQuotes } from '../services/quoteService';
import { saveToCloud } from './syncMiddleware';

interface PortfolioState {
  stocks: Stock[];
  quotes: Map<string, StockQuote>;
  isLoading: boolean;
  error: string | null;
  hydrated: boolean;
  addStock: (stock: Stock) => void;
  removeStock: (ticker: string) => void;
  refreshQuotes: () => Promise<void>;
  setStocks: (stocks: Stock[]) => void;
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      stocks: [], quotes: new Map(), isLoading: false, error: null, hydrated: false,
      addStock: (stock) => {
        const ticker = stock.ticker.toUpperCase();
        set((s) => {
          if (s.stocks.some((x) => x.ticker === ticker))
            return { stocks: s.stocks.map((x) => (x.ticker === ticker ? { ...stock, ticker } : x)) };
          return { stocks: [...s.stocks, { ...stock, ticker }] };
        });
        get().refreshQuotes();
      },
      removeStock: (ticker) => set((s) => ({ stocks: s.stocks.filter((x) => x.ticker !== ticker) })),
      refreshQuotes: async () => {
        const { stocks } = get();
        if (stocks.length === 0) return;
        set({ isLoading: true, error: null });
        try { set({ quotes: await fetchQuotes(stocks.map((s) => s.ticker)), isLoading: false }); }
        catch (e) { set({ error: e instanceof Error ? e.message : 'Erro', isLoading: false }); }
      },
      setStocks: (stocks) => set({ stocks }),
    }),
    {
      name: 'portfolio-storage',
      partialize: (s) => ({ stocks: s.stocks }),
      onRehydrateStorage: () => (state) => { if (state) { state.hydrated = true; state.refreshQuotes(); } },
    }
  )
);

// Sync stocks to cloud on changes
usePortfolioStore.subscribe((state, prev) => {
  if (state.stocks !== prev.stocks) saveToCloud('portfolio', { stocks: state.stocks });
});
