import { useState } from 'react';
import { Shield, Car, Home, Plane, GraduationCap, Heart, Gift, PiggyBank, Star, Plus, Trash2, ArrowUpRight, ArrowDownRight, Pencil, Check } from 'lucide-react';
import { useGoalsStore } from '../store/useGoalsStore';
import { GOAL_PRESETS } from '../types';
import type { GoalIcon, SavingsGoal } from '../types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ICON_MAP: Record<GoalIcon, typeof Shield> = {
  shield: Shield, car: Car, home: Home, plane: Plane,
  graduation: GraduationCap, heart: Heart, gift: Gift, piggy: PiggyBank, star: Star,
};

const moneyInputCls = "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-3 py-2.5 text-[#f0ece4] text-sm focus:outline-none focus:border-[#d4a017] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.12)] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function MoneyInput({ value, onChange, placeholder, onKeyDown, autoFocus }: {
  value: string; onChange: (v: string) => void; placeholder?: string; onKeyDown?: (e: React.KeyboardEvent) => void; autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8580] text-sm pointer-events-none">R$</span>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} onKeyDown={onKeyDown} autoFocus={autoFocus}
        className={moneyInputCls} />
    </div>
  );
}

function GoalCard({ goal }: { goal: SavingsGoal }) {
  const { removeGoal, addToGoal, withdrawFromGoal, updateGoal } = useGoalsStore();
  const [amount, setAmount] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [editingCurrent, setEditingCurrent] = useState(false);
  const [currentVal, setCurrentVal] = useState(String(goal.currentAmount));
  const [editingTarget, setEditingTarget] = useState(false);
  const [targetVal, setTargetVal] = useState(String(goal.targetAmount));
  const Icon = ICON_MAP[goal.icon] ?? Star;
  const pct = goal.targetAmount > 0 ? Math.min((goal.currentAmount / goal.targetAmount) * 100, 100) : 0;
  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const invested = goal.investedAmount ?? goal.currentAmount;
  const pl = goal.currentAmount - invested;
  const plPct = invested > 0 ? (pl / invested) * 100 : 0;

  const handleAdd = () => {
    const v = Number(amount);
    if (v > 0) { addToGoal(goal.id, v); setAmount(''); setShowActions(false); }
  };
  const handleWithdraw = () => {
    const v = Number(amount);
    if (v > 0) { withdrawFromGoal(goal.id, v); setAmount(''); setShowActions(false); }
  };
  const confirmCurrentEdit = () => {
    const v = Number(currentVal);
    if (v >= 0) updateGoal(goal.id, { currentAmount: v });
    setEditingCurrent(false);
  };
  const confirmTargetEdit = () => {
    const v = Number(targetVal);
    if (v > 0) updateGoal(goal.id, { targetAmount: v });
    setEditingTarget(false);
  };

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.4)] transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${goal.color}15` }}>
            <Icon size={20} style={{ color: goal.color }} />
          </div>
          <div>
            <h4 className="text-[#f0ece4] text-sm font-semibold">{goal.name}</h4>
            <p className="text-[#8a8580] text-sm mt-0.5">{pct.toFixed(0)}% concluído</p>
          </div>
        </div>
        <button onClick={() => removeGoal(goal.id)}
          className="text-[#8a8580] hover:text-[#d93636] transition-colors cursor-pointer p-1 rounded-lg hover:bg-[rgba(217,54,54,0.1)]">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: goal.color }} />
      </div>

      {/* Current amount (editable) */}
      <div className="flex items-center justify-between mb-2">
        <div>
          {editingCurrent ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8a8580] text-sm pointer-events-none">R$</span>
                <input type="number" value={currentVal} onChange={(e) => setCurrentVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmCurrentEdit(); if (e.key === 'Escape') setEditingCurrent(false); }}
                  className="w-28 bg-[#1a1a1a] border border-[#d4a017] rounded-lg pl-7 pr-2 py-1 text-[#f0ece4] text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" autoFocus />
              </div>
              <button onClick={confirmCurrentEdit} className="text-[#2d9d4e] cursor-pointer p-1 rounded-lg hover:bg-[rgba(45,157,78,0.1)]"><Check size={14} /></button>
            </div>
          ) : (
            <button onClick={() => { setCurrentVal(String(goal.currentAmount)); setEditingCurrent(true); }}
              className="flex items-center gap-1.5 text-[#f0ece4] text-sm font-bold hover:text-[#d4a017] transition-colors cursor-pointer">
              {fmt(goal.currentAmount)} <Pencil size={10} className="text-[#8a8580]" />
            </button>
          )}
        </div>
        {/* Target (editable) */}
        <div>
          {editingTarget ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <div className="relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8a8580] text-sm pointer-events-none">R$</span>
                <input type="number" value={targetVal} onChange={(e) => setTargetVal(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') confirmTargetEdit(); if (e.key === 'Escape') setEditingTarget(false); }}
                  className="w-28 bg-[#1a1a1a] border border-[#d4a017] rounded-lg pl-7 pr-2 py-1 text-[#f0ece4] text-sm focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" autoFocus />
              </div>
              <button onClick={confirmTargetEdit} className="text-[#2d9d4e] cursor-pointer p-1 rounded-lg hover:bg-[rgba(45,157,78,0.1)]"><Check size={14} /></button>
            </div>
          ) : (
            <button onClick={() => { setTargetVal(String(goal.targetAmount)); setEditingTarget(true); }}
              className="flex items-center gap-1 text-[#8a8580] text-sm hover:text-[#d4a017] transition-colors cursor-pointer">
              meta {fmt(goal.targetAmount)} <Pencil size={9} />
            </button>
          )}
        </div>
      </div>

      {/* Performance */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#8a8580] text-sm">Investido: {fmt(invested)}</span>
        {Math.abs(pl) > 0.01 && (
          <span className={`text-sm font-semibold ${pl >= 0 ? 'text-[#2d9d4e]' : 'text-[#d93636]'}`}>
            {pl >= 0 ? '+' : ''}{fmt(pl)} ({plPct >= 0 ? '+' : ''}{plPct.toFixed(1)}%)
          </span>
        )}
      </div>

      {remaining > 0 && (
        <p className="text-[#8a8580] text-sm mb-3">Faltam {fmt(remaining)}</p>
      )}

      {!showActions ? (
        <button onClick={() => setShowActions(true)}
          className="w-full py-2 rounded-xl text-sm font-medium border border-[#2a2a2a] text-[#a0998a] hover:border-[#d4a017] hover:text-[#d4a017] transition-all cursor-pointer">
          Movimentar
        </button>
      ) : (
        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
          <MoneyInput value={amount} onChange={setAmount} placeholder="0,00" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} autoFocus />
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-medium bg-[rgba(45,157,78,0.1)] text-[#2d9d4e] hover:bg-[rgba(45,157,78,0.2)] transition-all cursor-pointer">
              <ArrowUpRight size={12} />Depositar
            </button>
            <button onClick={handleWithdraw}
              className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-sm font-medium bg-[rgba(217,54,54,0.1)] text-[#d93636] hover:bg-[rgba(217,54,54,0.2)] transition-all cursor-pointer">
              <ArrowDownRight size={12} />Retirar
            </button>
          </div>
          <button onClick={() => { setShowActions(false); setAmount(''); }}
            className="w-full py-1.5 text-sm text-[#8a8580] hover:text-[#a0998a] cursor-pointer">
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}

export function SavingsGoals() {
  const { goals, addGoal } = useGoalsStore();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [selectedPreset, setSelectedPreset] = useState(0);

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  const handleAdd = () => {
    const t = Number(target);
    if (!name.trim() || t <= 0) return;
    const preset = GOAL_PRESETS[selectedPreset];
    addGoal({
      id: crypto.randomUUID(),
      name: name.trim(),
      icon: preset.icon,
      targetAmount: t,
      currentAmount: 0,
      investedAmount: 0,
      color: preset.color,
      createdAt: new Date().toISOString(),
    });
    setName(''); setTarget(''); setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[#f0ece4] text-sm font-semibold">Caixinhas</h3>
          {goals.length > 0 && (
            <p className="text-[#8a8580] text-sm mt-0.5">Total guardado: {fmt(totalSaved)}</p>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[#d4a017] text-[#1a1a1a] hover:bg-[#b8890f] hover:shadow-[0_4px_12px_rgba(212,160,23,0.4)] transition-all cursor-pointer">
          <Plus size={14} />Nova caixinha
        </button>
      </div>

      {showForm && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {GOAL_PRESETS.map((p, i) => {
              const Icon = ICON_MAP[p.icon];
              return (
                <button key={p.icon} onClick={() => { setSelectedPreset(i); if (!name) setName(p.label); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
                    selectedPreset === i
                      ? 'border-[#d4a017] bg-[rgba(212,160,23,0.08)] text-[#d4a017]'
                      : 'border-[#2a2a2a] text-[#8a8580] hover:border-[#d4a017]/50'
                  }`}>
                  <Icon size={14} style={{ color: p.color }} />{p.label}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[#8a8580] mb-1">Nome</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Reserva de emergência"
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-3 py-2.5 text-[#f0ece4] text-sm focus:outline-none focus:border-[#d4a017] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.12)]" />
            </div>
            <div>
              <label className="block text-sm text-[#8a8580] mb-1">Meta</label>
              <MoneyInput value={target} onChange={setTarget} placeholder="10.000" onKeyDown={(e) => e.key === 'Enter' && handleAdd()} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-[#d4a017] text-[#1a1a1a] hover:bg-[#b8890f] transition-all cursor-pointer">
              Criar caixinha
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-[#2a2a2a] text-[#a0998a] hover:border-[#8a8580] transition-all cursor-pointer">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {goals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => <GoalCard key={g.id} goal={g} />)}
        </div>
      ) : !showForm && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 text-center">
          <PiggyBank size={32} className="text-[#d4a017] mx-auto mb-3" />
          <p className="text-[#a0998a] text-sm">Nenhuma caixinha criada</p>
          <p className="text-[#8a8580] text-sm mt-1">Crie metas pra reserva de emergência, viagem, carro e mais</p>
        </div>
      )}
    </div>
  );
}
