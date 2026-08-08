import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { usePortfolioStore } from '../store/usePortfolioStore';
import { useFixedIncomeStore } from '../store/useFixedIncomeStore';
import { useGoalsStore } from '../store/useGoalsStore';
import { sendAdvisorMessage } from '../services/advisorService';
import type { ChatMessage } from '../types';

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function buildPortfolioContext(
  stocks: { ticker: string; quantity: number; averagePrice: number }[],
  quotes: Map<string, { regularMarketPrice: number; regularMarketChange: number; regularMarketChangePercent: number; shortName: string }>,
  fiItems: { name: string; type: string; investedAmount: number; currentAmount: number; rate: string }[],
  goals: { name: string; targetAmount: number; currentAmount: number }[]
): string {
  const lines: string[] = [];

  if (stocks.length > 0) {
    lines.push('AÇÕES NA CARTEIRA:');
    let totalInvested = 0, totalCurrent = 0;
    for (const s of stocks) {
      const q = quotes.get(s.ticker);
      const inv = s.quantity * s.averagePrice;
      const cur = q ? s.quantity * q.regularMarketPrice : inv;
      const pl = cur - inv;
      totalInvested += inv; totalCurrent += cur;
      lines.push(`- ${s.ticker} (${q?.shortName ?? ''}): ${s.quantity} cotas, PM ${fmt(s.averagePrice)}, Atual ${q ? fmt(q.regularMarketPrice) : 'N/A'}, Variação hoje: ${q ? `${q.regularMarketChangePercent.toFixed(2)}%` : 'N/A'}, L/P: ${fmt(pl)}`);
    }
    lines.push(`Total investido em ações: ${fmt(totalInvested)}, Valor atual: ${fmt(totalCurrent)}, Resultado: ${fmt(totalCurrent - totalInvested)}`);
  }

  if (fiItems.length > 0) {
    lines.push('\nRENDA FIXA:');
    for (const fi of fiItems) {
      lines.push(`- ${fi.name} (${fi.type}): Investido ${fmt(fi.investedAmount)}, Atual ${fmt(fi.currentAmount)}, Taxa: ${fi.rate}`);
    }
  }

  if (goals.length > 0) {
    lines.push('\nOBJETIVOS/CAIXINHAS:');
    for (const g of goals) {
      const pct = g.targetAmount > 0 ? ((g.currentAmount / g.targetAmount) * 100).toFixed(0) : '0';
      lines.push(`- ${g.name}: ${fmt(g.currentAmount)} de ${fmt(g.targetAmount)} (${pct}%)`);
    }
  }

  return lines.length > 0 ? lines.join('\n') : 'Carteira vazia — nenhum ativo cadastrado.';
}

const QUICK_PROMPTS = [
  'Como está minha carteira?',
  'Tenho R$ 1.000 pra investir, o que fazer?',
  'Quais ações estão em alta hoje?',
  'Devo aumentar minha reserva de emergência?',
];

export function AdvisorChat() {
  const { stocks, quotes } = usePortfolioStore();
  const fiItems = useFixedIncomeStore((s) => s.items);
  const goals = useGoalsStore((s) => s.goals);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: msg, timestamp: new Date().toISOString() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const context = buildPortfolioContext(stocks, quotes, fiItems, goals);
      const reply = await sendAdvisorMessage(msg, context, newMessages);
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: reply, timestamp: new Date().toISOString() }]);
    } catch {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: 'Desculpe, ocorreu um erro. Tente novamente.', timestamp: new Date().toISOString() }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl overflow-hidden flex flex-col" style={{ height: '520px' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#2a2a2a] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#d4a017] to-[#f0c940] flex items-center justify-center">
          <Sparkles size={16} className="text-[#1a1a1a]" />
        </div>
        <div>
          <h3 className="text-[#f0ece4] text-sm font-semibold">FinBot</h3>
          <p className="text-[#8a8580] text-sm">Seu analista de investimentos pessoal</p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles size={28} className="text-[#d4a017] mx-auto mb-3" />
            <p className="text-[#a0998a] text-sm mb-1">Olá! Sou o FinBot 👋</p>
            <p className="text-[#8a8580] text-sm mb-6">Posso analisar sua carteira, explicar movimentos do mercado e recomendar investimentos.</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {QUICK_PROMPTS.map((p) => (
                <button key={p} onClick={() => send(p)}
                  className="px-3 py-2 rounded-xl text-sm font-medium border border-[#2a2a2a] text-[#a0998a] hover:border-[#d4a017] hover:text-[#d4a017] hover:bg-[rgba(212,160,23,0.05)] transition-all cursor-pointer">
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#d4a017] to-[#f0c940] flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot size={14} className="text-[#1a1a1a]" />
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[#d4a017] text-[#1a1a1a] rounded-br-md'
                : 'bg-[#1a1a1a] text-[#f0ece4] rounded-bl-md border border-[#2a2a2a]'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-[#2a2a2a] flex items-center justify-center flex-shrink-0 mt-0.5">
                <User size={14} className="text-[#a0998a]" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#d4a017] to-[#f0c940] flex items-center justify-center flex-shrink-0">
              <Bot size={14} className="text-[#1a1a1a]" />
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 size={16} className="animate-spin text-[#d4a017]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#2a2a2a]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Pergunte sobre sua carteira..."
            disabled={loading}
            className="flex-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-4 py-2.5 text-[#f0ece4] text-sm placeholder:text-[#8a8580] focus:outline-none focus:border-[#d4a017] disabled:opacity-50"
          />
          <button onClick={() => send()} disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-[#d4a017] hover:bg-[#b8890f] flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
            <Send size={16} className="text-[#1a1a1a]" />
          </button>
        </div>
      </div>
    </div>
  );
}
