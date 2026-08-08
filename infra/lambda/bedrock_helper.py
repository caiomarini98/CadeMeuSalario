import json
import os
import boto3

bedrock = boto3.client('bedrock-runtime')
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-lite-v1:0')


def categorize_expenses(text):
    """Use Bedrock Nova Lite (messages API) to categorize expenses."""
    prompt = f"""Você é um sistema especialista em análise de faturas de cartão de crédito brasileiras.

########################################
OBJETIVO
########################################

Extrair ABSOLUTAMENTE TODAS as transações da fatura.
A soma dos gastos extraídos DEVE ser igual (ou muito próxima) ao "Total a pagar" da fatura.
Se a soma não bater, você ESTÁ PERDENDO transações.

########################################
O QUE NÃO É TRANSAÇÃO (IGNORAR)
########################################

Ignore APENAS:
- Linhas com "Pagamento efetuado" ou valores negativos (créditos/estornos)
- "Parcelamento de fatura" / "Refinanciamento"
- Juros rotativos, IOF, encargos financeiros, multas
- Linhas de resumo/totais: "Total da fatura", "Total a pagar", "Saldo anterior", "Saldo restante"
- Limites de crédito disponível/total
- Cabeçalhos, rodapés e textos explicativos

QUALQUER OUTRA LINHA COM VALOR POSITIVO É UMA TRANSAÇÃO.

########################################
REGRA #1 — EXTRAIA TUDO
########################################

Se tem valor em reais positivo e não está na lista acima → É TRANSAÇÃO → EXTRAIA.
Não importa se o nome é estranho, abreviado, codificado ou desconhecido.
Exemplos que DEVEM ser extraídos:
- "PAG*JoseDaSilva 150,00" → Outros
- "PGTO COBRANCA 89,00" → Outros (NÃO é pagamento da fatura)
- "MP *MERCADOPAGO 45,00" → Outros ou Compras
- "PIX QR CODE 200,00" → Outros
- "SEGURO PRESTAMISTA 29,90" → Serviços
- "ANUIDADE CARTAO 49,90" → Serviços
- "TARIFA SAQUE 15,00" → Serviços
- Qualquer código/sigla com valor → Outros

########################################
IDENTIFICAÇÃO DE TRANSAÇÕES
########################################

Padrões comuns em faturas brasileiras:
- [DATA] [DESCRIÇÃO] [VALOR]
- [DATA] [DESCRIÇÃO] R$ [VALOR]
- [DESCRIÇÃO] [DATA] [VALOR]
- [DESCRIÇÃO] [VALOR] (sem data explícita)

Valores podem aparecer como: 23,93 / R$ 23,93 / 1.234,56

########################################
NORMALIZAÇÃO
########################################

- "R$ 54,39" → 54.39
- "1.234,56" → 1234.56
- Sempre número decimal com ponto
- Limpar "Parcela X/Y" da descrição mas MANTER a transação
- Transações parceladas: cada parcela que aparece na fatura é uma transação separada

########################################
CATEGORIZAÇÃO
########################################

Categorias válidas (use EXATAMENTE uma):
Mercado | Alimentação (Trabalho) | Alimentação (Lazer) | Transporte | Moradia | Saúde | Educação | Lazer | Assinaturas | Compras | Serviços | Outros

REGRAS DE ALIMENTAÇÃO (MUITO IMPORTANTE):

A antiga categoria "Alimentação" foi dividida em 3. Use EXATAMENTE uma delas:

1. "Mercado" → Compras em supermercados e atacadistas.
   Identifique pelo NOME do estabelecimento. Exemplos:
   Carrefour, Extra, Pão de Açúcar, Assaí, Atacadão, Sam's Club, Makro,
   Big, Nacional, Zaffari, Guanabara, Prezunic, Dia, Mineirão, Savegnago,
   Bretas, Condor, Angeloni, Bistek, Fort, Walmart, Sonda, Hirota, Mambo,
   St Marche, Hortifruti, Oba, Verdemar, Supermercado, Hipermercado.
   Se a descrição contém algum desses nomes → "Mercado"

2. "Alimentação (Trabalho)" → Refeições em dias úteis (segunda a sexta).
   Se a transação tem data, e essa data cai de segunda a sexta,
   E a descrição indica restaurante, lanchonete, padaria, iFood, Uber Eats, Rappi,
   fast food (McDonald's, Burger King, Subway, etc) → "Alimentação (Trabalho)"

3. "Alimentação (Lazer)" → Todas as outras compras de comida/bebida.
   Restaurantes, bares, padarias, delivery em sábado/domingo,
   ou qualquer alimentação que NÃO seja supermercado.
   SE NÃO TIVER CERTEZA se é trabalho ou lazer → use "Alimentação (Lazer)"

IMPORTANTE: Qualquer compra de comida DEVE ir para uma dessas 3 categorias.
NUNCA coloque comida/restaurante/iFood/mercado como "Outros".

Regras das demais categorias:
- Uber/99/Cabify → Transporte
- Airbnb/hotel/booking → Lazer
- Apple/Google/Netflix/Spotify/Disney/HBO → Assinaturas
- Amazon/Mercado Livre/Shopee/Magazine Luiza → Compras
- AWS/OpenAI/telefone/internet → Serviços
- Academia/farmácia/drogaria/médico/hospital → Saúde
- Escola/curso/faculdade → Educação
- Aluguel/condomínio/energia/água/gás → Moradia
- Seguros/anuidades/tarifas/taxas → Serviços
- TUDO que não se encaixar → Outros

NUNCA pule transação por não saber a categoria. Use "Outros".

########################################
FORMATO DE SAÍDA
########################################

JSON válido:

{{
  "expenses": [
    {{
      "category": "...",
      "description": "...",
      "amount": 0.00,
      "date": "DD/MM"
    }}
  ],
  "totalAmount": 0.00,
  "expensesTotal": 0.00,
  "referenceMonth": "YYYY-MM"
}}

- totalAmount: copie o valor EXATO de "Total a pagar" / "Total desta fatura" do documento
- expensesTotal: soma de todos os amounts em expenses
- referenceMonth: mês de referência da fatura (YYYY-MM)
- date: data da transação no formato DD/MM (ex: "05/03"). Se não encontrar a data, use ""

########################################
VALIDAÇÃO FINAL (OBRIGATÓRIO)
########################################

1. Localize "Total a pagar" no texto → use como totalAmount
2. Some TODOS os amounts dos expenses → coloque em expensesTotal
3. Compare: se expensesTotal < totalAmount * 0.95, você PERDEU transações
4. Se perdeu: releia o texto e encontre as transações faltantes
5. Adicione transações faltantes como "Outros" se necessário
6. Repita até expensesTotal >= totalAmount * 0.95

########################################
TEXTO DA FATURA
########################################
{text}
"""

    body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 8192,
        "temperature": 0.1,
        "messages": [
            {
                "role": "user",
                "content": prompt
            }
        ]
    })

    response = bedrock.invoke_model(
        modelId=MODEL_ID,
        contentType='application/json',
        accept='application/json',
        body=body,
    )

    result = json.loads(response['body'].read())
    output_text = result.get('content', [{}])[0].get('text', '{}')

    json_start = output_text.find('{')
    json_end = output_text.rfind('}') + 1
    if json_start >= 0 and json_end > json_start:
        return json.loads(output_text[json_start:json_end])

    return {'expenses': [], 'totalAmount': 0, 'referenceMonth': ''}
