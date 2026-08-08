import { useState } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, BarChart3, Landmark, PiggyBank } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useFixedIncomeStore } from '../store/useFixedIncomeStore';
import { useGoalsStore } from '../store/useGoalsStore';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { CategoryIcon } from '../components/CategoryIcon';
import type { Page } from '../components/Sidebar';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const CATEGORY_COLORS: Record<string, string> = {
  'Mercado': '#2d9d4e', 'Alimentação (Trabalho)': '#e08a1e', 'Alimentação (Lazer)': '#f59e0b',
  'Alimentação': '#e08a1e', 'Transporte': '#d4a017', 'Moradia': '#d93636',
  'Saúde': '#2d9d4e', 'Educação': '#06b6d4', 'Lazer': '#8a6bbf',
  'Assinaturas': '#a855f7', 'Compras': '#10b981', 'Serviços': '#f97316', 'Outros': '#6366f1',
};

export function HomePage({ onNavigate }: { onNavigate: (p: Page) => void }) {
  const { stocks, quotes } = usePortfolioStore();
  const fiItems = useFixedIncomeStore((s) => s.items);
  const goals = useGoalsStore((s) => s.goals);
  const { invoices } = useInvoiceStore();
  const [show, setShow] = useState({ stocks: true, fi: true, goals: true });

  // Patrimônio
  const stockCurrent = stocks.reduce((s, x) => { const q = quotes.get(x.ticker); return q ? s + x.quantity * q.regularMarketPrice : s; }, 0);
  const has = stocks.some((s) => quotes.has(s.ticker));
  const fiCurrent = fiItems.reduce((s, i) => s + i.currentAmount, 0);
  const goalsCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
  const stockInvested = stocks.reduce((s, x) => s + x.quantity * x.averagePrice, 0);
  const fiInvested = fiItems.reduce((s, i) => s + i.investedAmount, 0);
  const goalsInvested = goals.reduce((s, g) => s + g.investedAmount, 0);

  const totalCurrent = (show.stocks && has ? stockCurrent : show.stocks ? stockInvested : 0) + (show.fi ? fiCurrent : 0) + (show.goals ? goalsCurrent : 0);
  const totalInvested = (show.stocks ? stockInvested : 0) + (show.fi ? fiInvested : 0) + (show.goals ? goalsInvested : 0);
  const hasSomething = (show.stocks && has) || (show.fi && fiItems.length > 0) || (show.goals && goals.length > 0);
  const pl = hasSomething ? totalCurrent - totalInvested : null;
  const plp = pl !== null && totalInvested > 0 ? (pl / totalInvested) * 100 : null;

  const toggles = [
    { key: 'stocks' as const, label: 'Ações', icon: BarChart3, value: has ? stockCurrent : stockInvested, color: '#d4a017', has: stocks.length > 0 },
    { key: 'fi' as const, label: 'Renda Fixa', icon: Landmark, value: fiCurrent, color: '#e8b420', has: fiItems.length > 0 },
    { key: 'goals' as const, label: 'Caixinhas', icon: PiggyBank, value: goalsCurrent, color: '#2d9d4e', has: goals.length > 0 },
  ];

  // Gastos por categoria (último mês)
  const done = invoices.filter((i) => i.status === 'done');
  const sortedMonths = Array.from(new Set(done.map((i) => i.referenceMonth).filter(Boolean))).sort();
  const lastMonth = sortedMonths.length > 0 ? sortedMonths[sortedMonths.length - 1] : '';
  const lastMonthInvoices = lastMonth ? done.filter((i) => i.referenceMonth === lastMonth) : [];
  const lastMonthTotal = lastMonthInvoices.reduce((s, i) => s + i.totalAmount, 0);

  const catMap = new Map<string, number>();
  for (const inv of lastMonthInvoices) for (const e of inv.expenses) catMap.set(e.category, (catMap.get(e.category) ?? 0) + e.amount);
  const catTotal = Array.from(catMap.values()).reduce((s, v) => s + v, 0);
  const catData = Array.from(catMap.entries())
    .map(([name, value]) => ({ name, value, pct: catTotal > 0 ? (value / catTotal) * 100 : 0 }))
    .sort((a, b) => b.value - a.value);

  const lastMonthLabel = lastMonth
    ? new Date(lastMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#f0ece4] tracking-tight">Resumo</h1>
        <p className="text-[#8a8580] text-sm mt-1">Visão geral das suas finanças</p>
      </div>

      {/* Patrimônio */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[rgba(45,157,78,0.1)] w-10 h-10 rounded-xl flex items-center justify-center">
            <Wallet size={18} className="text-[#2d9d4e]" />
          </div>
          <h2 className="text-[#8a8580] text-sm font-semibold uppercase tracking-wider">Patrimônio</h2>
        </div>
        <p className="text-3xl font-bold text-[#f0ece4]">{hasSomething ? fmt(totalCurrent) : '—'}</p>
        {pl !== null && (
          <div className="flex items-center gap-2 mt-2">
            {pl >= 0 ? <ArrowUpRight size={16} className="text-[#2d9d4e]" /> : <ArrowDownRight size={16} className="text-[#d93636]" />}
            <span className={`text-sm font-semibold ${pl >= 0 ? 'text-[#2d9d4e]' : 'text-[#d93636]'}`}>
              {fmt(pl)} ({plp !== null ? `${plp >= 0 ? '+' : ''}${plp.toFixed(1)}%` : ''})
            </span>
          </div>
        )}
        {!hasSomething && (
          <button onClick={() => onNavigate('portfolio')} className="text-[#d4a017] text-sm font-medium mt-3 hover:underline cursor-pointer">
            Adicionar investimentos →
          </button>
        )}
        {toggles.some((t) => t.has) && (
          <div className="flex flex-wrap gap-2 mt-4">
            {toggles.filter((t) => t.has).map((t) => (
              <button key={t.key} onClick={() => setShow((s) => ({ ...s, [t.key]: !s[t.key] }))}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                  show[t.key] ? 'bg-[#1a1a1a] border-[#d4a017]/30 text-[#f0ece4]' : 'bg-[#0a0a0a] border-[#2a2a2a] text-[#8a8580] opacity-60'
                }`}>
                <t.icon size={14} style={{ color: show[t.key] ? t.color : '#8a8580' }} />
                <span className="text-sm font-medium">{t.label}</span>
                <span className="text-sm font-semibold">{fmt(t.value)}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Gastos por categoria */}
      {catData.length > 0 ? (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[#8a8580] text-sm font-semibold uppercase tracking-wider">Gastos por Categoria</h2>
            <span className="text-[#8a8580] text-sm capitalize">{lastMonthLabel}</span>
          </div>
          <p className="text-2xl font-bold text-[#f0ece4] mb-5">{fmt(lastMonthTotal)}</p>
          <div className="space-y-3">
            {catData.map((cat) => (
              <div key={cat.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <CategoryIcon name={cat.name} color={CATEGORY_COLORS[cat.name]} size={16} />
                    <span className="text-[#f0ece4] text-sm font-medium">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[#a0998a] text-sm font-semibold">{fmt(cat.value)}</span>
                    <span className="text-[#8a8580] text-sm font-semibold w-10 text-right">{cat.pct.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${cat.pct}%`, backgroundColor: CATEGORY_COLORS[cat.name] ?? '#6366f1' }} />
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => onNavigate('invoices')} className="text-[#d4a017] text-sm font-medium mt-4 hover:underline cursor-pointer">
            Ver detalhes →
          </button>
        </div>
      ) : (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 text-center">
          <p className="text-[#8a8580] text-sm mb-2">Nenhuma fatura processada ainda</p>
          <button onClick={() => onNavigate('invoices')} className="text-[#d4a017] text-sm font-medium hover:underline cursor-pointer">
            Enviar primeira fatura →
          </button>
        </div>
      )}
    </div>
  );
}
