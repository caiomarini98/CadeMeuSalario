import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useFixedIncomeStore } from '../store/useFixedIncomeStore';
import { FIXED_INCOME_TYPES } from '../types';
import type { FixedIncomeType } from '../types';

export function AddFixedIncomeForm({ onAdded }: { onAdded?: () => void }) {
  const addItem = useFixedIncomeStore((s) => s.addItem);
  const [name, setName] = useState('');
  const [type, setType] = useState<FixedIncomeType>('tesouro');
  const [invested, setInvested] = useState('');
  const [current, setCurrent] = useState('');
  const [rate, setRate] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [maturityDate, setMaturityDate] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const inv = Number(invested), cur = Number(current);
    if (!name.trim() || inv <= 0) return;
    addItem({
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      investedAmount: inv,
      currentAmount: cur > 0 ? cur : inv,
      rate: rate.trim(),
      purchaseDate: purchaseDate || new Date().toISOString().slice(0, 10),
      maturityDate: maturityDate || undefined,
    });
    setName(''); setInvested(''); setCurrent(''); setRate(''); setPurchaseDate(''); setMaturityDate('');
    onAdded?.();
  };

  const inputCls = "w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-[#f0ece4] text-sm placeholder:text-[#8a8580] focus:outline-none focus:border-[#d4a017] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.12)] transition-all";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <label htmlFor="fi-name" className="block text-sm text-[#8a8580] mb-1.5 font-medium">Nome do título</label>
          <input id="fi-name" type="text" placeholder="Tesouro IPCA+ 2029" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="fi-type" className="block text-sm text-[#8a8580] mb-1.5 font-medium">Tipo</label>
          <select id="fi-type" value={type} onChange={(e) => setType(e.target.value as FixedIncomeType)} className={inputCls + ' cursor-pointer'}>
            {FIXED_INCOME_TYPES.map((t) => <option key={t.value} value={t.value} className="bg-[#141414] text-[#f0ece4]">{t.label}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="fi-rate" className="block text-sm text-[#8a8580] mb-1.5 font-medium">Taxa / Indexador</label>
          <input id="fi-rate" type="text" placeholder="IPCA + 6,5% a.a." value={rate} onChange={(e) => setRate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="fi-invested" className="block text-sm text-[#8a8580] mb-1.5 font-medium">Valor investido (R$)</label>
          <input id="fi-invested" type="number" placeholder="5000.00" min="0.01" step="0.01" value={invested} onChange={(e) => setInvested(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="fi-current" className="block text-sm text-[#8a8580] mb-1.5 font-medium">Valor atual (R$)</label>
          <input id="fi-current" type="number" placeholder="5320.00" min="0" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="fi-purchase" className="block text-sm text-[#8a8580] mb-1.5 font-medium">Data da compra</label>
          <input id="fi-purchase" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="fi-maturity" className="block text-sm text-[#8a8580] mb-1.5 font-medium">Vencimento (opcional)</label>
          <input id="fi-maturity" type="date" value={maturityDate} onChange={(e) => setMaturityDate(e.target.value)} className={inputCls} />
        </div>
      </div>
      <button type="submit" className="flex items-center gap-2 bg-[#d4a017] hover:bg-[#b8890f] text-[#1a1a1a] text-sm font-semibold px-5 py-2.5 rounded-xl transition-all hover:shadow-[0_4px_12px_rgba(212,160,23,0.4)] cursor-pointer">
        <Plus size={16} />Adicionar
      </button>
    </form>
  );
}
