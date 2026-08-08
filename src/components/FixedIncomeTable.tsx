import { useState } from 'react';
import { Trash2, Pencil, Check, X, TrendingUp, TrendingDown, Landmark, Building2, Banknote, PiggyBank, BarChart3, FileText, HelpCircle } from 'lucide-react';
import { useFixedIncomeStore } from '../store/useFixedIncomeStore';
import { FIXED_INCOME_TYPES } from '../types';
import type { FixedIncome, FixedIncomeType } from '../types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtP = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

const TYPE_ICONS: Record<FixedIncomeType, typeof Landmark> = {
  tesouro: Landmark,
  cdb: Building2,
  lci: Banknote,
  lca: PiggyBank,
  fundo: BarChart3,
  debenture: FileText,
  outro: HelpCircle,
};

const TYPE_BADGE_COLORS: Record<FixedIncomeType, string> = {
  tesouro: 'from-[#d4a017] to-[#b8890f]',
  cdb: 'from-[#06b6d4] to-[#0891b2]',
  lci: 'from-[#2d9d4e] to-[#1e7a38]',
  lca: 'from-[#10b981] to-[#059669]',
  fundo: 'from-[#8a6bbf] to-[#7352a8]',
  debenture: 'from-[#e08a1e] to-[#c47518]',
  outro: 'from-[#8a8580] to-[#4a4540]',
};

function Row({ item }: { item: FixedIncome }) {
  const { updateItem, removeItem } = useFixedIncomeStore();
  const [editing, setEditing] = useState(false);
  const [current, setCurrent] = useState(String(item.currentAmount));
  const [invested, setInvested] = useState(String(item.investedAmount));

  const pl = item.currentAmount - item.investedAmount;
  const plp = item.investedAmount > 0 ? (pl / item.investedAmount) * 100 : 0;
  const pos = pl >= 0;
  const Icon = TYPE_ICONS[item.type];
  const typeLabel = FIXED_INCOME_TYPES.find((t) => t.value === item.type)?.label ?? item.type;

  const confirm = () => {
    const c = Number(current), inv = Number(invested);
    if (c > 0 && inv > 0) updateItem(item.id, { currentAmount: c, investedAmount: inv });
    setEditing(false);
  };
  const cancel = () => { setCurrent(String(item.currentAmount)); setInvested(String(item.investedAmount)); setEditing(false); };
  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); };
  const editInput = "w-24 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-right text-[#f0ece4] text-sm focus:outline-none focus:border-[#d4a017] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.12)]";

  return (
    <div className="grid grid-cols-[2fr_0.8fr_0.8fr_1fr_1fr_1.4fr_80px] gap-4 items-center px-5 py-4 border-b border-[#1a1a1a] hover:bg-[#1f1f1f] transition-colors">
      {/* Title + type badge */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${TYPE_BADGE_COLORS[item.type]} flex items-center justify-center flex-shrink-0`}>
          <Icon size={16} className="text-white" />
        </div>
        <div>
          <span className="text-[#f0ece4] text-sm font-medium">{item.name}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[#8a8580] text-sm">{typeLabel}</span>
            {item.rate && <span className="text-[#8a8580] text-sm">· {item.rate}</span>}
          </div>
        </div>
      </div>
      {/* Purchase date */}
      <div className="text-right text-[#8a8580] text-sm">{item.purchaseDate}</div>
      {/* Maturity */}
      <div className="text-right text-[#8a8580] text-sm">{item.maturityDate ?? '—'}</div>
      {/* Invested */}
      <div className="text-right text-[#a0998a] text-sm">
        {editing ? <input type="number" min="0.01" step="0.01" value={invested} onChange={(e) => setInvested(e.target.value)} onKeyDown={onKey} className={editInput} /> : fmt(item.investedAmount)}
      </div>
      {/* Current */}
      <div className="text-right text-[#f0ece4] text-sm font-medium">
        {editing ? <input type="number" min="0.01" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} onKeyDown={onKey} className={editInput} autoFocus /> : fmt(item.currentAmount)}
      </div>
      {/* P&L */}
      <div className="text-right">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium ${pos ? 'bg-[rgba(45,157,78,0.1)] text-[#2d9d4e]' : 'bg-[rgba(217,54,54,0.1)] text-[#d93636]'}`}>
          {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{fmt(pl)}</span>
          <span className="text-[#8a8580]">·</span>
          <span>{fmtP(plp)}</span>
        </div>
      </div>
      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        {editing ? (<>
          <button onClick={confirm} className="text-[#2d9d4e] hover:text-[#3dbd64] transition-colors cursor-pointer" aria-label="Confirmar"><Check size={14} /></button>
          <button onClick={cancel} className="text-[#8a8580] hover:text-[#f0ece4] transition-colors cursor-pointer" aria-label="Cancelar"><X size={14} /></button>
        </>) : (<>
          <button onClick={() => setEditing(true)} className="text-[#8a8580] hover:text-[#d4a017] transition-colors cursor-pointer" aria-label={`Editar ${item.name}`}><Pencil size={14} /></button>
          <button onClick={() => removeItem(item.id)} className="text-[#8a8580] hover:text-[#d93636] transition-colors cursor-pointer" aria-label={`Remover ${item.name}`}><Trash2 size={14} /></button>
        </>)}
      </div>
    </div>
  );
}

export function FixedIncomeTable() {
  const { items } = useFixedIncomeStore();
  if (items.length === 0) return null;

  const totalInvested = items.reduce((s, i) => s + i.investedAmount, 0);
  const totalCurrent = items.reduce((s, i) => s + i.currentAmount, 0);
  const totalPl = totalCurrent - totalInvested;

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Landmark size={16} className="text-[#d4a017]" />
          <span className="text-[#8a8580] text-sm font-semibold uppercase tracking-wider">Renda Fixa</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[#8a8580]">Investido: <span className="text-[#a0998a] font-medium">{fmt(totalInvested)}</span></span>
          <span className="text-[#8a8580]">Atual: <span className="text-[#a0998a] font-medium">{fmt(totalCurrent)}</span></span>
          <span className={`font-medium ${totalPl >= 0 ? 'text-[#2d9d4e]' : 'text-[#d93636]'}`}>{fmt(totalPl)}</span>
        </div>
      </div>
      {/* Grid header */}
      <div className="grid grid-cols-[2fr_0.8fr_0.8fr_1fr_1fr_1.4fr_80px] gap-4 px-5 py-2.5 border-b border-[#2a2a2a] text-[#8a8580] text-sm font-semibold uppercase tracking-wider">
        <span>Título</span>
        <span className="text-right">Compra</span>
        <span className="text-right">Vencimento</span>
        <span className="text-right">Investido</span>
        <span className="text-right">Valor atual</span>
        <span className="text-right">Resultado</span>
        <span></span>
      </div>
      {items.map((item) => <Row key={item.id} item={item} />)}
    </div>
  );
}
