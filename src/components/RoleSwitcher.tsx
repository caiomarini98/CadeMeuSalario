import { Eye, X, Play } from 'lucide-react';
import { useSimStore } from '../hooks/useFeatureGate';
import { useFeatureGate } from '../hooks/useFeatureGate';
import type { UserRole, UserPlan } from '../services/authService';

const ROLES: { value: UserRole | null; label: string }[] = [
  { value: null, label: 'Admin (real)' },
  { value: 'user', label: 'User' },
  { value: 'advisor', label: 'Consultor' },
];

const PLANS: { value: UserPlan | null; label: string }[] = [
  { value: null, label: 'Premium (real)' },
  { value: 'free', label: 'Free' },
  { value: 'premium', label: 'Premium' },
];

export function RoleSwitcher() {
  const { isAdmin } = useFeatureGate();
  const { simRole, simPlan, setSimRole, setSimPlan, setSimTour } = useSimStore();

  if (!isAdmin && !simRole && !simPlan) return null;

  const isSimulating = simRole || simPlan;

  return (
    <div className="fixed bottom-20 md:bottom-4 right-4 z-50 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 shadow-xl max-w-[240px]">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[#d4a017] text-sm font-medium">
          <Eye size={12} />
          <span>Simular visão</span>
        </div>
        {isSimulating && (
          <button onClick={() => { setSimRole(null); setSimPlan(null); }} className="text-[#8a8580] hover:text-white cursor-pointer">
            <X size={12} />
          </button>
        )}
      </div>
      <div className="space-y-2">
        <select value={simRole ?? ''} onChange={(e) => setSimRole((e.target.value || null) as UserRole | null)}
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-[#f0ece4] cursor-pointer">
          {ROLES.map((r) => <option key={r.label} value={r.value ?? ''}>{r.label}</option>)}
        </select>
        <select value={simPlan ?? ''} onChange={(e) => setSimPlan((e.target.value || null) as UserPlan | null)}
          className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-[#f0ece4] cursor-pointer">
          {PLANS.map((p) => <option key={p.label} value={p.value ?? ''}>{p.label}</option>)}
        </select>
        <button onClick={() => setSimTour(true)}
          className="w-full flex items-center justify-center gap-1.5 bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-[#a0998a] hover:text-[#d4a017] hover:border-[#d4a017]/30 transition-colors cursor-pointer">
          <Play size={10} />Ver Tour
        </button>
      </div>
      {isSimulating && (
        <div className="mt-2 text-sm text-[#d4a017]/70 text-center">
          Visualizando como: {simRole ?? 'admin'} / {simPlan ?? 'premium'}
        </div>
      )}
    </div>
  );
}
