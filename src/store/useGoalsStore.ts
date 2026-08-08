import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SavingsGoal } from '../types';
import { saveToCloud } from './syncMiddleware';

interface GoalsState {
  goals: SavingsGoal[];
  addGoal: (goal: SavingsGoal) => void;
  updateGoal: (id: string, u: Partial<SavingsGoal>) => void;
  removeGoal: (id: string) => void;
  addToGoal: (id: string, amount: number) => void;
  withdrawFromGoal: (id: string, amount: number) => void;
  setGoals: (goals: SavingsGoal[]) => void;
}

export const useGoalsStore = create<GoalsState>()(
  persist(
    (set) => ({
      goals: [],
      addGoal: (goal) => set((s) => ({ goals: [goal, ...s.goals] })),
      updateGoal: (id, u) => set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...u } : g)) })),
      removeGoal: (id) => set((s) => ({ goals: s.goals.filter((g) => g.id !== id) })),
      addToGoal: (id, amount) => set((s) => ({
        goals: s.goals.map((g) => (g.id === id ? { ...g, currentAmount: g.currentAmount + amount, investedAmount: (g.investedAmount ?? g.currentAmount) + amount } : g)),
      })),
      withdrawFromGoal: (id, amount) => set((s) => ({
        goals: s.goals.map((g) => (g.id === id ? { ...g, currentAmount: Math.max(0, g.currentAmount - amount), investedAmount: Math.max(0, (g.investedAmount ?? g.currentAmount) - amount) } : g)),
      })),
      setGoals: (goals) => set({ goals }),
    }),
    { name: 'goals-storage' }
  )
);

useGoalsStore.subscribe((state, prev) => {
  if (state.goals !== prev.goals) saveToCloud('goals', { goals: state.goals });
});
