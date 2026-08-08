import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { FixedIncome } from '../types';
import { saveToCloud } from './syncMiddleware';

interface FixedIncomeState {
  items: FixedIncome[];
  addItem: (item: FixedIncome) => void;
  updateItem: (id: string, u: Partial<FixedIncome>) => void;
  removeItem: (id: string) => void;
  setItems: (items: FixedIncome[]) => void;
}

export const useFixedIncomeStore = create<FixedIncomeState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [item, ...s.items] })),
      updateItem: (id, u) => set((s) => ({ items: s.items.map((i) => (i.id === id ? { ...i, ...u } : i)) })),
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      setItems: (items) => set({ items }),
    }),
    { name: 'fixed-income-storage' }
  )
);

useFixedIncomeStore.subscribe((state, prev) => {
  if (state.items !== prev.items) saveToCloud('fixedIncome', { items: state.items });
});
