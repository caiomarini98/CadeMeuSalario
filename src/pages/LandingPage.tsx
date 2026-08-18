import { useAuth } from '../components/AuthProvider';
import { Receipt, Brain, TrendingUp, Shield, Zap, BarChart3, ArrowRight, CheckCircle } from 'lucide-react';

export function LandingPage() {
  const { enterDemo } = useAuth();

  const scrollToLogin = () => {
    window.location.href = '/app';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0ece4]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-[#2a2a2a]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="flex items-center gap-3 cursor-pointer">
            <img src="/logo.png" alt="Cadê Meu Salário" className="w-8 h-8 rounded-lg" />
            <span className="text-lg font-bold">Cadê Meu Salário</span>
          </a>
          <div className="flex items-center gap-3">
            <button onClick={enterDemo}
              className="text-sm text-[#a0998a] hover:text-[#f0ece4] transition-colors cursor-pointer">
              Ver Demo
            </button>
            <button onClick={scrollToLogin}
              className="text-sm bg-[#d4a017] hover:bg-[#b8890f] text-[#1a1a1a] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer">
              Entrar
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Descubra pra onde vai<br />
            <span className="text-[#d4a017]">seu dinheiro</span> em segundos
          </h1>
          <p className="text-lg sm:text-xl text-[#a0998a] max-w-2xl mx-auto mb-10">
            Envie a fatura do seu cartão e nossa IA categoriza todos os gastos automaticamente. 
            Sem digitar nada. Sem planilha. Sem perder tempo.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={enterDemo}
              className="flex items-center gap-2 bg-[#d4a017] hover:bg-[#b8890f] text-[#1a1a1a] font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-[0_8px_24px_rgba(212,160,23,0.3)] cursor-pointer">
              Testar Gratis <ArrowRight size={20} />
            </button>
            <button onClick={scrollToLogin}
              className="flex items-center gap-2 border border-[#2a2a2a] hover:border-[#d4a017]/50 text-[#a0998a] hover:text-[#f0ece4] font-medium px-8 py-4 rounded-xl text-lg transition-all cursor-pointer">
              Criar conta
            </button>
          </div>
          <p className="text-[#8a8580] text-sm mt-4">Sem cartao de credito. Explore com dados fictícios.</p>
        </div>
      </section>

      {/* Social proof bar */}
      <section className="border-y border-[#2a2a2a] py-8 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-center">
          <div>
            <p className="text-2xl font-bold text-[#d4a017]">30s</p>
            <p className="text-sm text-[#8a8580]">para categorizar</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#d4a017]">12+</p>
            <p className="text-sm text-[#8a8580]">categorias automaticas</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#d4a017]">80%</p>
            <p className="text-sm text-[#8a8580]">menor custo vs OCR puro</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#d4a017]">PDF/Foto</p>
            <p className="text-sm text-[#8a8580]">qualquer formato</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">Tudo que voce precisa para controlar seus gastos</h2>
          <p className="text-[#a0998a] text-center text-lg mb-16 max-w-2xl mx-auto">
            De upload a insight em segundos. Sem complicacao.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={<Brain size={24} />} title="IA que entende sua fatura"
              description="Claude Sonnet analisa cada linha e categoriza automaticamente: mercado, transporte, assinaturas, lazer..." />
            <FeatureCard icon={<Zap size={24} />} title="Upload e pronto"
              description="Arraste o PDF ou tire foto da fatura. Em 30 segundos voce tem o resultado completo." />
            <FeatureCard icon={<BarChart3 size={24} />} title="Graficos e tendencias"
              description="Veja pra onde vai seu dinheiro mes a mes. Identifique padroes e corte gastos desnecessarios." />
            <FeatureCard icon={<Shield size={24} />} title="Alertas de gastos"
              description="Defina limites por categoria. Receba alerta visual quando estiver perto de estourar." />
            <FeatureCard icon={<TrendingUp size={24} />} title="Carteira de investimentos"
              description="Acompanhe acoes e renda fixa. Cotacoes em tempo real. Evolucao do patrimonio." />
            <FeatureCard icon={<Receipt size={24} />} title="Multi-cartao"
              description="Processe faturas de qualquer banco. Nubank, Santander, Inter, Itau — todos funcionam." />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-[#141414]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">Como funciona</h2>

          <div className="space-y-12">
            <Step number="1" title="Envie sua fatura"
              description="Arraste o PDF do seu banco ou tire uma foto. Aceita qualquer formato de fatura brasileira." />
            <Step number="2" title="IA categoriza tudo"
              description="Nossa inteligencia artificial le cada transacao e classifica em categorias como Mercado, Transporte, Assinaturas, Lazer e mais." />
            <Step number="3" title="Visualize seus gastos"
              description="Graficos interativos mostram pra onde vai seu dinheiro. Compare meses, identifique tendencias, defina alertas." />
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simples e acessivel</h2>
          <p className="text-[#a0998a] text-lg mb-12">Comece gratis. Upgrade quando precisar.</p>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8 text-left">
              <p className="text-[#8a8580] text-sm font-semibold uppercase tracking-wider mb-2">Gratuito</p>
              <p className="text-3xl font-bold mb-1">R$0</p>
              <p className="text-[#8a8580] text-sm mb-6">para sempre</p>
              <ul className="space-y-3">
                <PricingItem text="1 fatura por mes" />
                <PricingItem text="Categorização com IA" />
                <PricingItem text="Graficos basicos" />
                <PricingItem text="Carteira de investimentos" />
              </ul>
              <button onClick={enterDemo}
                className="w-full mt-8 py-3 border border-[#2a2a2a] hover:border-[#d4a017] rounded-xl text-[#a0998a] hover:text-[#d4a017] font-medium transition-all cursor-pointer">
                Comecar gratis
              </button>
            </div>

            <div className="bg-[#141414] border border-[#d4a017]/30 rounded-2xl p-8 text-left relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#d4a017] text-[#1a1a1a] text-xs font-bold px-3 py-1 rounded-full uppercase">
                Em breve
              </div>
              <p className="text-[#d4a017] text-sm font-semibold uppercase tracking-wider mb-2">Premium</p>
              <p className="text-3xl font-bold mb-1">R$14<span className="text-lg">,90</span></p>
              <p className="text-[#8a8580] text-sm mb-6">por mes</p>
              <ul className="space-y-3">
                <PricingItem text="5 faturas por mes" />
                <PricingItem text="Alertas por categoria" />
                <PricingItem text="Relatorio compartilhavel" />
                <PricingItem text="Exportar Excel" />
                <PricingItem text="Historico completo" />
              </ul>
              <button disabled
                className="w-full mt-8 py-3 bg-[#d4a017]/20 text-[#d4a017] rounded-xl font-medium cursor-not-allowed">
                Em breve
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-[#141414]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Pare de adivinhar. Comece a entender.</h2>
          <p className="text-[#a0998a] text-lg mb-8">Sua fatura tem a resposta. Nossa IA descobre pra voce.</p>
          <button onClick={enterDemo}
            className="inline-flex items-center gap-2 bg-[#d4a017] hover:bg-[#b8890f] text-[#1a1a1a] font-semibold px-8 py-4 rounded-xl text-lg transition-all hover:shadow-[0_8px_24px_rgba(212,160,23,0.3)] cursor-pointer">
            Explorar o app <ArrowRight size={20} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="w-6 h-6 rounded" />
            <span className="text-sm text-[#8a8580]">Cade Meu Salario — cademeusalario.com.br</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 hover:border-[#d4a017]/20 transition-all">
      <div className="w-12 h-12 rounded-xl bg-[rgba(212,160,23,0.1)] flex items-center justify-center text-[#d4a017] mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-[#a0998a] text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="flex gap-6 items-start">
      <div className="w-12 h-12 rounded-full bg-[#d4a017] text-[#1a1a1a] flex items-center justify-center text-xl font-bold flex-shrink-0">
        {number}
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-[#a0998a] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function PricingItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-2 text-sm text-[#a0998a]">
      <CheckCircle size={16} className="text-[#2d9d4e] flex-shrink-0" />
      {text}
    </li>
  );
}
