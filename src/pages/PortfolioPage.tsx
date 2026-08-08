import { useEffect, useState } from 'react';
import { RefreshCw, Download } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useFixedIncomeStore } from '../store/useFixedIncomeStore';
import { useGoalsStore } from '../store/useGoalsStore';
import { AddStockForm } from '../components/AddStockForm';
import { StockTable } from '../components/StockTable';
import { PortfolioSummary } from '../components/PortfolioSummary';
import { StockSearch } from '../components/StockSearch';
import { PortfolioCharts } from '../components/PortfolioCharts';
import { AddFixedIncomeForm } from '../components/AddFixedIncomeForm';
import { FixedIncomeTable } from '../components/FixedIncomeTable';
import { SavingsGoals } from '../components/SavingsGoals';
import { exportPortfolioToExcel } from '../services/exportService';
import { useFeatureGate } from '../hooks/useFeatureGate';

export function PortfolioPage() {
  const { stocks, quotes, isLoading, error, hydrated, refreshQuotes, removeStock, addStock } = usePortfolioStore();
  const fiItems = useFixedIncomeStore((s) => s.items);
  const goals = useGoalsStore((s) => s.goals);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showFiForm, setShowFiForm] = useState(false);
  const [prefill, setPrefill] = useState('');
  const [tab, setTab] = useState<'stocks' | 'fixed' | 'goals'>('stocks');
  const { hasAccess } = useFeatureGate();

  useEffect(() => { if (!hydrated) return; const i = setInterval(refreshQuotes, 1800000); return () => clearInterval(i); }, [hydrated, refreshQuotes]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#f0ece4] tracking-tight">Minha Carteira</h1>
          <p className="text-[#8a8580] text-sm mt-1">Ações, renda fixa e objetivos</p>
        </div>
        <div className="flex items-center gap-3">
          {stocks.length > 0 && hasAccess('export') && (
            <button onClick={() => void exportPortfolioToExcel(stocks, quotes, fiItems, goals)}
              className="flex items-center gap-2 text-sm font-medium text-[#a0998a] hover:text-[#2d9d4e] bg-[#141414] hover:bg-[rgba(45,157,78,0.1)] border border-[#2a2a2a] hover:border-[#2d9d4e]/30 rounded-xl px-4 py-2.5 transition-all cursor-pointer">
              <Download size={14} />Exportar
            </button>
          )}
          <button onClick={refreshQuotes} disabled={isLoading}
            className="flex items-center gap-2 text-sm font-medium text-[#a0998a] hover:text-[#f0ece4] bg-[#141414] border border-[#2a2a2a] rounded-xl px-4 py-2.5 transition-all disabled:opacity-30 cursor-pointer">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />Atualizar
          </button>
        </div>
      </div>

      {error && <div className="bg-[rgba(217,54,54,0.1)] border border-[#d93636]/20 text-[#d93636] text-sm rounded-xl px-4 py-3">{error}</div>}

      <PortfolioSummary stocks={stocks} quotes={quotes} fixedIncomeItems={fiItems} goals={goals} />

      {/* Tabs */}
      <div data-tour="portfolio-tabs" className="flex gap-2">
        {(['stocks', 'fixed', 'goals'] as const).map((t) => {
          const labels = { stocks: `Ações${stocks.length ? ` (${stocks.length})` : ''}`, fixed: `Renda Fixa${fiItems.length ? ` (${fiItems.length})` : ''}`, goals: `Caixinhas${goals.length ? ` (${goals.length})` : ''}` };
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                tab === t
                  ? 'bg-[#d4a017] text-[#1a1a1a] border-[#d4a017] shadow-[0_4px_12px_rgba(212,160,23,0.4)]'
                  : 'bg-transparent text-[#a0998a] border-[#2a2a2a] hover:border-[#d4a017] hover:text-[#d4a017]'
              }`}>
              {labels[t]}
            </button>
          );
        })}
      </div>

      <div className="space-y-6">
        {tab === 'stocks' && (
          <>
            <div data-tour="stock-search">
              <StockSearch onAddStock={(t) => { setPrefill(t); setShowStockForm(true); }} portfolioTickers={stocks.map((s) => s.ticker)} />
            </div>
            <div data-tour="add-stock" className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
              <button onClick={() => setShowStockForm(!showStockForm)}
                className="text-[#a0998a] text-sm font-medium cursor-pointer hover:text-[#d4a017] transition-colors">
                {showStockForm ? '− Fechar formulário' : '+ Adicionar ação'}
              </button>
              {showStockForm && <div className="mt-4"><AddStockForm prefillTicker={prefill} onAdded={() => { setPrefill(''); setShowStockForm(false); }} /></div>}
            </div>
            {stocks.length > 0
              ? <StockTable stocks={stocks} quotes={quotes} onRemove={removeStock} onEdit={addStock} />
              : <div className="text-center py-16 text-[#8a8580]"><p className="text-sm">Nenhuma ação na carteira</p></div>
            }
            {stocks.length > 0 && <PortfolioCharts stocks={stocks} quotes={quotes} />}
          </>
        )}

        {tab === 'fixed' && (
          <>
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-5">
              <button onClick={() => setShowFiForm(!showFiForm)}
                className="text-[#a0998a] text-sm font-medium cursor-pointer hover:text-[#d4a017] transition-colors">
                {showFiForm ? '− Fechar formulário' : '+ Adicionar renda fixa'}
              </button>
              {showFiForm && <div className="mt-4"><AddFixedIncomeForm onAdded={() => setShowFiForm(false)} /></div>}
            </div>
            <FixedIncomeTable />
            {fiItems.length === 0 && (
              <div className="text-center py-16 text-[#8a8580]"><p className="text-sm">Nenhum título de renda fixa</p></div>
            )}
          </>
        )}

        {tab === 'goals' && <SavingsGoals />}
      </div>
    </div>
  );
}
