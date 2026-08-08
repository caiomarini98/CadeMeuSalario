import { useState, useRef } from 'react';
import { FileText, Trash2, Loader2, AlertCircle, Download, CloudUpload, Pencil, Check, CreditCard } from 'lucide-react';
import { useInvoiceStore } from '../store/useInvoiceStore';
import { processInvoice } from '../services/invoiceService';
import { InvoiceCharts } from '../components/InvoiceCharts';
import { exportInvoicesToExcel, exportSingleInvoiceToExcel } from '../services/exportService';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const MONTH_OPTIONS = (() => {
  const opts: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 24; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    opts.push({ value: val, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return opts;
})();

function MonthEditor({ invoiceId, currentMonth }: { invoiceId: string; currentMonth: string }) {
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice);
  const [editing, setEditing] = useState(false);
  const [month, setMonth] = useState(currentMonth);

  if (!editing) {
    return (
      <button onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className="flex items-center gap-1.5 text-[#a0998a] text-sm hover:text-[#d4a017] transition-colors cursor-pointer px-2 py-1 rounded-lg hover:bg-[rgba(212,160,23,0.08)]">
        <span>{currentMonth || 'Definir mês'}</span>
        <Pencil size={11} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <select
        value={month}
        onChange={(e) => setMonth(e.target.value)}
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-[#f0ece4] text-sm cursor-pointer focus:outline-none focus:border-[#d4a017]"
        autoFocus
      >
        {MONTH_OPTIONS.map((o) => <option key={o.value} value={o.value} className="bg-[#141414]">{o.label}</option>)}
      </select>
      <button onClick={() => { updateInvoice(invoiceId, { referenceMonth: month }); setEditing(false); }}
        className="text-[#2d9d4e] hover:text-[#3dbd64] cursor-pointer p-0.5">
        <Check size={12} />
      </button>
    </div>
  );
}

function CardEditor({ invoiceId, currentCard, existingCards }: { invoiceId: string; currentCard?: string; existingCards: string[] }) {
  const updateInvoice = useInvoiceStore((s) => s.updateInvoice);
  const [editing, setEditing] = useState(false);
  const [card, setCard] = useState(currentCard ?? '');

  if (!editing) {
    return (
      <button onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className="flex items-center gap-1.5 text-[#8a8580] text-sm hover:text-[#8a6bbf] transition-colors cursor-pointer px-2 py-0.5 rounded-lg hover:bg-[rgba(138,107,191,0.08)]">
        <CreditCard size={10} />
        <span>{currentCard || 'Cartão'}</span>
        <Pencil size={9} />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input
        list="card-options"
        value={card}
        onChange={(e) => setCard(e.target.value)}
        placeholder="Nome do cartão"
        className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-[#f0ece4] text-sm w-28 focus:outline-none focus:border-[#8a6bbf]"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') { updateInvoice(invoiceId, { cardName: card || undefined }); setEditing(false); } }}
      />
      <datalist id="card-options">
        {existingCards.map((c) => <option key={c} value={c} />)}
      </datalist>
      <button onClick={() => { updateInvoice(invoiceId, { cardName: card || undefined }); setEditing(false); }}
        className="text-[#2d9d4e] hover:text-[#3dbd64] cursor-pointer p-0.5">
        <Check size={12} />
      </button>
    </div>
  );
}

export function InvoicesPage() {
  const { invoices, addInvoice, updateInvoice, removeInvoice } = useInvoiceStore();
  const [selId, setSelId] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [cardFilter, setCardFilter] = useState<string>('all');
  const ref = useRef<HTMLInputElement>(null);

  const handle = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const id = crypto.randomUUID();
      addInvoice({ id, fileName: file.name, uploadDate: new Date().toISOString(), referenceMonth: '', totalAmount: 0, expenses: [], status: 'processing' });
      try { const r = await processInvoice(file); updateInvoice(id, { ...r, status: 'done' }); }
      catch (e) { updateInvoice(id, { status: 'error', errorMessage: e instanceof Error ? e.message : 'Erro' }); }
    }
  };

  const done = invoices.filter((i) => i.status === 'done');

  // Get unique months for filter
  const months = Array.from(new Set(done.map((i) => i.referenceMonth).filter(Boolean))).sort();

  // Get unique cards for filter
  const cards = Array.from(new Set(done.map((i) => i.cardName).filter(Boolean) as string[])).sort();

  // Filter invoices by period and card
  const filteredInvoices = invoices.filter((i) => {
    if (i.status !== 'done') return true; // always show processing/error
    const matchPeriod = periodFilter === 'all' || i.referenceMonth === periodFilter;
    const matchCard = cardFilter === 'all' || i.cardName === cardFilter;
    return matchPeriod && matchCard;
  });

  const filteredDone = filteredInvoices.filter((i) => i.status === 'done');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#f0ece4] tracking-tight">Faturas</h1>
          <p className="text-[#8a8580] text-sm sm:text-sm mt-1">Upload e análise automática de gastos</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {done.length > 0 && (
            <button onClick={() => void exportInvoicesToExcel(filteredDone.length > 0 ? filteredDone : done)}
              className="flex items-center gap-1.5 sm:gap-2 text-sm sm:text-sm font-medium text-[#a0998a] hover:text-[#2d9d4e] bg-[#141414] hover:bg-[rgba(45,157,78,0.1)] border border-[#2a2a2a] hover:border-[#2d9d4e]/30 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 transition-all cursor-pointer">
              <Download size={14} /><span className="hidden sm:inline">Exportar Excel</span><span className="sm:hidden">Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Period filter */}
      {months.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button onClick={() => setPeriodFilter('all')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full text-sm sm:text-sm font-medium border transition-all cursor-pointer whitespace-nowrap ${
              periodFilter === 'all' ? 'bg-[#d4a017] text-[#1a1a1a] border-[#d4a017] shadow-[0_4px_12px_rgba(212,160,23,0.4)]' : 'border-[#2a2a2a] text-[#a0998a] hover:border-[#d4a017] hover:text-[#d4a017]'
            }`}>
            Todos
          </button>
          {months.map((m) => {
            const d = new Date(m + '-01');
            const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
            return (
              <button key={m} onClick={() => setPeriodFilter(periodFilter === m ? 'all' : m)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-full text-sm sm:text-sm font-medium border transition-all cursor-pointer capitalize whitespace-nowrap ${
                  periodFilter === m ? 'bg-[#d4a017] text-[#1a1a1a] border-[#d4a017] shadow-[0_4px_12px_rgba(212,160,23,0.4)]' : 'border-[#2a2a2a] text-[#a0998a] hover:border-[#d4a017] hover:text-[#d4a017]'
                }`}>
                {label}
              </button>
            );
          })}
        </div>
      )}

      {/* Card filter */}
      {cards.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <CreditCard size={14} className="text-[#8a8580] flex-shrink-0" />
          <button onClick={() => setCardFilter('all')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full text-sm sm:text-sm font-medium border transition-all cursor-pointer whitespace-nowrap ${
              cardFilter === 'all' ? 'bg-[#8a6bbf] text-white border-[#8a6bbf] shadow-[0_4px_12px_rgba(138,107,191,0.4)]' : 'border-[#2a2a2a] text-[#a0998a] hover:border-[#8a6bbf] hover:text-[#8a6bbf]'
            }`}>
            Todos
          </button>
          {cards.map((c) => (
            <button key={c} onClick={() => setCardFilter(cardFilter === c ? 'all' : c)}
              className={`px-3 sm:px-3.5 py-1.5 rounded-full text-sm sm:text-sm font-medium border transition-all cursor-pointer whitespace-nowrap ${
                cardFilter === c ? 'bg-[#8a6bbf] text-white border-[#8a6bbf] shadow-[0_4px_12px_rgba(138,107,191,0.4)]' : 'border-[#2a2a2a] text-[#a0998a] hover:border-[#8a6bbf] hover:text-[#8a6bbf]'
              }`}>
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Upload area */}
      <div
        data-tour="invoice-upload"
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); void handle(e.dataTransfer.files); }}
        onClick={() => ref.current?.click()}
        className={`relative overflow-hidden rounded-2xl p-8 text-center cursor-pointer transition-all border-2 border-dashed ${
          drag ? 'border-[#d4a017] bg-[rgba(232,180,32,0.12)]' : 'border-[#2a2a2a] hover:border-[#d4a017]/50 bg-[#141414]'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-[rgba(212,160,23,0.1)] flex items-center justify-center mx-auto mb-4">
          <CloudUpload size={24} className="text-[#d4a017]" />
        </div>
        <p className="text-[#a0998a] text-sm font-medium">Arraste faturas aqui ou clique para selecionar</p>
        <p className="text-[#8a8580] text-sm mt-1.5">PDF, imagem ou documento</p>
        <input ref={ref} type="file" multiple accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={(e) => void handle(e.target.files)} />
      </div>

      {/* Invoice list */}
      {filteredInvoices.length > 0 && (
        <div className="space-y-2">
          {filteredInvoices.map((inv) => (
            <div key={inv.id}
              onClick={() => inv.status === 'done' && setSelId(inv.id === selId ? null : inv.id)}
              className={`flex items-center gap-2 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 rounded-2xl border transition-all cursor-pointer ${
                selId === inv.id ? 'bg-[rgba(232,180,32,0.08)] border-[#d4a017]/30' : 'bg-[#141414] border-[#2a2a2a] hover:bg-[#1f1f1f]'
              }`}>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                inv.status === 'done' ? 'bg-[rgba(45,157,78,0.1)]' : inv.status === 'error' ? 'bg-[rgba(217,54,54,0.1)]' : 'bg-[rgba(230,168,23,0.1)]'
              }`}>
                <FileText size={16} className={inv.status === 'done' ? 'text-[#2d9d4e]' : inv.status === 'error' ? 'text-[#d93636]' : 'text-[#e6a817]'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[#f0ece4] text-sm sm:text-sm font-medium truncate">{inv.fileName}</p>
                <div className="flex items-center gap-1 sm:gap-2 mt-0.5 flex-wrap">
                  {inv.status === 'done'
                    ? <><MonthEditor invoiceId={inv.id} currentMonth={inv.referenceMonth} /><CardEditor invoiceId={inv.id} currentCard={inv.cardName} existingCards={cards} /></>
                    : <span className="text-[#8a8580] text-sm sm:text-sm">Processando...</span>
                  }
                  {inv.status === 'done' && <span className="text-[#8a8580] text-sm sm:text-sm hidden sm:inline">· {inv.expenses.length} itens</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0 flex items-center gap-1 sm:gap-3">
                {inv.status === 'done' && (
                  <div>
                    <p className="text-[#f0ece4] font-semibold text-sm sm:text-sm">{fmt(inv.totalAmount)}</p>
                  </div>
                )}
                {inv.status === 'processing' && <Loader2 size={14} className="animate-spin text-[#e6a817]" />}
                {inv.status === 'error' && <AlertCircle size={14} className="text-[#d93636]" />}
                {inv.status === 'done' && (
                  <span className="hidden sm:inline px-2.5 py-1 rounded-full text-sm font-semibold uppercase tracking-wider bg-[rgba(45,157,78,0.1)] text-[#2d9d4e]">Processada</span>
                )}
              </div>
              {inv.status === 'done' && (
                <button onClick={(e) => { e.stopPropagation(); void exportSingleInvoiceToExcel(inv); }}
                  className="text-[#8a8580] hover:text-[#2d9d4e] transition-colors cursor-pointer p-1 rounded-lg hover:bg-[rgba(45,157,78,0.1)] flex-shrink-0 hidden sm:block"
                  aria-label={`Exportar ${inv.fileName}`}>
                  <Download size={14} />
                </button>
              )}
              <button onClick={(e) => { e.stopPropagation(); removeInvoice(inv.id); }}
                className="text-[#8a8580] hover:text-[#d93636] transition-colors cursor-pointer p-1 rounded-lg hover:bg-[rgba(217,54,54,0.1)] flex-shrink-0"
                aria-label={`Remover ${inv.fileName}`}>
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div data-tour="invoice-charts">
        <InvoiceCharts invoices={filteredInvoices} selectedInvoiceId={selId} />
      </div>
    </div>
  );
}
