import { useState } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { redirectToCheckout, type PlanId } from '../services/billingService';

export function Paywall({ userName }: { userName?: string }) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (plan: PlanId) => {
    setLoading(plan);
    try {
      await redirectToCheckout(plan);
    } catch {
      setLoading(null);
      alert('Erro ao iniciar pagamento. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-6 py-12">
      <div className="max-w-2xl w-full text-center">
        <img src="/logo.png" alt="Cadê Meu Salário" className="w-14 h-14 rounded-xl mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#f0ece4] mb-2">
          {userName ? `Olá, ${userName}!` : 'Bem-vindo!'}
        </h1>
        <p className="text-[#a0998a] mb-8">Escolha seu plano para começar. Teste grátis por 7 dias — cancele quando quiser.</p>

        <div className="grid sm:grid-cols-2 gap-6 text-left">
          {/* Essencial */}
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6">
            <p className="text-[#8a8580] text-sm font-semibold uppercase tracking-wider mb-2">Essencial</p>
            <p className="text-3xl font-bold text-[#f0ece4] mb-1">R$9<span className="text-lg">,90</span></p>
            <p className="text-[#8a8580] text-sm mb-5">por mês após o trial</p>
            <ul className="space-y-2 mb-6">
              <Item text="5 faturas por mês" />
              <Item text="Categorização com IA" />
              <Item text="Gráficos e alertas" />
              <Item text="Exportar Excel" />
            </ul>
            <button onClick={() => handleCheckout('essencial_monthly')} disabled={!!loading}
              className="w-full py-3 border border-[#2a2a2a] hover:border-[#d4a017] rounded-xl text-[#a0998a] hover:text-[#d4a017] font-medium transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
              {loading === 'essencial_monthly' ? <Loader2 size={16} className="animate-spin" /> : 'Começar 7 dias grátis'}
            </button>
            <p className="text-[#8a8580] text-xs text-center mt-2">ou R$89,90/ano (25% off)</p>
          </div>

          {/* Pro */}
          <div className="bg-[#141414] border border-[#d4a017]/30 rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d4a017] text-[#1a1a1a] text-xs font-bold px-3 py-1 rounded-full uppercase">
              Mais popular
            </div>
            <p className="text-[#d4a017] text-sm font-semibold uppercase tracking-wider mb-2">Pro</p>
            <p className="text-3xl font-bold text-[#f0ece4] mb-1">R$19<span className="text-lg">,90</span></p>
            <p className="text-[#8a8580] text-sm mb-5">por mês após o trial</p>
            <ul className="space-y-2 mb-6">
              <Item text="Faturas ilimitadas" />
              <Item text="Tudo do Essencial" />
              <Item text="Alertas ilimitados" />
              <Item text="Relatório compartilhável" />
              <Item text="Suporte prioritário" />
            </ul>
            <button onClick={() => handleCheckout('pro_monthly')} disabled={!!loading}
              className="w-full py-3 bg-[#d4a017] hover:bg-[#b8890f] text-[#1a1a1a] rounded-xl font-semibold transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2">
              {loading === 'pro_monthly' ? <Loader2 size={16} className="animate-spin" /> : 'Começar 7 dias grátis'}
            </button>
            <p className="text-[#8a8580] text-xs text-center mt-2">ou R$179,90/ano (25% off)</p>
          </div>
        </div>

        <p className="text-[#8a8580] text-xs mt-6">Sem compromisso. Cancele a qualquer momento antes dos 7 dias e não será cobrado.</p>
      </div>
    </div>
  );
}

function Item({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-[#a0998a]">
      <CheckCircle size={14} className="text-[#2d9d4e] flex-shrink-0" />
      {text}
    </li>
  );
}
