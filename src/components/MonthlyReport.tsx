import { useState, useRef } from 'react';
import { Share2, Camera } from 'lucide-react';
import { useInvoiceStore, getExpensesByCategory } from '../store/useInvoiceStore';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function MonthlyReport() {
  const invoices = useInvoiceStore((s) => s.invoices);
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);

  const done = invoices.filter((i) => i.status === 'done');
  if (done.length === 0) return null;

  // Determine latest month
  const months = Array.from(new Set(done.map((i) => i.referenceMonth).filter(Boolean))).sort();
  const latestMonth = months[months.length - 1];
  const prevMonth = months.length > 1 ? months[months.length - 2] : null;

  const monthInvoices = done.filter((i) => i.referenceMonth === latestMonth);
  const total = monthInvoices.reduce((s, i) => s + i.totalAmount, 0);
  const prevTotal = prevMonth ? done.filter((i) => i.referenceMonth === prevMonth).reduce((s, i) => s + i.totalAmount, 0) : null;
  const diff = prevTotal !== null ? ((total - prevTotal) / prevTotal) * 100 : null;

  const spending = getExpensesByCategory(monthInvoices);
  const topCategories = Array.from(spending.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const totalExpenses = monthInvoices.reduce((s, i) => s + i.expenses.length, 0);

  const fmtMonthLabel = (m: string) => {
    const [y, mo] = m.split('-');
    const date = new Date(Number(y), Number(mo) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).replace(/^./, (c) => c.toUpperCase());
  };

  const generateImage = async () => {
    if (!cardRef.current) return;
    setGenerating(true);

    try {
      // Use html2canvas-like approach with SVG foreignObject
      const card = cardRef.current;
      const clone = card.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.left = '-9999px';
      document.body.appendChild(clone);

      const canvas = document.createElement('canvas');
      const scale = 2;
      canvas.width = card.offsetWidth * scale;
      canvas.height = card.offsetHeight * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(scale, scale);

      // Draw background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, card.offsetWidth, card.offsetHeight);

      // Draw card background
      ctx.fillStyle = '#141414';
      ctx.roundRect(16, 16, card.offsetWidth - 32, card.offsetHeight - 32, 16);
      ctx.fill();

      // Draw text content
      ctx.fillStyle = '#f0ece4';
      ctx.font = 'bold 20px system-ui';
      ctx.fillText(`Resumo ${fmtMonthLabel(latestMonth)}`, 40, 56);

      ctx.fillStyle = '#d4a017';
      ctx.font = 'bold 32px system-ui';
      ctx.fillText(fmt(total), 40, 100);

      if (diff !== null) {
        ctx.fillStyle = diff > 0 ? '#d93636' : '#2d9d4e';
        ctx.font = '14px system-ui';
        ctx.fillText(`${diff > 0 ? '+' : ''}${diff.toFixed(0)}% vs mês anterior`, 40, 124);
      }

      ctx.fillStyle = '#8a8580';
      ctx.font = '13px system-ui';
      ctx.fillText(`${totalExpenses} itens · ${monthInvoices.length} faturas`, 40, 148);

      // Draw categories
      let y = 180;
      ctx.fillStyle = '#8a8580';
      ctx.font = 'bold 12px system-ui';
      ctx.fillText('TOP CATEGORIAS', 40, y);
      y += 24;

      for (const [cat, amount] of topCategories) {
        ctx.fillStyle = '#f0ece4';
        ctx.font = '14px system-ui';
        ctx.fillText(cat, 40, y);
        ctx.fillStyle = '#a0998a';
        ctx.font = 'bold 14px system-ui';
        ctx.textAlign = 'right';
        ctx.fillText(fmt(amount), card.offsetWidth - 40, y);
        ctx.textAlign = 'left';
        y += 28;
      }

      // Watermark
      y += 16;
      ctx.fillStyle = '#8a8580';
      ctx.font = '11px system-ui';
      ctx.fillText('cademeusalario.com.br', 40, y);

      document.body.removeChild(clone);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);

        // Try native share first (mobile)
        if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'resumo.png', { type: 'image/png' })] })) {
          navigator.share({
            title: `Resumo ${fmtMonthLabel(latestMonth)}`,
            files: [new File([blob], 'resumo-mensal.png', { type: 'image/png' })],
          }).catch(() => downloadImage(url));
        } else {
          downloadImage(url);
        }
        setGenerating(false);
      }, 'image/png');
    } catch {
      setGenerating(false);
    }
  };

  const downloadImage = (url: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `resumo-${latestMonth}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera size={16} className="text-[#d4a017]" />
          <h3 className="text-[#8a8580] text-sm font-semibold uppercase tracking-wider">Resumo do mês</h3>
        </div>
        <button onClick={generateImage} disabled={generating}
          className="flex items-center gap-1.5 text-sm text-[#d4a017] hover:text-[#f0ece4] transition-colors cursor-pointer disabled:opacity-50">
          <Share2 size={14} />{generating ? 'Gerando...' : 'Compartilhar'}
        </button>
      </div>

      {/* Visual card preview */}
      <div ref={cardRef} className="bg-[#0a0a0a] rounded-xl p-5 space-y-4">
        <div>
          <p className="text-[#8a8580] text-sm">{fmtMonthLabel(latestMonth)}</p>
          <p className="text-[#f0ece4] text-2xl font-bold">{fmt(total)}</p>
          <div className="flex items-center gap-3 mt-1">
            {diff !== null && (
              <span className={`text-sm font-medium ${diff > 0 ? 'text-[#d93636]' : 'text-[#2d9d4e]'}`}>
                {diff > 0 ? '+' : ''}{diff.toFixed(0)}% vs anterior
              </span>
            )}
            <span className="text-[#8a8580] text-sm">{totalExpenses} itens</span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[#8a8580] text-xs font-semibold uppercase tracking-wider">Top categorias</p>
          {topCategories.map(([cat, amount]) => (
            <div key={cat} className="flex items-center justify-between">
              <span className="text-[#f0ece4] text-sm">{cat}</span>
              <span className="text-[#a0998a] text-sm font-medium">{fmt(amount)}</span>
            </div>
          ))}
        </div>

        <p className="text-[#8a8580] text-xs pt-2 border-t border-[#2a2a2a]">cademeusalario.com.br</p>
      </div>
    </div>
  );
}
