# Product Overview

## O que é

KDMeuSalario — MicroSaaS de finanças pessoais com carteira de ações, análise de faturas e acompanhamento visual de gastos.

## Para quem

Investidores individuais que querem acompanhar carteira, cotações e entender seus gastos de forma simples e visual.

## Páginas

### Home
- Dashboard com resumo: ações na carteira, patrimônio, resultado, total em faturas
- Atalhos para Carteira e Faturas

### Carteira
- Pesquisa de ações com gráfico histórico e seletor de período (1S, 1M, 3M, 6M, 1A)
- Adicionar/editar/remover ações (ticker, quantidade, preço médio)
- Tabela com cotação atual, total investido, valor atual, lucro/prejuízo
- Resumo geral: total investido, valor atual, resultado
- Gráficos: evolução da carteira (com seletor 1S a 5A) e distribuição (pizza)
- Exportar carteira para Excel

### Faturas
- Upload de faturas (drag & drop ou seleção de arquivo)
- Processamento automático: extração de texto (Textract) + categorização (Bedrock)
- Tabela de faturas com status de processamento
- Gráficos: gastos por categoria (pizza), total por mês (barras), tendência por categoria (linhas), detalhe por fatura (barras horizontais)
- Download de gráficos como PNG
- Exportar faturas para Excel (resumo, detalhamento, por categoria)
- Backend AWS (Textract + Bedrock) planejado; frontend usa dados simulados por enquanto

### Configurações
- Token da API Brapi

## API de cotações

Brapi (https://brapi.dev) — requer token para ações além de PETR4, MGLU3, VALE3, ITUB4.

## Persistência

localStorage via Zustand persist (stocks, invoices).
