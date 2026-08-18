import { create } from 'zustand';
import { useAuth } from '../components/AuthProvider';
import type { UserRole, UserPlan } from '../services/authService';

type Feature = 'advisor' | 'invoices' | 'goals' | 'export';

interface SimState {
  simRole: UserRole | null;
  simPlan: UserPlan | null;
  simTour: boolean;
  setSimRole: (r: UserRole | null) => void;
  setSimPlan: (p: UserPlan | null) => void;
  setSimTour: (v: boolean) => void;
}

export const useSimStore = create<SimState>((set) => ({
  simRole: null,
  simPlan: null,
  simTour: false,
  setSimRole: (simRole) => set({ simRole }),
  setSimPlan: (simPlan) => set({ simPlan }),
  setSimTour: (simTour) => set({ simTour }),
}));

const ROLE_ACCESS: Record<Feature, UserRole[]> = {
  advisor: ['admin'],
  invoices: ['admin', 'user'],
  goals: ['admin', 'user'],
  export: ['admin', 'user'],
};

const PLAN_ACCESS: Record<Feature, UserPlan[]> = {
  advisor: ['premium'],
  invoices: ['free', 'premium'],
  goals: ['premium'],
  export: ['premium'],
};

export function useFeatureGate() {
  const { user } = useAuth();
  const { simRole, simPlan } = useSimStore();

  const realRole: UserRole = user?.role ?? 'user';
  const isAdmin = realRole === 'admin';

  const role: UserRole = (isAdmin && simRole) ? simRole : realRole;
  const plan: UserPlan = (isAdmin && simPlan) ? simPlan : 'premium';

  const hasAccess = (feature: Feature) => {
    if (role === 'advisor') return feature === 'invoices' || feature === 'goals';
    return (ROLE_ACCESS[feature]?.includes(role) ?? false) && (PLAN_ACCESS[feature]?.includes(plan) ?? false);
  };

  return { hasAccess, isAdmin, role, plan };
}
