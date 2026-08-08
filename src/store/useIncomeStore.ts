import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveToCloud } from './syncMiddleware';

export type IncomeType = 'salary' | 'bonus' | 'reimbursement' | 'other';

export interface Income {
  id: string;
  type: IncomeType;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  recurring: boolean;
}

interface IncomeState {
  items: Income[];
  addItem: (item: Income) => void;
  removeItem: (id: string) => void;
  setItems: (items: Income[]) => void;
}

export const useIncomeStore = create<IncomeState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setItems: (items) => set({ items }),
    }),
    { name: 'income-storage' }
  )
);

useIncomeStore.subscribe((state, prev) => {
  if (state.items !== prev.items) saveToCloud('income', { items: state.items });
});
