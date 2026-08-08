import { useState } from 'react';
import { Trash2, TrendingUp, TrendingDown, Pencil, Check, X } from 'lucide-react';
import type { Stock, StockQuote } from '../types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtP = (v: number) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
const noSpinner = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

function Row({ stock, quote, onRemove, onEdit }: { stock: Stock; quote?: StockQuote; onRemove: (t: string) => void; onEdit: (s: Stock) => void }) {
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState(String(stock.quantity));
  const [price, setPrice] = useState(String(stock.averagePrice));
  const cp = quote?.regularMarketPrice ?? null;
  const inv = stock.quantity * stock.averagePrice;
  const cur = cp !== null ? stock.quantity * cp : null;
  const pl = cur !== null ? cur - inv : null;
  const plp = pl !== null && inv > 0 ? (pl / inv) * 100 : null;
  const pos = pl !== null && pl >= 0;

  const startEdit = () => { setQty(String(stock.quantity)); setPrice(String(stock.averagePrice)); setEditing(true); };
  const confirm = () => { const q = Number(qty), p = Number(price); if (q > 0 && p > 0) onEdit({ ticker: stock.ticker, quantity: q, averagePrice: p }); setEditing(false); };
  const cancel = () => setEditing(false);
  const onKey = (e: React.KeyboardEvent) => { if (e.key === 'Enter') confirm(); if (e.key === 'Escape') cancel(); };

  return (
    <div className="grid grid-cols-[2fr_0.8fr_1fr_1fr_1fr_1fr_1.4fr_80px] gap-4 items-center px-5 py-4 border-b border-[#1a1a1a] hover:bg-[#1f1f1f] transition-colors group">
      {/* Ticker with logo */}
      <div className="flex items-center gap-3">
        {quote?.logourl ? (
          <img src={quote.logourl} alt={stock.ticker}
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden'); }}
            className="w-10 h-10 rounded-xl object-contain bg-white/10 p-0.5 flex-shrink-0" />
        ) : null}
        <div className={`w-10 h-10 rounded-xl bg-[#2a2a2a] flex items-center justify-center text-[#a0998a] font-bold text-sm flex-shrink-0 ${quote?.logourl ? 'hidden' : ''}`}>
          {stock.ticker.slice(0, 2)}
        </div>
        <div>
          <span className="text-[#f0ece4] font-semibold text-sm">{stock.ticker}</span>
          <p className="text-[#8a8580] text-sm truncate max-w-[140px]">{quote?.shortName ?? 'Carregando...'}</p>
        </div>
      </div>
      {/* Qty */}
      <div className="text-right text-[#f0ece4] text-sm">
        {editing ? (
          <input type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} onKeyDown={onKey}
            className={`w-20 bg-[#1a1a1a] border border-[#d4a017] rounded-lg px-2 py-1 text-right text-[#f0ece4] text-sm focus:outline-none ${noSpinner}`} autoFocus />
        ) : stock.quantity}
      </div>
      {/* Avg price */}
      <div className="text-right text-[#a0998a] text-sm">
        {editing ? (
          <div className="relative inline-block">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#8a8580] text-sm pointer-events-none">R$</span>
            <input type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} onKeyDown={onKey}
              className={`w-28 bg-[#1a1a1a] border border-[#d4a017] rounded-lg pl-7 pr-2 py-1 text-right text-[#f0ece4] text-sm focus:outline-none ${noSpinner}`} />
          </div>
        ) : fmt(stock.averagePrice)}
      </div>
      {/* Current price */}
      <div className="text-right text-[#f0ece4] text-sm font-medium">{cp !== null ? fmt(cp) : '—'}</div>
      {/* Invested */}
      <div className="text-right text-[#8a8580] text-sm">{fmt(inv)}</div>
      {/* Current value */}
      <div className="text-right text-[#f0ece4] text-sm font-medium">{cur !== null ? fmt(cur) : '—'}</div>
      {/* P&L */}
      <div className="text-right">
        {pl !== null ? (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-sm font-medium ${pos ? 'bg-[rgba(45,157,78,0.1)] text-[#2d9d4e]' : 'bg-[rgba(217,54,54,0.1)] text-[#d93636]'}`}>
            {pos ? <TrendingUp size={12} /> : <TrendingDown size={12} />}<span>{fmt(pl)}</span><span className="text-[#8a8580]">·</span><span>{fmtP(plp!)}</span>
          </div>
        ) : <span className="text-[#8a8580]">—</span>}
      </div>
      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        {editing ? (<>
          <button onClick={confirm} className="text-[#2d9d4e] hover:text-[#3dbd64] transition-colors cursor-pointer" aria-label="Confirmar"><Check size={14} /></button>
          <button onClick={cancel} className="text-[#8a8580] hover:text-[#f0ece4] transition-colors cursor-pointer" aria-label="Cancelar"><X size={14} /></button>
        </>) : (<>
          <button onClick={startEdit} className="text-[#8a8580] hover:text-[#d4a017] transition-colors cursor-pointer" aria-label={`Editar ${stock.ticker}`}><Pencil size={14} /></button>
          <button onClick={() => onRemove(stock.ticker)} className="text-[#8a8580] hover:text-[#d93636] transition-colors cursor-pointer" aria-label={`Remover ${stock.ticker}`}><Trash2 size={14} /></button>
        </>)}
      </div>
    </div>
  );
}

export function StockTable({ stocks, quotes, onRemove, onEdit }: { stocks: Stock[]; quotes: Map<string, StockQuote>; onRemove: (t: string) => void; onEdit: (s: Stock) => void }) {
  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-x-auto">
      <div className="min-w-[800px]">
      <div className="grid grid-cols-[2fr_0.8fr_1fr_1fr_1fr_1fr_1.4fr_80px] gap-4 px-5 py-3 border-b border-[#2a2a2a] text-[#8a8580] text-sm font-semibold uppercase tracking-wider">
        <span>Ativo</span>
        <span className="text-right">Qtd.</span>
        <span className="text-right">Preço médio</span>
        <span className="text-right">Cotação atual</span>
        <span className="text-right">Total investido</span>
        <span className="text-right">Valor atual</span>
        <span className="text-right">Resultado</span>
        <span></span>
      </div>
      {stocks.map((s) => <Row key={s.ticker} stock={s} quote={quotes.get(s.ticker)} onRemove={onRemove} onEdit={onEdit} />)}
      </div>
    </div>
  );
}
