import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';

const noSpinner = "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";
const inputCls = `w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-[#f0ece4] text-sm placeholder:text-[#8a8580] focus:outline-none focus:border-[#d4a017] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.12)] transition-all ${noSpinner}`;

export function AddStockForm({ prefillTicker = '', onAdded }: { prefillTicker?: string; onAdded?: () => void }) {
  const addStock = usePortfolioStore((s) => s.addStock);
  const [ticker, setTicker] = useState(prefillTicker);
  const [qty, setQty] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => { if (prefillTicker) setTicker(prefillTicker); }, [prefillTicker]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = Number(qty), p = Number(price);
    if (!ticker.trim() || q <= 0 || p <= 0) return;
    addStock({ ticker: ticker.trim().toUpperCase(), quantity: q, averagePrice: p });
    setTicker(''); setQty(''); setPrice(''); onAdded?.();
  };

  return (
    <form onSubmit={submit} className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[120px]">
        <label htmlFor="ticker" className="block text-sm text-[#8a8580] mb-1.5 font-medium">Ticker</label>
        <input id="ticker" type="text" placeholder="PETR4" value={ticker} onChange={(e) => setTicker(e.target.value)} className={inputCls} />
      </div>
      <div className="flex-1 min-w-[100px]">
        <label htmlFor="qty" className="block text-sm text-[#8a8580] mb-1.5 font-medium">Quantidade</label>
        <input id="qty" type="number" placeholder="100" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} className={inputCls} />
      </div>
      <div className="flex-1 min-w-[120px]">
        <label htmlFor="avg" className="block text-sm text-[#8a8580] mb-1.5 font-medium">Preço médio</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8580] text-sm pointer-events-none">R$</span>
          <input id="avg" type="number" placeholder="28,50" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)}
            className={`w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl pl-9 pr-4 py-2.5 text-[#f0ece4] text-sm placeholder:text-[#8a8580] focus:outline-none focus:border-[#d4a017] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.12)] transition-all ${noSpinner}`} />
        </div>
      </div>
      <button type="submit" className="flex items-center gap-2 bg-[#d4a017] hover:bg-[#b8890f] text-[#1a1a1a] font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_4px_12px_rgba(212,160,23,0.4)] cursor-pointer">
        <Plus size={18} />Adicionar
      </button>
    </form>
  );
}
