import { ArrowLeft } from 'lucide-react';

export function PrivacyPolicy({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f0ece4] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-[#d4a017] hover:text-[#f0ece4] mb-8 cursor-pointer text-sm">
          <ArrowLeft size={16} />Voltar
        </button>

        <h1 className="text-3xl font-bold mb-2">Politica de Privacidade</h1>
        <p className="text-[#8a8580] text-sm mb-8">Ultima atualizacao: agosto de 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-[#a0998a] text-sm leading-relaxed">
          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">1. Informacoes gerais</h2>
            <p>A presente Politica de Privacidade descreve como o Cade Meu Salario ("nos", "nosso" ou "Plataforma") coleta, utiliza, armazena e protege os dados pessoais dos usuarios ("voce"), em conformidade com a Lei Geral de Protecao de Dados Pessoais (Lei 13.709/2018 - LGPD).</p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">2. Dados coletados</h2>
            <p>Coletamos os seguintes dados:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong className="text-[#f0ece4]">Dados de cadastro:</strong> nome e endereco de e-mail (fornecidos no registro ou via login com Google)</li>
              <li><strong className="text-[#f0ece4]">Dados financeiros enviados por voce:</strong> faturas de cartao de credito (PDF ou imagem) para processamento automatizado</li>
              <li><strong className="text-[#f0ece4]">Dados de carteira:</strong> informacoes de acoes e renda fixa que voce cadastra voluntariamente</li>
              <li><strong className="text-[#f0ece4]">Dados de uso:</strong> informacoes tecnicas como horarios de acesso e funcionalidades utilizadas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">3. Como utilizamos seus dados</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Processar faturas enviadas por voce, extraindo texto e categorizando gastos via inteligencia artificial</li>
              <li>Exibir graficos e relatorios personalizados de gastos</li>
              <li>Buscar cotacoes de acoes em tempo real</li>
              <li>Autenticar seu acesso a plataforma</li>
              <li>Enviar comunicacoes relacionadas ao servico (alertas de limite, atualizacoes)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">4. Processamento por inteligencia artificial</h2>
            <p>Suas faturas sao processadas por servicos de IA (Amazon Bedrock/Claude e Amazon Textract) para extrair e categorizar transacoes. O conteudo das faturas e utilizado exclusivamente para gerar o resultado de categorizacao e nao e armazenado permanentemente nos servicos de IA. Os resultados categorizados sao armazenados em nosso banco de dados vinculados a sua conta.</p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">5. Armazenamento e seguranca</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Seus dados sao armazenados em servidores da Amazon Web Services (AWS) na regiao us-east-1, com criptografia em repouso (AES-256)</li>
              <li>Arquivos de fatura enviados sao automaticamente excluidos apos 30 dias</li>
              <li>A autenticacao e gerenciada pelo Amazon Cognito com tokens JWT</li>
              <li>Senhas sao armazenadas com hash seguro (nunca em texto puro)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">6. Compartilhamento de dados</h2>
            <p>Nao vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Seus dados podem ser compartilhados apenas com:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Provedores de infraestrutura (AWS) para operacao do servico</li>
              <li>Autoridades competentes quando exigido por lei</li>
            </ul>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">7. Seus direitos (LGPD)</h2>
            <p>Voce tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Confirmar a existencia de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a exclusao de seus dados pessoais</li>
              <li>Revogar o consentimento a qualquer momento</li>
              <li>Solicitar portabilidade dos dados</li>
            </ul>
            <p className="mt-2">Para exercer seus direitos, entre em contato pelo e-mail: <span className="text-[#d4a017]">contato@cademeusalario.com.br</span></p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">8. Cookies e armazenamento local</h2>
            <p>Utilizamos localStorage do navegador para persistir dados da sua carteira e preferencias localmente. Nao utilizamos cookies de rastreamento de terceiros.</p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">9. Alteracoes nesta politica</h2>
            <p>Podemos atualizar esta Politica de Privacidade periodicamente. Alteracoes significativas serao comunicadas por meio da plataforma. O uso continuado apos as alteracoes constitui aceite da nova versao.</p>
          </section>

          <section>
            <h2 className="text-[#f0ece4] text-lg font-semibold mb-2">10. Contato</h2>
            <p>Para duvidas sobre esta politica ou sobre o tratamento dos seus dados pessoais:</p>
            <p className="mt-2">E-mail: <span className="text-[#d4a017]">contato@cademeusalario.com.br</span></p>
          </section>
        </div>
      </div>
    </div>
  );
}
