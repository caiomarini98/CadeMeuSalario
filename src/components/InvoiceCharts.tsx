import { useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LineChart, Line, PieChart, Pie, LabelList } from 'recharts';
import type { Invoice } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import { useInvoiceStore, getMonthlyTotals, getCategoryByMonth, getAllCategories } from '../store/useInvoiceStore';
import { CategoryIcon } from './CategoryIcon';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const fmtMonth = (m: string) => { const [y, mo] = m.split('-'); return `${mo}/${y}`; };

const CATEGORY_COLORS: Record<string, string> = {
  'Mercado': '#2d9d4e', 'Alimentação (Trabalho)': '#e08a1e', 'Alimentação (Lazer)': '#f59e0b',
  'Alimentação': '#e08a1e', 'Transporte': '#d4a017', 'Moradia': '#d93636',
  'Saúde': '#2d9d4e', 'Educação': '#06b6d4', 'Lazer': '#8a6bbf',
  'Assinaturas': '#a855f7', 'Compras': '#10b981', 'Serviços': '#f97316', 'Outros': '#6366f1',
};
const FALLBACK_COLORS = ['#14b8a6', '#eab308', '#0ea5e9', '#f43f5e', '#84cc16'];
function catColor(name: string, idx = 0) { return CATEGORY_COLORS[name] ?? FALLBACK_COLORS[idx % FALLBACK_COLORS.length]; }

const ts = { background: '#141414', border: '1px solid #2a2a2a', borderRadius: '12px', color: '#f0ece4', fontSize: '13px', padding: '10px 14px' };

function dlChart(ref: React.RefObject<HTMLDivElement | null>, name: string) {
  const svg = ref.current?.querySelector('svg'); if (!svg) return;
  const clone = svg.cloneNode(true) as SVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bg.setAttribute('width', '100%'); bg.setAttribute('height', '100%'); bg.setAttribute('fill', '#0a0a0a');
  clone.insertBefore(bg, clone.firstChild);
  const blob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d'); const img = new Image();
  img.onload = () => { canvas.width = img.width * 2; canvas.height = img.height * 2; ctx!.scale(2, 2); ctx!.drawImage(img, 0, 0); URL.revokeObjectURL(url);
    canvas.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${name}.png`; a.click(); URL.revokeObjectURL(a.href); }, 'image/png'); };
  img.src = url;
}

interface TrackedExpense { description: string; amount: number; invoiceId: string; expenseIndex: number; }

function ChartCard({ title, children, dlRef, dlName, extra }: {
  title: string; children: React.ReactNode; dlRef?: React.RefObject<HTMLDivElement | null>; dlName?: string; extra?: React.ReactNode;
}) {
  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4 sm:mb-5 gap-2">
        <h3 className="text-[#8a8580] text-sm sm:text-sm font-semibold uppercase tracking-wider">{title}</h3>
        <div className="flex items-center gap-3 flex-shrink-0">
          {extra}
          {dlRef && dlName && (
            <button onClick={() => dlChart(dlRef, dlName)} className="flex items-center gap-1.5 text-sm text-[#8a8580] hover:text-[#a0998a] transition-colors cursor-pointer">
              <Download size={10} />PNG
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function TrendChart({ trendData, allCats, trendRef }: { trendData: Record<string, string | number>[]; allCats: string[]; trendRef: React.RefObject<HTMLDivElement | null> }) {
  const [visibleCats, setVisibleCats] = useState<Set<string>>(() => new Set(allCats.slice(0, 3)));

  const toggleCat = (cat: string) => {
    setVisibleCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
      return next;
    });
  };

  const selectAll = () => setVisibleCats(new Set(allCats));
  const selectNone = () => setVisibleCats(new Set());

  return (
    <ChartCard title="Tendência por categoria" dlRef={trendRef} dlName="tendencia">
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={selectAll} className="px-2 py-1 text-xs rounded-lg border border-[#2a2a2a] text-[#8a8580] hover:border-[#d4a017] hover:text-[#d4a017] transition-colors cursor-pointer">Todas</button>
        <button onClick={selectNone} className="px-2 py-1 text-xs rounded-lg border border-[#2a2a2a] text-[#8a8580] hover:border-[#d4a017] hover:text-[#d4a017] transition-colors cursor-pointer">Nenhuma</button>
        {allCats.map((cat, i) => {
          const color = catColor(cat, i);
          const active = visibleCats.has(cat);
          return (
            <button key={cat} onClick={() => toggleCat(cat)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer ${active ? 'border-opacity-60 text-[#f0ece4]' : 'border-[#2a2a2a] text-[#8a8580] opacity-50 hover:opacity-80'}`}
              style={active ? { borderColor: color, backgroundColor: `${color}20` } : {}}>
              <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: color }} />
              {cat}
            </button>
          );
        })}
      </div>
      <div className="h-64 sm:h-80" ref={trendRef}><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
        <XAxis dataKey="month" tick={{ fill: '#8a8580', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmtMonth} />
        <YAxis tick={{ fill: '#8a8580', fontSize: 12 }} axisLine={false} tickLine={false} width={50} />
        <Tooltip contentStyle={ts} labelStyle={{ color: '#f0ece4' }} itemStyle={{ color: '#f0ece4' }} formatter={(v) => fmt(Number(v))} labelFormatter={(label) => fmtMonth(String(label))} cursor={false} />
        {allCats.filter((c) => visibleCats.has(c)).map((c) => <Line key={c} type="monotone" dataKey={c} stroke={catColor(c, allCats.indexOf(c))} strokeWidth={2.5} dot={false} />)}
      </LineChart></ResponsiveContainer></div>
    </ChartCard>
  );
}

