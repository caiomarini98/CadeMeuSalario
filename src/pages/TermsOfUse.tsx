import { ArrowLeft } from 'lucide-react';

export function TermsOfUse({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0ece4] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-[#d4a017] hover:text-[#f0ece4] mb-8 cursor-pointer text-sm">
          <ArrowLeft size={16} />Voltar
        </button>

        <h1 className="text-3xl font-bold mb-2">Termos e Condicoes de Uso</h1>
        <p className="text-[#8a8580] text-sm mb-8">Ultima atualizacao: agosto de 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-[#a0998a] text-sm leading-relaxed">
          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">1. Aceitacao dos termos</h2>
            <p>Ao acessar ou utilizar a plataforma Cade Meu Salario ("Plataforma"), voce concorda integralmente com estes Termos e Condicoes de Uso. Caso nao concorde, nao utilize a Plataforma.</p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">2. Descricao do servico</h2>
            <p>O Cade Meu Salario e uma plataforma de gestao financeira pessoal que oferece:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Analise automatizada de faturas de cartao de credito via inteligencia artificial</li>
              <li>Acompanhamento de carteira de investimentos (acoes e renda fixa)</li>
              <li>Graficos e relatorios de gastos por categoria</li>
              <li>Alertas de limites de gastos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">3. Nao constitui consultoria financeira</h2>
            <p>A Plataforma e uma ferramenta de organizacao e visualizacao de dados financeiros pessoais. As informacoes apresentadas (cotacoes, categorizacoes, simulacoes) tem carater exclusivamente informativo e NAO constituem recomendacao de investimento, consultoria financeira, contabil ou tributaria. Decisoes financeiras sao de inteira responsabilidade do usuario.</p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">4. Cadastro e conta</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Voce e responsavel por manter a confidencialidade de suas credenciais de acesso</li>
              <li>As informacoes fornecidas no cadastro devem ser verdadeiras e atualizadas</li>
              <li>Cada pessoa pode manter apenas uma conta na Plataforma</li>
              <li>Reservamo-nos o direito de suspender contas que violem estes termos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">5. Planos e limites de uso</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong className="text-[#f0ece4]">Plano Gratuito:</strong> 1 fatura por mes, funcionalidades basicas</li>
              <li><strong className="text-[#f0ece4]">Plano Premium:</strong> maior volume de faturas, funcionalidades avancadas como exportacao e alertas</li>
            </ul>
            <p className="mt-2">Os limites e precos podem ser alterados com aviso previo de 30 dias. Usuarios existentes manterao suas condicoes ate o proximo ciclo de renovacao.</p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">6. Uso aceitavel</h2>
            <p>Voce concorda em NAO utilizar a Plataforma para:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Atividades ilegais, incluindo lavagem de dinheiro ou fraude</li>
              <li>Upload de documentos que nao sejam faturas proprias</li>
              <li>Tentar acessar dados de outros usuarios</li>
              <li>Sobrecarregar intencionalmente os servidores (ataques DDoS, scraping)</li>
              <li>Revender ou redistribuir o servico sem autorizacao</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">7. Propriedade intelectual</h2>
            <p>Todo o conteudo da Plataforma (codigo, design, marca, textos) e de propriedade do Cade Meu Salario ou de seus licenciadores. Os dados financeiros que voce envia permanecem de sua propriedade.</p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">8. Limitacao de responsabilidade</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>A Plataforma e fornecida "como esta", sem garantias de disponibilidade ininterrupta</li>
              <li>Nao nos responsabilizamos por decisoes financeiras tomadas com base nas informacoes exibidas</li>
              <li>Nao garantimos 100% de precisao na categorizacao automatica de gastos</li>
              <li>Nao somos responsaveis por perdas decorrentes de indisponibilidade temporaria do servico</li>
              <li>Cotacoes de acoes sao fornecidas por terceiros (Brapi) e podem ter atraso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">9. Exclusao de conta e dados</h2>
            <p>Voce pode solicitar a exclusao da sua conta e de todos os dados associados a qualquer momento pelo e-mail <span className="text-[#d4a017]">contato@cademeusalario.com.br</span>. Apos a solicitacao, seus dados serao permanentemente excluidos em ate 30 dias.</p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">10. Alteracoes nos termos</h2>
            <p>Reservamo-nos o direito de alterar estes Termos a qualquer momento. Alteracoes significativas serao comunicadas com antecedencia de 30 dias por meio da plataforma ou e-mail. O uso continuado apos as alteracoes constitui aceite dos novos termos.</p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">11. Foro</h2>
            <p>Estes Termos sao regidos pela legislacao brasileira. Fica eleito o foro da Comarca de Sao Paulo/SP para dirimir quaisquer controversias.</p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">12. Contato</h2>
            <p>Para duvidas sobre estes Termos:</p>
            <p className="mt-2">E-mail: <span className="text-[#d4a017]">contato@cademeusalario.com.br</span></p>
          </section>
        </div>
      </div>
    </div>
  );
}
