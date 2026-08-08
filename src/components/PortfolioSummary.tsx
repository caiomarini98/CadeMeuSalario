import { useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, BarChart3, Landmark, PiggyBank } from 'lucide-react';
import type { Stock, StockQuote, FixedIncome, SavingsGoal } from '../types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface Props {
  stocks: Stock[];
  quotes: Map<string, StockQuote>;
  fixedIncomeItems?: FixedIncome[];
  goals?: SavingsGoal[];
}

export function PortfolioSummary({ stocks, quotes, fixedIncomeItems = [], goals = [] }: Props) {
  const [show, setShow] = useState({ stocks: true, fi: true, goals: true });

  const hasQuotes = stocks.some((s) => quotes.has(s.ticker));
  const stockInvested = stocks.reduce((s, x) => s + x.quantity * x.averagePrice, 0);
  const stockCurrent = stocks.reduce((s, x) => { const q = quotes.get(x.ticker); return q ? s + x.quantity * q.regularMarketPrice : s; }, 0);
  const fiInvested = fixedIncomeItems.reduce((s, i) => s + i.investedAmount, 0);
  const fiCurrent = fixedIncomeItems.reduce((s, i) => s + i.currentAmount, 0);
  const goalsInvested = goals.reduce((s, g) => s + g.investedAmount, 0);
  const goalsCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);

  const totalInvested = (show.stocks ? stockInvested : 0) + (show.fi ? fiInvested : 0) + (show.goals ? goalsInvested : 0);
  const totalCurrent = (show.stocks && hasQuotes ? stockCurrent : show.stocks ? stockInvested : 0) + (show.fi ? fiCurrent : 0) + (show.goals ? goalsCurrent : 0);
  const hasSomething = (show.stocks && hasQuotes) || (show.fi && fixedIncomeItems.length > 0) || (show.goals && goals.length > 0);
  const pl = hasSomething ? totalCurrent - totalInvested : null;
  const plp = pl !== null && totalInvested > 0 ? (pl / totalInvested) * 100 : null;
  const pos = pl !== null && pl >= 0;

  const toggles = [
    { key: 'stocks' as const, label: 'Ações', icon: BarChart3, value: hasQuotes ? stockCurrent : stockInvested, color: '#d4a017', has: stocks.length > 0 },
    { key: 'fi' as const, label: 'Renda Fixa', icon: Landmark, value: fiCurrent, color: '#e8b420', has: fixedIncomeItems.length > 0 },
    { key: 'goals' as const, label: 'Caixinhas', icon: PiggyBank, value: goalsCurrent, color: '#2d9d4e', has: goals.length > 0 },
  ];

  return (
    <div className="space-y-3">
      {/* Main cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#1a1a1a] to-[#333333]" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#8a8580] text-sm font-medium uppercase tracking-wider">Total investido</span>
              <div className="bg-[rgba(212,160,23,0.1)] w-10 h-10 rounded-xl flex items-center justify-center">
                <Wallet size={16} className="text-[#d4a017]" />
              </div>
            </div>
            <p className="text-xl font-bold text-[#f0ece4]">{fmt(totalInvested)}</p>
          </div>
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <div className="h-[3px] bg-gradient-to-r from-[#2d9d4e] to-[#3dbd64]" />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#8a8580] text-sm font-medium uppercase tracking-wider">Valor atual</span>
              <div className="bg-[rgba(45,157,78,0.1)] w-10 h-10 rounded-xl flex items-center justify-center">
                <BarChart3 size={16} className="text-[#2d9d4e]" />
              </div>
            </div>
            <p className="text-xl font-bold text-[#f0ece4]">{hasSomething ? fmt(totalCurrent) : '—'}</p>
          </div>
        </div>
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden">
          <div className={`h-[3px] bg-gradient-to-r ${pl === null ? 'from-[#1a1a1a] to-[#333333]' : pos ? 'from-[#d4a017] to-[#f0c940]' : 'from-[#d93636] to-[#e85555]'}`} />
          <div className="p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#8a8580] text-sm font-medium uppercase tracking-wider">Resultado</span>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pl === null ? 'bg-white/5' : pos ? 'bg-[rgba(212,160,23,0.1)]' : 'bg-[rgba(217,54,54,0.1)]'}`}>
                {pos ? <TrendingUp size={16} className="text-[#d4a017]" /> : <TrendingDown size={16} className={pl === null ? 'text-[#8a8580]' : 'text-[#d93636]'} />}
              </div>
            </div>
            <p className="text-xl font-bold text-[#f0ece4]">{pl !== null ? fmt(pl) : '—'}</p>
            {plp !== null && <p className={`text-sm mt-1 ${pos ? 'text-[#d4a017]' : 'text-[#d93636]'}`}>{plp >= 0 ? '+' : ''}{plp.toFixed(2)}%</p>}
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="flex flex-wrap gap-2">
        {toggles.filter((t) => t.has).map((t) => (
          <button key={t.key} onClick={() => setShow((s) => ({ ...s, [t.key]: !s[t.key] }))}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all cursor-pointer ${
              show[t.key]
                ? 'bg-[#141414] border-[#d4a017]/30 text-[#f0ece4]'
                : 'bg-[#0a0a0a] border-[#2a2a2a] text-[#8a8580] opacity-60'
            }`}>
            <t.icon size={14} style={{ color: show[t.key] ? t.color : '#8a8580' }} />
            <span className="text-sm font-medium">{t.label}</span>
            <span className="text-sm font-semibold">{fmt(t.value)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