export function InvoiceCharts({ invoices, selectedInvoiceId }: { invoices: Invoice[]; selectedInvoiceId?: string | null }) {
  const monthRef = useRef<HTMLDivElement>(null); const trendRef = useRef<HTMLDivElement>(null); const pieRef = useRef<HTMLDivElement>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [detailFilter, setDetailFilter] = useState<string>('all');
  const updateExpenseCategory = useInvoiceStore((s) => s.updateExpenseCategory);
  const done = invoices.filter((i) => i.status === 'done'); if (done.length === 0) return null;

  const monthData = getMonthlyTotals(done);
  const trendData = getCategoryByMonth(done);
  const allCats = getAllCategories(done);
  const sel = selectedInvoiceId ? done.find((i) => i.id === selectedInvoiceId) : null;
  const selData = sel ? (() => { const m = new Map<string, number>(); for (const e of sel.expenses) m.set(e.category, (m.get(e.category) ?? 0) + e.amount); return Array.from(m.entries()).map(([n, v]) => ({ name: n, value: Number(v.toFixed(2)) })).sort((a, b) => b.value - a.value); })() : [];

  // Filtered invoices for detail section
  const filteredDone = detailFilter === 'all' ? done : done.filter((i) => i.id === detailFilter);
  const expensesByCategory = new Map<string, TrackedExpense[]>();
  for (const inv of filteredDone) {
    for (let idx = 0; idx < inv.expenses.length; idx++) {
      const e = inv.expenses[idx];
      const list = expensesByCategory.get(e.category) ?? [];
      list.push({ description: e.description, amount: e.amount, invoiceId: inv.id, expenseIndex: idx });
      expensesByCategory.set(e.category, list);
    }
  }
  const filteredCatData = Array.from(expensesByCategory.entries())
    .map(([name, items]) => ({ name, value: Number(items.reduce((s, i) => s + i.amount, 0).toFixed(2)) }))
    .sort((a, b) => b.value - a.value);
  const filteredTotal = filteredCatData.reduce((s, c) => s + c.value, 0);
  const filteredInvoiceTotal = filteredDone.reduce((s, i) => s + i.totalAmount, 0);

  const filterSelect = done.length > 1 ? (
    <select value={detailFilter} onChange={(e) => { setDetailFilter(e.target.value); setExpandedCat(null); }}
      className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-[#a0998a] text-sm sm:text-sm cursor-pointer hover:border-[#d4a017]/50 transition-colors focus:border-[#d4a017] max-w-[140px] sm:max-w-[200px] truncate"
      aria-label="Filtrar por fatura">
      <option value="all" className="bg-[#141414] text-[#f0ece4]">Todas as faturas</option>
      {done.map((inv) => (
        <option key={inv.id} value={inv.id} className="bg-[#141414] text-[#f0ece4]">
          {inv.fileName} {inv.referenceMonth ? `(${inv.referenceMonth})` : ''}
        </option>
      ))}
    </select>
  ) : undefined;

  return (
    <div className="space-y-4">
      {/* Selected invoice pie chart */}
      {sel && selData.length > 0 && (
        <ChartCard title={`Gastos: ${sel.fileName}`} dlRef={pieRef} dlName={`fatura_${sel.referenceMonth}`}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="h-72 w-full sm:w-1/2" ref={pieRef}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={selData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" innerRadius="40%" paddingAngle={2}>
                    {selData.map((entry, i) => <Cell key={entry.name} fill={catColor(entry.name, i)} />)}
                  </Pie>
                  <Tooltip contentStyle={ts} formatter={(v) => fmt(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full sm:w-1/2 space-y-1.5">
              {selData.map((entry, i) => (
                <div key={entry.name} className="flex items-center justify-between text-sm gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: catColor(entry.name, i) }} />
                    <span className="text-[#a0998a] truncate">{entry.name}</span>
                  </div>
                  <span className="text-[#f0ece4] font-medium whitespace-nowrap">{fmt(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      )}

      {/* Category breakdown */}
      <ChartCard title="Detalhamento por categoria" extra={filterSelect}>
        <div className="mb-4 px-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#f0ece4] text-xl font-bold">{fmt(filteredTotal)}</span>
            <span className="text-[#8a8580] text-sm">{filteredCatData.length} categorias · {filteredDone.reduce((s, i) => s + i.expenses.length, 0)} itens</span>
          </div>
          {filteredInvoiceTotal > 0 && Math.abs(filteredInvoiceTotal - filteredTotal) > 0.01 && (
            <p className="text-[#8a8580] text-sm">Total fatura: {fmt(filteredInvoiceTotal)}</p>
          )}
        </div>

        {/* Pie chart */}
        <div className="h-72 sm:h-80 mb-6">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={filteredCatData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="80%" innerRadius="35%" paddingAngle={2} label={((props: Record<string, unknown>) => `${props.name ?? ''} ${(((props.percent as number) ?? 0) * 100).toFixed(0)}%`) as unknown as boolean} labelLine={false}>
                {filteredCatData.map((entry, i) => <Cell key={entry.name} fill={catColor(entry.name, i)} />)}
              </Pie>
              <Tooltip contentStyle={ts} formatter={(v, name) => [fmt(Number(v)), name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Horizontal bars with inline expand */}
        <div className="space-y-2">
          {filteredCatData.map((cat, i) => {
            const totalPct = filteredTotal > 0 ? (cat.value / filteredTotal) * 100 : 0;
            const color = catColor(cat.name, i);
            const isExpanded = expandedCat === cat.name;
            return (
              <div key={cat.name}>
                <button onClick={() => setExpandedCat(isExpanded ? null : cat.name)}
                  className={`w-full text-left rounded-xl p-3 transition-colors cursor-pointer ${isExpanded ? 'bg-[#1f1f1f]' : 'hover:bg-[#1a1a1a]'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon name={cat.name} color={color} size={20} />
                      <span className="text-[#f0ece4] text-base font-medium">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[#f0ece4] text-base font-bold">{fmt(cat.value)}</span>
                      <span className="text-[#8a8580] text-base font-semibold w-14 text-right">{totalPct.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="h-4 bg-[#0a0a0a] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${totalPct}%`, backgroundColor: color }} />
                  </div>
                </button>
                {/* Inline expanded items */}
                {isExpanded && (
                  <div className="ml-4 mr-2 mt-1 mb-2 pl-4 border-l-2 space-y-1 max-h-[300px] overflow-y-auto scrollbar-thin" style={{ borderColor: color }}>
                    {(expensesByCategory.get(cat.name) ?? []).sort((a, b) => b.amount - a.amount).map((item, j) => (
                      <div key={`${item.invoiceId}-${item.expenseIndex}-${j}`}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1a1a1a] text-sm gap-2">
                        <span className="text-[#a0998a] truncate flex-1 min-w-0">{item.description}</span>
                        <select value={cat.name}
                          onChange={(e) => { updateExpenseCategory(item.invoiceId, item.expenseIndex, e.target.value); setExpandedCat(null); }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-2 py-1 text-[#a0998a] text-sm cursor-pointer hover:border-[#d4a017]/50 focus:border-[#d4a017] flex-shrink-0 hidden sm:block"
                          aria-label={`Categoria de ${item.description}`}>
                          {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c} className="bg-[#141414] text-[#f0ece4]">{c}</option>)}
                        </select>
                        <span className="text-[#f0ece4] font-semibold whitespace-nowrap">{fmt(item.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ChartCard>

      {/* Monthly totals */}
      {monthData.length > 1 && (
        <ChartCard title="Total por mês" dlRef={monthRef} dlName="total_mensal">
          <div className="h-64 sm:h-80" ref={monthRef}><ResponsiveContainer width="100%" height="100%"><BarChart data={monthData} margin={{ top: 30 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="month" tick={{ fill: '#8a8580', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={fmtMonth} />
            <YAxis tick={{ fill: '#8a8580', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} width={50} />
            <Tooltip contentStyle={ts} labelStyle={{ color: '#f0ece4' }} itemStyle={{ color: '#f0ece4' }} formatter={(v) => fmt(Number(v))} labelFormatter={(label) => fmtMonth(String(label))} cursor={false} />
            <Bar dataKey="total" fill="#d4a017" radius={[8, 8, 0, 0]}>
              <LabelList dataKey="total" position="top" fill="#f0ece4" fontSize={11} formatter={(v: unknown) => fmt(Number(v))} />
            </Bar>
          </BarChart></ResponsiveContainer></div>
        </ChartCard>
      )}

      {/* Trend lines */}
      {trendData.length > 1 && allCats.length > 0 && (
        <TrendChart trendData={trendData} allCats={allCats} trendRef={trendRef} />
      )}
    </div>
  );
}
