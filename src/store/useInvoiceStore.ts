import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Invoice } from '../types';
import { saveToCloud } from './syncMiddleware';

interface InvoiceState {
  invoices: Invoice[];
  addInvoice: (inv: Invoice) => void;
  updateInvoice: (id: string, u: Partial<Invoice>) => void;
  removeInvoice: (id: string) => void;
  updateExpenseCategory: (invoiceId: string, expenseIndex: number, newCategory: string) => void;
  setInvoices: (invoices: Invoice[]) => void;
}

export const useInvoiceStore = create<InvoiceState>()(
  persist(
    (set) => ({
      invoices: [],
      addInvoice: (inv) => set((s) => ({ invoices: [inv, ...s.invoices] })),
      updateInvoice: (id, u) => set((s) => ({ invoices: s.invoices.map((i) => (i.id === id ? { ...i, ...u } : i)) })),
      removeInvoice: (id) => set((s) => ({ invoices: s.invoices.filter((i) => i.id !== id) })),
      updateExpenseCategory: (invoiceId, expenseIndex, newCategory) =>
        set((s) => ({
          invoices: s.invoices.map((inv) => {
            if (inv.id !== invoiceId) return inv;
            const expenses = inv.expenses.map((e, i) => (i === expenseIndex ? { ...e, category: newCategory } : e));
            return { ...inv, expenses };
          }),
        })),
      setInvoices: (invoices) => set({ invoices }),
    }),
    { name: 'invoice-storage' }
  )
);

// Sync to cloud
useInvoiceStore.subscribe((state, prev) => {
  if (state.invoices !== prev.invoices) saveToCloud('invoices', { invoices: state.invoices });
});

export function getExpensesByCategory(invoices: Invoice[]) {
  const m = new Map<string, number>();
  for (const i of invoices) if (i.status === 'done') for (const e of i.expenses) m.set(e.category, (m.get(e.category) ?? 0) + e.amount);
  return m;
}

export function getMonthlyTotals(invoices: Invoice[]) {
  const m = new Map<string, number>();
  for (const i of invoices) if (i.status === 'done') m.set(i.referenceMonth, (m.get(i.referenceMonth) ?? 0) + i.totalAmount);
  return Array.from(m.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, total]) => ({ month, total }));
}

export function getCategoryByMonth(invoices: Invoice[]) {
  const mm = new Map<string, Map<string, number>>();
  const cats = new Set<string>();
  for (const i of invoices) {
    if (i.status !== 'done') continue;
    const cm = mm.get(i.referenceMonth) ?? new Map<string, number>();
    for (const e of i.expenses) { cats.add(e.category); cm.set(e.category, (cm.get(e.category) ?? 0) + e.amount); }
    mm.set(i.referenceMonth, cm);
  }
  return Array.from(mm.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([month, cm]) => {
    const row: Record<string, string | number> = { month };
    for (const c of cats) row[c] = cm.get(c) ?? 0;
    return row;
  });
}

export function getAllCategories(invoices: Invoice[]) {
  const s = new Set<string>();
  for (const i of invoices) for (const e of i.expenses) s.add(e.category);
  return Array.from(s).sort();
}
