import { useState } from 'react';
import { Search, TrendingUp, TrendingDown, X, Plus } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { StockSearchResult } from '../types';
import { searchStock } from '../services/quoteService';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtCompact = (v: number) => v >= 1e12 ? `R$ ${(v / 1e12).toFixed(1)}T` : v >= 1e9 ? `R$ ${(v / 1e9).toFixed(1)}B` : v >= 1e6 ? `R$ ${(v / 1e6).toFixed(1)}M` : fmt(v);
const RANGES = [{ label: '1S', value: '5d', interval: '1d' }, { label: '1M', value: '1mo', interval: '1d' }, { label: '3M', value: '3mo', interval: '1d' }, { label: '6M', value: '6mo', interval: '1wk' }, { label: '1A', value: '1y', interval: '1wk' }] as const;
const tooltipStyle = { background: '#141414', border: '1px solid #2a2a2a', borderRadius: '12px', color: '#f0ece4', fontSize: '12px', padding: '8px 12px' };

export function StockSearch({ onAddStock, portfolioTickers = [] }: { onAddStock?: (t: string) => void; portfolioTickers?: string[] }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<StockSearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rangeIdx, setRangeIdx] = useState(1);

  const doSearch = async (e: React.FormEvent) => {
    e.preventDefault(); if (!query.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try { const r = RANGES[rangeIdx]; const d = await searchStock(query, r.value, r.interval); d ? setResult(d) : setError('Ação não encontrada'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erro'); }
    finally { setLoading(false); }
  };

  const changeRange = async (i: number) => {
    setRangeIdx(i); if (!result) return; setLoading(true);
    try { const r = RANGES[i]; const d = await searchStock(result.symbol, r.value, r.interval); if (d) setResult(d); }
    catch { /* keep current */ } finally { setLoading(false); }
  };

  const chartData = (result?.historicalDataPrice ?? []).map((h) => ({ date: new Date(h.date * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), close: h.close }));
  const pos = result ? result.regularMarketChange >= 0 : true;
  const inPortfolio = result ? portfolioTickers.includes(result.symbol) : false;

  return (
    <div className="space-y-4">
      <form onSubmit={doSearch} className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8a8580]" />
          <input type="text" placeholder="Pesquisar ação (ex: PETR4, VALE3)..." value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-11 pr-4 py-2.5 text-[#f0ece4] placeholder:text-[#8a8580] focus:outline-none focus:border-[#d4a017] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.12)] transition-all" />
        </div>
        <button type="submit" disabled={loading} className="flex items-center gap-2 bg-[#d4a017] hover:bg-[#b8890f] text-[#1a1a1a] font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_4px_12px_rgba(212,160,23,0.4)] disabled:opacity-50 cursor-pointer">
          {loading ? 'Buscando...' : 'Pesquisar'}
        </button>
      </form>
      {error && <div className="bg-[rgba(217,54,54,0.1)] border border-[#d93636]/20 text-[#d93636] text-sm rounded-xl px-4 py-3">{error}</div>}
      {result && (
        <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {result.logourl ? <img src={result.logourl} alt={result.symbol} className="w-12 h-12 rounded-xl object-contain bg-[#1a1a1a] p-1" />
                : <div className="w-12 h-12 rounded-xl bg-[#1a1a1a] flex items-center justify-center text-sm font-bold text-[#8a8580]">{result.symbol.slice(0, 2)}</div>}
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-[#f0ece4] text-xl font-bold">{result.symbol}</h3>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-sm font-medium ${pos ? 'bg-[rgba(45,157,78,0.1)] text-[#2d9d4e]' : 'bg-[rgba(217,54,54,0.1)] text-[#d93636]'}`}>
                    {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}{pos ? '+' : ''}{result.regularMarketChangePercent.toFixed(2)}%
                  </span>
                </div>
                <p className="text-[#8a8580] text-sm">{result.longName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onAddStock && !inPortfolio && <button onClick={() => onAddStock(result.symbol)} className="flex items-center gap-1.5 text-sm text-[#d4a017] hover:text-[#e8b420] transition-colors cursor-pointer"><Plus size={14} />Adicionar à carteira</button>}
              <button onClick={() => { setResult(null); setError(null); setQuery(''); }} className="text-[#8a8580] hover:text-[#f0ece4] transition-colors cursor-pointer" aria-label="Fechar"><X size={18} /></button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div><span className="text-[#8a8580] text-sm">Cotação</span><p className="text-[#f0ece4] text-lg font-semibold">{fmt(result.regularMarketPrice)}</p></div>
            <div><span className="text-[#8a8580] text-sm">Volume</span><p className="text-[#f0ece4] font-medium">{result.regularMarketVolume.toLocaleString('pt-BR')}</p></div>
            <div><span className="text-[#8a8580] text-sm">Mín. 52 sem</span><p className="text-[#f0ece4] font-medium">{fmt(result.fiftyTwoWeekLow)}</p></div>
            <div><span className="text-[#8a8580] text-sm">Máx. 52 sem</span><p className="text-[#f0ece4] font-medium">{fmt(result.fiftyTwoWeekHigh)}</p></div>
          </div>
          {result.marketCap > 0 && <div><span className="text-[#8a8580] text-sm">Market Cap</span><p className="text-[#f0ece4] font-medium">{fmtCompact(result.marketCap)}</p></div>}
          <div className="flex gap-2">
            {RANGES.map((r, i) => (
              <button key={r.value} onClick={() => void changeRange(i)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all cursor-pointer ${
                  rangeIdx === i
                    ? 'bg-[#d4a017] text-[#1a1a1a] border-[#d4a017]'
                    : 'text-[#a0998a] border-[#2a2a2a] hover:border-[#d4a017] hover:text-[#d4a017]'
                }`}
              >{r.label}</button>
            ))}
          </div>
          {chartData.length > 0 && (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs><linearGradient id="searchGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={pos ? '#2d9d4e' : '#d93636'} stopOpacity={0.3} /><stop offset="100%" stopColor={pos ? '#2d9d4e' : '#d93636'} stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: '#8a8580', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#8a8580', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `R${v}`} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v) => [fmt(Number(v)), 'Fechamento']} />
                  <Area type="monotone" dataKey="close" stroke={pos ? '#2d9d4e' : '#d93636'} strokeWidth={2} fill="url(#searchGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
