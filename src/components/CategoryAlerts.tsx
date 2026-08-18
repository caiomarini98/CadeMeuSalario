import { useState } from 'react';
import { Bell, Plus, Trash2, AlertTriangle } from 'lucide-react';
import { useAlertsStore } from '../store/useAlertsStore';
import { useInvoiceStore, getExpensesByCategory } from '../store/useInvoiceStore';
import { EXPENSE_CATEGORIES } from '../types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function CategoryAlerts() {
  const { alerts, addAlert, removeAlert } = useAlertsStore();
  const invoices = useInvoiceStore((s) => s.invoices);
  const [adding, setAdding] = useState(false);
  const [newCat, setNewCat] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [newLimit, setNewLimit] = useState('');

  const done = invoices.filter((i) => i.status === 'done');

  // Get current month spending by category
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthInvoices = done.filter((i) => i.referenceMonth === currentMonth);
  const spending = getExpensesByCategory(currentMonthInvoices);

  const handleAdd = () => {
    if (!newLimit || Number(newLimit) <= 0) return;
    addAlert({
      id: crypto.randomUUID(),
      category: newCat,
      limitAmount: Number(newLimit),
      enabled: true,
    });
    setAdding(false);
    setNewLimit('');
  };

  const exceededAlerts = alerts.filter((a) => a.enabled && (spending.get(a.category) ?? 0) > a.limitAmount);

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#d4a017]" />
          <h3 className="text-[#8a8580] text-sm font-semibold uppercase tracking-wider">Alertas de gastos</h3>
        </div>
        <button onClick={() => setAdding(!adding)}
          className="flex items-center gap-1 text-sm text-[#d4a017] hover:text-[#f0ece4] transition-colors cursor-pointer">
          <Plus size={14} />Novo
        </button>
      </div>

      {/* Exceeded alerts banner */}
      {exceededAlerts.length > 0 && (
        <div className="mb-4 space-y-2">
          {exceededAlerts.map((a) => (
            <div key={a.id} className="flex items-center gap-2 bg-[rgba(217,54,54,0.1)] border border-[#d93636]/20 rounded-xl px-3 py-2">
              <AlertTriangle size={14} className="text-[#d93636] flex-shrink-0" />
              <span className="text-[#d93636] text-sm flex-1">
                <strong>{a.category}</strong>: {fmt(spending.get(a.category) ?? 0)} de {fmt(a.limitAmount)} limite
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Add form */}
      {adding && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-[#1a1a1a] rounded-xl">
          <select value={newCat} onChange={(e) => setNewCat(e.target.value)}
            className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-[#f0ece4] cursor-pointer flex-1 min-w-[120px]">
            {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input type="number" placeholder="Limite (R$)" value={newLimit} onChange={(e) => setNewLimit(e.target.value)}
            className="bg-[#0a0a0a] border border-[#2a2a2a] rounded-lg px-2 py-1.5 text-sm text-[#f0ece4] w-28" />
          <button onClick={handleAdd}
            className="px-3 py-1.5 bg-[#d4a017] text-[#1a1a1a] text-sm font-medium rounded-lg hover:bg-[#b8890f] transition-colors cursor-pointer">
            Salvar
          </button>
        </div>
      )}

      {/* Alert list */}
      {alerts.length === 0 && !adding && (
        <p className="text-[#8a8580] text-sm">Nenhum alerta configurado. Defina limites por categoria para ser avisado quando exceder.</p>
      )}

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => {
            const spent = spending.get(a.category) ?? 0;
            const pct = a.limitAmount > 0 ? Math.min((spent / a.limitAmount) * 100, 100) : 0;
            const exceeded = spent > a.limitAmount;
            return (
              <div key={a.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#1a1a1a] transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[#f0ece4] text-sm font-medium">{a.category}</span>
                    <span className={`text-sm font-medium ${exceeded ? 'text-[#d93636]' : 'text-[#8a8580]'}`}>
                      {fmt(spent)} / {fmt(a.limitAmount)}
                    </span>
                  </div>
                  <div className="h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${exceeded ? 'bg-[#d93636]' : pct > 80 ? 'bg-[#e6a817]' : 'bg-[#2d9d4e]'}`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <button onClick={() => removeAlert(a.id)}
                  className="text-[#8a8580] hover:text-[#d93636] cursor-pointer p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
