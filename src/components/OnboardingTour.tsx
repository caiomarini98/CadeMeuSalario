import { useState, useEffect, useCallback } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import type { Page } from './Sidebar';

interface TourStep {
  page?: Page;
  selector?: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom';
}

const STEPS: TourStep[] = [
  {
    title: 'Bem-vindo ao Cadê Meu Salário! 👋',
    description: 'Vamos te mostrar as principais funcionalidades do app em poucos passos. Você pode pular a qualquer momento clicando no X.',
  },
  {
    page: 'portfolio',
    selector: '[data-tour="stock-search"]',
    title: 'Pesquise ações',
    description: 'Digite o ticker da ação (ex: PETR4, VALE3) para ver cotação atual e gráfico histórico. Clique em "Adicionar" para incluir na carteira.',
    position: 'bottom',
  },
  {
    page: 'portfolio',
    selector: '[data-tour="add-stock"]',
    title: 'Adicione à carteira',
    description: 'Informe o ticker, quantidade de cotas e preço médio de compra. O app calcula automaticamente seu lucro/prejuízo com a cotação em tempo real.',
    position: 'bottom',
  },
  {
    page: 'portfolio',
    selector: '[data-tour="portfolio-tabs"]',
    title: 'Ações, Renda Fixa e Caixinhas',
    description: 'Alterne entre suas ações, investimentos em renda fixa e caixinhas de objetivos. Cada aba tem seu próprio formulário de cadastro.',
    position: 'bottom',
  },
  {
    page: 'invoices',
    selector: '[data-tour="invoice-upload"]',
    title: 'Upload de faturas',
    description: 'Arraste ou clique para enviar faturas de cartão (PDF ou foto). A IA extrai os gastos e categoriza automaticamente para você. Os gráficos de análise aparecem após o processamento.',
    position: 'bottom',
  },
];

export function OnboardingTour({ onComplete, onNavigate }: { onComplete: () => void; onNavigate: (p: Page) => void }) {
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const current = STEPS[step];
  const isWelcome = !current.selector;

  const highlight = useCallback(() => {
    if (!current.selector) { setRect(null); return; }
    const el = document.querySelector(current.selector);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => setRect(el.getBoundingClientRect()), 300);
    } else {
      setRect(null);
    }
  }, [current.selector]);

  useEffect(() => {
    if (current.page) onNavigate(current.page);
    const timer = setTimeout(highlight, 400);
    return () => clearTimeout(timer);
  }, [step, current.page, onNavigate, highlight]);

  useEffect(() => {
    window.addEventListener('resize', highlight);
    return () => window.removeEventListener('resize', highlight);
  }, [highlight]);

  const next = () => { if (step < STEPS.length - 1) setStep(step + 1); else onComplete(); };
  const prev = () => { if (step > 0) setStep(step - 1); };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!rect || isWelcome) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    const pad = 16;
    const pos = current.position ?? 'bottom';
    if (pos === 'top') return { top: rect.top - pad, left: Math.min(rect.left + rect.width / 2, window.innerWidth - 200), transform: 'translate(-50%, -100%)' };
    return { top: rect.bottom + pad, left: Math.min(Math.max(rect.left + rect.width / 2, 200), window.innerWidth - 200), transform: 'translateX(-50%)' };
  };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlay */}
      <svg className="absolute inset-0 w-full h-full" onClick={onComplete}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && !isWelcome && (
              <rect x={rect.left - 8} y={rect.top - 8} width={rect.width + 16} height={rect.height + 16} rx="12" fill="black" />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.7)" mask="url(#tour-mask)" />
      </svg>

      {/* Highlight border */}
      {rect && !isWelcome && (
        <div className="absolute border-2 border-[#d4a017] rounded-xl pointer-events-none animate-pulse"
          style={{ top: rect.top - 8, left: rect.left - 8, width: rect.width + 16, height: rect.height + 16 }} />
      )}

      {/* Tooltip */}
      <div className="absolute pointer-events-auto max-w-sm w-[calc(100vw-2rem)]" style={getTooltipStyle()}>
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 shadow-2xl">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              {isWelcome && <Sparkles size={16} className="text-[#d4a017]" />}
              <h3 className="text-[#f0ece4] text-sm font-bold">{current.title}</h3>
            </div>
            <button onClick={onComplete} className="text-[#8a8580] hover:text-white cursor-pointer ml-2 flex-shrink-0">
              <X size={14} />
            </button>
          </div>
          <p className="text-[#a0998a] text-sm leading-relaxed mb-4">{current.description}</p>

          <div className="flex items-center justify-between">
            <span className="text-[#8a8580] text-sm">{step + 1} / {STEPS.length}</span>
            <div className="flex items-center gap-2">
              {step > 0 && (
                <button onClick={prev} className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#a0998a] hover:text-white border border-[#2a2a2a] rounded-lg cursor-pointer">
                  <ChevronLeft size={12} />Voltar
                </button>
              )}
              <button onClick={next}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium bg-[#d4a017] text-[#1a1a1a] rounded-lg hover:bg-[#e0b020] cursor-pointer">
                {step === STEPS.length - 1 ? 'Começar!' : 'Próximo'}<ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
