# Tech Stack

## Frontend

- React 18+ com TypeScript
- Vite como bundler/dev server
- Tailwind CSS para estilização
- Zustand para gerenciamento de estado (leve e simples)

## Backend

- AWS Lambda (Python 3.12) para processamento de faturas
- Amazon Textract (DetectDocumentText) para OCR de faturas
- Amazon Bedrock (Claude Sonnet 4.5 — us.anthropic.claude-sonnet-4-5-20250929-v1:0) para categorização de gastos
- Amazon S3 para armazenamento temporário de uploads (TTL 30 dias)
- Amazon API Gateway (HTTP API) como endpoint REST
- Infraestrutura gerenciada via AWS SAM (infra/template.yaml)
- Stack: `kdmeusalario` na região `us-east-1`
- API URL: configurada em `src/services/invoiceService.ts`
- Profile AWS SSO: `AWSAdministratorAccess-101134489565`
- Dados da carteira persistidos no localStorage do navegador
- Cotações buscadas diretamente da API pública Brapi (https://brapi.dev)

## Build & Run Commands

- `npm install` — instalar dependências
- `npm run dev` — rodar em modo desenvolvimento
- `npm run build` — gerar build de produção
- `npm run preview` — preview do build de produção
- `sam build --template-file infra/template.yaml --build-dir infra/.aws-sam/build` — build da infra
- `sam deploy --template-file infra/.aws-sam/build/template.yaml --stack-name kdmeusalario --capabilities CAPABILITY_IAM --resolve-s3 --profile AWSAdministratorAccess-101134489565 --region us-east-1` — deploy da infra

## Libraries & Frameworks

- react, react-dom
- typescript
- vite
- tailwindcss
- zustand
- lucide-react (ícones)

## Development Notes

- Sem autenticação por enquanto (uso pessoal / single-user)
- Dados ficam no localStorage — simples e sem custo de infra
- A Brapi tem limite de requisições no plano gratuito; usar polling moderado (ex: a cada 5 min)

## Segurança — Diretrizes Obrigatórias

**Severidade: ALTA — Este app lida diretamente com finanças. Vulnerabilidades de segurança são inaceitáveis.**

### Bibliotecas banidas

- **`xlsx` (SheetJS)** — NÃO USAR. Possui vulnerabilidades conhecidas sem correção disponível:
  - Prototype Pollution: https://github.com/advisories/GHSA-4r6h-8v6p-xvw6
  - ReDoS (Regular Expression Denial of Service): https://github.com/advisories/GHSA-5pgg-2g8v-p4x9
- Alternativa aprovada: **`exceljs`** — ativamente mantida, sem vulnerabilidades conhecidas.

### Regras gerais

- Antes de adicionar qualquer dependência, verificar `npm audit` — zero vulnerabilidades high/critical é obrigatório.
- Nunca ignorar alertas de segurança com `npm audit fix --force` sem análise.
- Dados financeiros devem ser tratados com cuidado: sanitizar inputs, validar valores numéricos, evitar eval/innerHTML.
- Revisar dependências periodicamente — libs abandonadas ou com CVEs abertos devem ser substituídas imediatamente.
