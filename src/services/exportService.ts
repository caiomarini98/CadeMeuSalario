import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { Stock, StockQuote, Invoice, FixedIncome, SavingsGoal } from '../types';

function styleHeader(row: ExcelJS.Row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6D28D9' } };
    cell.alignment = { horizontal: 'center' };
  });
}

function autoFit(ws: ExcelJS.Worksheet) {
  ws.columns.forEach((col) => {
    let max = 12;
    col.eachCell?.({ includeEmpty: false }, (c) => { const l = String(c.value ?? '').length; if (l > max) max = l; });
    col.width = Math.min(max + 4, 30);
  });
}

function fmtCurrency(ws: ExcelJS.Worksheet, colKey: string) {
  const col = ws.getColumn(colKey);
  col.numFmt = '#,##0.00';
}

async function download(wb: ExcelJS.Workbook, name: string) {
  const buf = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), name);
}

export async function exportPortfolioToExcel(stocks: Stock[], quotes: Map<string, StockQuote>, fixedIncome: FixedIncome[] = [], goals: SavingsGoal[] = []) {
  const wb = new ExcelJS.Workbook();

  // Aba Ações
  if (stocks.length > 0) {
    const ws = wb.addWorksheet('Ações');
    ws.columns = [
      { header: 'Ticker', key: 'ticker' }, { header: 'Empresa', key: 'empresa' },
      { header: 'Quantidade', key: 'qty' }, { header: 'Preço Médio (R$)', key: 'avg' },
      { header: 'Cotação Atual (R$)', key: 'price' }, { header: 'Total Investido (R$)', key: 'invested' },
      { header: 'Valor Atual (R$)', key: 'current' }, { header: 'Lucro/Prejuízo (R$)', key: 'pl' },
      { header: 'Lucro/Prejuízo (%)', key: 'plp' },
    ];
    for (const s of stocks) {
      const q = quotes.get(s.ticker);
      const cp = q?.regularMarketPrice ?? 0;
      const inv = s.quantity * s.averagePrice;
      const cur = s.quantity * cp;
      const pl = cur - inv;
      ws.addRow({ ticker: s.ticker, empresa: q?.shortName ?? '—', qty: s.quantity, avg: s.averagePrice, price: cp, invested: inv, current: cur, pl, plp: inv > 0 ? Number(((pl / inv) * 100).toFixed(2)) : 0 });
    }
    styleHeader(ws.getRow(1)); autoFit(ws);
  }

  // Aba Renda Fixa
  if (fixedIncome.length > 0) {
    const ws = wb.addWorksheet('Renda Fixa');
    ws.columns = [
      { header: 'Nome', key: 'name' }, { header: 'Tipo', key: 'type' },
      { header: 'Investido (R$)', key: 'invested' }, { header: 'Valor Atual (R$)', key: 'current' },
      { header: 'Rendimento (R$)', key: 'pl' }, { header: 'Vencimento', key: 'maturity' },
    ];
    for (const fi of fixedIncome) {
      ws.addRow({ name: fi.name, type: fi.type, invested: fi.investedAmount, current: fi.currentAmount, pl: Number((fi.currentAmount - fi.investedAmount).toFixed(2)), maturity: fi.maturityDate ?? '—' });
    }
    styleHeader(ws.getRow(1)); autoFit(ws);
  }

  // Aba Caixinhas
  if (goals.length > 0) {
    const ws = wb.addWorksheet('Caixinhas');
    ws.columns = [
      { header: 'Nome', key: 'name' }, { header: 'Meta (R$)', key: 'target' },
      { header: 'Investido (R$)', key: 'invested' }, { header: 'Valor Atual (R$)', key: 'current' },
      { header: 'Progresso (%)', key: 'progress' },
    ];
    for (const g of goals) {
      ws.addRow({ name: g.name, target: g.targetAmount, invested: g.investedAmount, current: g.currentAmount, progress: g.targetAmount > 0 ? Number(((g.currentAmount / g.targetAmount) * 100).toFixed(1)) : 0 });
    }
    styleHeader(ws.getRow(1)); autoFit(ws);
  }

  await download(wb, `carteira_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportInvoicesToExcel(invoices: Invoice[]) {
  const wb = new ExcelJS.Workbook();

  // Aba 1: Todos os gastos detalhados (principal)
  const ws1 = wb.addWorksheet('Gastos');
  ws1.columns = [
    { header: 'Fatura', key: 'f' },
    { header: 'Mês Referência', key: 'm' },
    { header: 'Categoria', key: 'c' },
    { header: 'Descrição', key: 'desc' },
    { header: 'Valor (R$)', key: 'v' },
    { header: 'Data', key: 'd' },
  ];
  for (const inv of invoices) {
    for (const e of inv.expenses) {
      ws1.addRow({ f: inv.fileName, m: inv.referenceMonth, c: e.category, desc: e.description, v: e.amount, d: e.date ?? '' });
    }
  }
  styleHeader(ws1.getRow(1)); fmtCurrency(ws1, 'v'); autoFit(ws1);

  // Aba 2: Resumo por categoria
  const ws2 = wb.addWorksheet('Por Categoria');
  const catMap = new Map<string, { total: number; count: number }>();
  for (const inv of invoices) {
    for (const e of inv.expenses) {
      const cur = catMap.get(e.category) ?? { total: 0, count: 0 };
      cur.total += e.amount;
      cur.count += 1;
      catMap.set(e.category, cur);
    }
  }
  ws2.columns = [
    { header: 'Categoria', key: 'c' },
    { header: 'Total (R$)', key: 't' },
    { header: 'Qtd Itens', key: 'n' },
    { header: '% do Total', key: 'p' },
  ];
  const grandTotal = Array.from(catMap.values()).reduce((s, v) => s + v.total, 0);
  for (const [c, v] of Array.from(catMap.entries()).sort((a, b) => b[1].total - a[1].total)) {
    ws2.addRow({ c, t: Number(v.total.toFixed(2)), n: v.count, p: grandTotal > 0 ? Number(((v.total / grandTotal) * 100).toFixed(1)) : 0 });
  }
  styleHeader(ws2.getRow(1)); fmtCurrency(ws2, 't'); autoFit(ws2);

  // Aba 3: Resumo por fatura
  const ws3 = wb.addWorksheet('Resumo Faturas');
  ws3.columns = [
    { header: 'Arquivo', key: 'f' },
    { header: 'Mês Referência', key: 'm' },
    { header: 'Total Fatura (R$)', key: 't' },
    { header: 'Total Identificado (R$)', key: 'ti' },
    { header: 'Qtd Itens', key: 'i' },
  ];
  for (const inv of invoices) {
    const expTotal = inv.expenses.reduce((s, e) => s + e.amount, 0);
    ws3.addRow({ f: inv.fileName, m: inv.referenceMonth, t: inv.totalAmount, ti: Number(expTotal.toFixed(2)), i: inv.expenses.length });
  }
  styleHeader(ws3.getRow(1)); fmtCurrency(ws3, 't'); fmtCurrency(ws3, 'ti'); autoFit(ws3);

  await download(wb, `faturas_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function exportSingleInvoiceToExcel(invoice: Invoice) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Gastos');
  ws.columns = [
    { header: 'Data', key: 'd' },
    { header: 'Categoria', key: 'c' },
    { header: 'Descrição', key: 'desc' },
    { header: 'Valor (R$)', key: 'v' },
  ];
  for (const e of invoice.expenses) {
    ws.addRow({ d: e.date ?? '', c: e.category, desc: e.description, v: e.amount });
  }
  // Total row
  const totalRow = ws.addRow({ d: '', c: '', desc: 'TOTAL', v: invoice.totalAmount });
  totalRow.font = { bold: true };

  styleHeader(ws.getRow(1)); fmtCurrency(ws, 'v'); autoFit(ws);

  const safeName = invoice.fileName.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
  await download(wb, `fatura_${safeName}_${invoice.referenceMonth || 'sem-mes'}.xlsx`);
}
