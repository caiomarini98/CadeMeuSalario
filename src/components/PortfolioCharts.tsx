import { useEffect, useState, useCallback } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Cell } from 'recharts';
import type { Stock, StockQuote, StockSearchResult } from '../types';
import { fetchHistorical, searchStock } from '../services/quoteService';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const COLORS = ['#d4a017', '#2d9d4e', '#e08a1e', '#8a6bbf', '#06b6d4', '#d93636', '#a855f7', '#10b981', '#f97316', '#6366f1'];
const RANGES = [{ label: '1S', value: '5d', interval: '1d' }, { label: '1M', value: '1mo', interval: '1d' }, { label: '3M', value: '3mo', interval: '1d' }, { label: '6M', value: '6mo', interval: '1wk' }, { label: '1A', value: '1y', interval: '1wk' }, { label: '5A', value: '5y', interval: '1mo' }] as const;
const ts = { background: '#141414', border: '1px solid #2a2a2a', borderRadius: '12px', color: '#f0ece4', fontSize: '12px', padding: '8px 12px' };

function RangeChips({ rangeIdx, onChange }: { rangeIdx: number; onChange: (i: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {RANGES.map((r, i) => (
        <button key={r.value} onClick={() => onChange(i)}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
            rangeIdx === i
              ? 'bg-[#d4a017] text-[#1a1a1a] border-[#d4a017]'
              : 'text-[#a0998a] border-[#2a2a2a] hover:border-[#d4a017] hover:text-[#d4a017]'
          }`}>{r.label}</button>
      ))}
    </div>
  );
}

export function PortfolioCharts({ stocks, quotes }: { stocks: Stock[]; quotes: Map<string, StockQuote> }) {
  const [hist, setHist] = useState<Map<string, StockSearchResult>>(new Map());
  const [loading, setLoading] = useState(false);
  const [rangeIdx, setRangeIdx] = useState(2);

  // Individual stock view
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [stockHist, setStockHist] = useState<StockSearchResult | null>(null);
  const [stockLoading, setStockLoading] = useState(false);
  const [stockRangeIdx, setStockRangeIdx] = useState(2);

  const load = useCallback(async (ri: number) => {
    if (stocks.length === 0) return; setLoading(true);
    const r = RANGES[ri];
    try { setHist(await fetchHistorical(stocks.map((s) => s.ticker), r.value, r.interval)); } finally { setLoading(false); }
  }, [stocks]);

  useEffect(() => { load(rangeIdx); }, [load, rangeIdx]);

  // Load individual stock history
  const loadStock = useCallback(async (ticker: string, ri: number) => {
    setStockLoading(true);
    const r = RANGES[ri];
    try {
      const result = await searchStock(ticker, r.value, r.interval);
      setStockHist(result);
    } finally { setStockLoading(false); }
  }, []);

  useEffect(() => {
    if (selectedTicker) loadStock(selectedTicker, stockRangeIdx);
  }, [selectedTicker, stockRangeIdx, loadStock]);

  // Bar chart data for distribution
  const barData = stocks
    .map((s) => { const q = quotes.get(s.ticker); return { name: s.ticker, value: q ? Number((s.quantity * q.regularMarketPrice).toFixed(2)) : 0 }; })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
  const totalValue = barData.reduce((s, d) => s + d.value, 0);

  // Portfolio evolution
  const history = (() => {
    const dm = new Map<number, number>();
    for (const s of stocks) { const h = hist.get(s.ticker); if (!h) continue; for (const p of h.historicalDataPrice) dm.set(p.date, (dm.get(p.date) ?? 0) + s.quantity * p.close); }
    return Array.from(dm.entries()).sort(([a], [b]) => a - b).map(([d, v]) => ({ date: new Date(d * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: Number(v.toFixed(2)) }));
  })();
  const hasHist = history.length > 0;
  const pos = hasHist && history[history.length - 1].value >= history[0].value;

  // Individual stock chart data
  const stockChartData = stockHist?.historicalDataPrice
    ?.map((p) => ({ date: new Date(p.date * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), value: Number(p.close.toFixed(2)) })) ?? [];
  const stockPos = stockChartData.length > 1 && stockChartData[stockChartData.length - 1].value >= stockChartData[0].value;

  return (
    <div className="space-y-4">
      {/* Portfolio evolution */}
      <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#8a8580] text-sm font-semibold uppercase tracking-wider">Evolução da carteira</h3>
          <RangeChips rangeIdx={rangeIdx} onChange={setRangeIdx} />
        </div>
        {loading ? <div className="h-64 flex items-center justify-center text-[#8a8580] text-sm">Carregando...</div>
          : hasHist ? (
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={history}>
              <defs><linearGradient id="pGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={pos ? '#2d9d4e' : '#d93636'} stopOpacity={0.3} /><stop offset="100%" stopColor={pos ? '#2d9d4e' : '#d93636'} stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fill: '#8a8580', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={['auto', 'auto']} tick={{ fill: '#8a8580', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip contentStyle={ts} formatter={(v) => [fmt(Number(v)), 'Valor']} />
              <Area type="monotone" dataKey="value" stroke={pos ? '#2d9d4e' : '#d93636'} strokeWidth={2} fill="url(#pGrad)" />
            </AreaChart></ResponsiveContainer></div>
          ) : <div className="h-64 flex items-center justify-center text-[#8a8580] text-sm">Sem dados históricos</div>}
      </div>

      {/* Distribution bar chart + Individual stock selector */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar chart distribution */}
        {barData.length > 0 && (
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
            <h3 className="text-[#8a8580] text-sm font-semibold uppercase tracking-wider mb-5">Distribuição da carteira</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={barData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis type="number" tick={{ fill: '#8a8580', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#a0998a', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} width={60} />
              <Tooltip contentStyle={ts} labelStyle={{ color: '#f0ece4' }} itemStyle={{ color: '#f0ece4' }} formatter={(v) => [fmt(Number(v)), 'Valor']} labelFormatter={(l) => {
                const item = barData.find((d) => d.name === l);
                return item ? `${l} — ${totalValue > 0 ? ((item.value / totalValue) * 100).toFixed(1) : 0}%` : l;
              }} cursor={false} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} cursor="pointer" onClick={(d) => { const n = d.name as string | undefined; setSelectedTicker(n && n === selectedTicker ? null : n ?? null); }}>
                {barData.map((entry, i) => (
                  <Cell key={entry.name} fill={entry.name === selectedTicker ? '#f0c940' : COLORS[i % COLORS.length]}
                    stroke={entry.name === selectedTicker ? '#d4a017' : 'none'} strokeWidth={2} />
                ))}
              </Bar>
            </BarChart></ResponsiveContainer></div>
            {/* Legend with % */}
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
              {barData.map((d, i) => (
                <button key={d.name} onClick={() => setSelectedTicker(d.name === selectedTicker ? null : d.name)}
                  className={`flex items-center gap-1.5 text-sm cursor-pointer transition-colors ${selectedTicker === d.name ? 'text-[#d4a017]' : 'text-[#a0998a] hover:text-[#f0ece4]'}`}>
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {d.name} <span className="text-[#8a8580]">{totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(0) : 0}%</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Individual stock chart */}
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#8a8580] text-sm font-semibold uppercase tracking-wider">
              {selectedTicker ? `Evolução ${selectedTicker}` : 'Selecione uma ação'}
            </h3>
            {selectedTicker && <RangeChips rangeIdx={stockRangeIdx} onChange={setStockRangeIdx} />}
          </div>

          {!selectedTicker ? (
            <div className="h-64 flex flex-col items-center justify-center text-center">
              <p className="text-[#8a8580] text-sm mb-3">Clique em uma ação no gráfico ao lado ou selecione abaixo</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {stocks.map((s) => (
                  <button key={s.ticker} onClick={() => setSelectedTicker(s.ticker)}
                    className="px-3.5 py-1.5 rounded-full text-sm font-medium border border-[#2a2a2a] text-[#a0998a] hover:border-[#d4a017] hover:text-[#d4a017] transition-all cursor-pointer">
                    {s.ticker}
                  </button>
                ))}
              </div>
            </div>
          ) : stockLoading ? (
            <div className="h-64 flex items-center justify-center text-[#8a8580] text-sm">Carregando {selectedTicker}...</div>
          ) : stockChartData.length > 0 ? (
            <>
              <div className="h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={stockChartData}>
                <defs><linearGradient id="sGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={stockPos ? '#2d9d4e' : '#d93636'} stopOpacity={0.3} /><stop offset="100%" stopColor={stockPos ? '#2d9d4e' : '#d93636'} stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fill: '#8a8580', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#8a8580', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => fmt(v)} />
                <Tooltip contentStyle={ts} formatter={(v) => [fmt(Number(v)), selectedTicker]} />
                <Area type="monotone" dataKey="value" stroke={stockPos ? '#2d9d4e' : '#d93636'} strokeWidth={2} fill="url(#sGrad)" />
              </AreaChart></ResponsiveContainer></div>
              {/* Stock info */}
              {stockHist && (
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#2a2a2a]">
                  <span className="text-[#f0ece4] text-sm font-bold">{fmt(stockHist.regularMarketPrice)}</span>
                  <span className={`text-sm font-semibold ${stockHist.regularMarketChangePercent >= 0 ? 'text-[#2d9d4e]' : 'text-[#d93636]'}`}>
                    {stockHist.regularMarketChangePercent >= 0 ? '+' : ''}{stockHist.regularMarketChangePercent.toFixed(2)}%
                  </span>
                  <span className="text-[#8a8580] text-sm">{stockHist.shortName}</span>
                </div>
              )}
              {/* Ticker chips */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {stocks.map((s) => (
                  <button key={s.ticker} onClick={() => setSelectedTicker(s.ticker)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                      selectedTicker === s.ticker
                        ? 'bg-[#d4a017] text-[#1a1a1a] border-[#d4a017]'
                        : 'border-[#2a2a2a] text-[#8a8580] hover:border-[#d4a017] hover:text-[#d4a017]'
                    }`}>{s.ticker}</button>
                ))}
              </div>
            </>
          ) : (
            <div className="h-64 flex items-center justify-center text-[#8a8580] text-sm">Sem dados para {selectedTicker}</div>
          )}
        </div>
      </div>
    </div>
  );
}
