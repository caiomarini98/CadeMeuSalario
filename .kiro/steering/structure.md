# Project Structure

```
.kiro/
  steering/
    product.md             # Visão do produto e funcionalidades
    tech.md                # Stack técnica e comandos
    structure.md           # Este arquivo — organização do projeto

src/
  components/
    Sidebar.tsx            # Navegação lateral (Home, Carteira, Faturas, Config)
    StockTable.tsx         # Tabela de ações com edição inline
    StockSearch.tsx        # Pesquisa de ações com gráfico histórico
    AddStockForm.tsx       # Formulário para adicionar ação
    AddFixedIncomeForm.tsx # Formulário para adicionar renda fixa
    FixedIncomeTable.tsx   # Tabela de renda fixa com edição inline
    PortfolioSummary.tsx   # Resumo geral da carteira (ações + renda fixa)
    PortfolioCharts.tsx    # Gráficos da carteira (evolução + pizza)
    InvoiceCharts.tsx      # Gráficos de faturas (categoria, mensal, tendência)
  pages/
    HomePage.tsx           # Dashboard com resumo e atalhos
    PortfolioPage.tsx      # Gestão da carteira (ações + renda fixa)
    InvoicesPage.tsx       # Upload e análise de faturas
    SettingsPage.tsx       # Configuração do token Brapi
  store/
    usePortfolioStore.ts   # Estado da carteira de ações (Zustand + persist)
    useInvoiceStore.ts     # Estado das faturas (Zustand + persist)
    useFixedIncomeStore.ts # Estado da renda fixa (Zustand + persist)
  services/
    quoteService.ts        # Integração com API Brapi
    invoiceService.ts      # Upload S3 + processamento Textract/Bedrock
    exportService.ts       # Exportação para Excel (exceljs)
  types/
    index.ts               # Tipos TypeScript compartilhados
  App.tsx
  main.tsx
  index.css

infra/
  template.yaml            # SAM template (S3, Lambda, API Gateway)
  lambda/
    get_upload_url.py       # Lambda: gera presigned URL para upload S3
    process_invoice.py      # Lambda: Textract OCR + Bedrock categorização
```
