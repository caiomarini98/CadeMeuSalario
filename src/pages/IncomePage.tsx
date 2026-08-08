import { useState } from 'react';
import { Plus, Trash2, Banknote, Gift, RotateCcw, CircleDollarSign } from 'lucide-react';
import { useIncomeStore, type IncomeType } from '../store/useIncomeStore';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const TYPE_CONFIG: Record<IncomeType, { label: string; icon: typeof Banknote; color: string }> = {
  salary: { label: 'Salário', icon: Banknote, color: '#2d9d4e' },
  bonus: { label: 'Bônus', icon: Gift, color: '#d4a017' },
  reimbursement: { label: 'Reembolso', icon: RotateCcw, color: '#06b6d4' },
  other: { label: 'Outro', icon: CircleDollarSign, color: '#8a6bbf' },
};

export function IncomePage() {
  const { items, addItem, removeItem } = useIncomeStore();
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<IncomeType>('salary');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [recurring, setRecurring] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount.replace(',', '.'));
    if (!val || !desc.trim()) return;
    addItem({ id: crypto.randomUUID(), type, description: desc.trim(), amount: val, date, recurring });
    setDesc(''); setAmount(''); setShowForm(false);
  };

  const total = items.reduce((s, i) => s + i.amount, 0);
  const monthlyItems = items.filter((i) => i.date.startsWith(new Date().toISOString().slice(0, 7)));
  const monthlyTotal = monthlyItems.reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0ece4] tracking-tight">Meus Ganhos</h1>
          <p className="text-[#8a8580] text-sm mt-1">Salário, bônus e reembolsos</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 text-sm font-medium bg-[#d4a017] text-[#1a1a1a] rounded-xl px-4 py-2.5 hover:bg-[#e0b020] transition-colors cursor-pointer">
          <Plus size={16} />Adicionar
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
          <span className="text-[#8a8580] text-sm font-medium uppercase tracking-wider">Este mês</span>
          <p className="text-xl font-bold text-[#2d9d4e] mt-2">{fmt(monthlyTotal)}</p>
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
          <span className="text-[#8a8580] text-sm font-medium uppercase tracking-wider">Total registrado</span>
          <p className="text-xl font-bold text-[#f0ece4] mt-2">{fmt(total)}</p>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={submit} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(Object.entries(TYPE_CONFIG) as [IncomeType, typeof TYPE_CONFIG.salary][]).map(([key, cfg]) => (
              <button key={key} type="button" onClick={() => setType(key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                  type === key ? 'border-[#d4a017]/50 bg-[#d4a017]/10 text-[#f0ece4]' : 'border-[#2a2a2a] text-[#8a8580] hover:border-[#8a8580]'
                }`}>
                <cfg.icon size={14} style={{ color: cfg.color }} />{cfg.label}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Descrição" required
              className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-[#f0ece4] placeholder-[#8a8580] focus:border-[#d4a017] outline-none" />
            <input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Valor (R$)" required
              className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-[#f0ece4] placeholder-[#8a8580] focus:border-[#d4a017] outline-none" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-sm text-[#f0ece4] focus:border-[#d4a017] outline-none" />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-[#a0998a] cursor-pointer">
              <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)}
                className="rounded border-[#2a2a2a] accent-[#d4a017]" />
              Recorrente (mensal)
            </label>
            <button type="submit" className="px-4 py-2 text-sm font-medium bg-[#2d9d4e] text-white rounded-xl hover:bg-[#3dbd64] cursor-pointer">
              Salvar
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="space-y-2">
        {items.length === 0 && (
          <div className="text-center py-12 text-[#8a8580]">
            <p className="text-sm">Nenhum ganho registrado</p>
          </div>
        )}
        {items.map((item) => {
          const cfg = TYPE_CONFIG[item.type];
          return (
            <div key={item.id} className="flex items-center gap-3 bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${cfg.color}15` }}>
                <cfg.icon size={16} style={{ color: cfg.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#f0ece4] text-sm font-medium truncate">{item.description}</p>
                <p className="text-[#8a8580] text-sm">{cfg.label} · {new Date(item.date + 'T12:00').toLocaleDateString('pt-BR')}{item.recurring ? ' · Recorrente' : ''}</p>
              </div>
              <span className="text-[#2d9d4e] text-sm font-semibold whitespace-nowrap">{fmt(item.amount)}</span>
              <button onClick={() => removeItem(item.id)} className="text-[#8a8580] hover:text-[#d93636] cursor-pointer p-1">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
