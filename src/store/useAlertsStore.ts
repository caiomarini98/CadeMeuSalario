import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { saveToCloud } from './syncMiddleware';

export interface CategoryAlert {
  id: string;
  category: string;
  limitAmount: number;
  enabled: boolean;
}

interface AlertsState {
  alerts: CategoryAlert[];
  addAlert: (alert: CategoryAlert) => void;
  updateAlert: (id: string, u: Partial<CategoryAlert>) => void;
  removeAlert: (id: string) => void;
  setAlerts: (alerts: CategoryAlert[]) => void;
}

export const useAlertsStore = create<AlertsState>()(
  persist(
    (set) => ({
      alerts: [],
      addAlert: (alert) => set((s) => ({ alerts: [...s.alerts, alert] })),
      updateAlert: (id, u) => set((s) => ({ alerts: s.alerts.map((a) => (a.id === id ? { ...a, ...u } : a)) })),
      removeAlert: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
      setAlerts: (alerts) => set({ alerts }),
    }),
    { name: 'alerts-storage' }
  )
);

useAlertsStore.subscribe((state, prev) => {
  if (state.alerts !== prev.alerts) saveToCloud('alerts', { alerts: state.alerts });
});
