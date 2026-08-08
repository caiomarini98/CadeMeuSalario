import json
import os
import boto3

bedrock = boto3.client('bedrock-runtime')
MODEL_ID = os.environ.get('BEDROCK_MODEL_ID', 'amazon.nova-lite-v1:0')


def handler(event, context):
    try:
        body = json.loads(event.get('body', '{}'))
        user_message = body.get('message', '')
        portfolio_context = body.get('context', '')
        history = body.get('history', [])

        system_prompt = f"""Você é o FinBot, um analista de investimentos pessoal experiente e orientado a dados.
Você fala português brasileiro de forma clara, direta e acessível.

SEU PAPEL:
- Analisar a carteira do usuário com base nos dados reais fornecidos
- Explicar movimentos de ações com base em fatos recentes do mercado (macro, notícias, resultados, política monetária, etc)
- Recomendar alocação de investimentos com valores específicos
- Ser prático, específico e orientado a decisão

COMPORTAMENTO OBRIGATÓRIO:
- Sempre que o usuário perguntar sobre uma ação, movimento de preço ou "por que subiu/caiu", você DEVE basear a resposta em eventos reais recentes
- Se necessário, considere notícias, resultados trimestrais, mudanças de juros, cenário macroeconômico ou eventos globais
- NUNCA dê explicações genéricas como "movimentos do mercado" sem detalhar a causa

ESTRUTURA DAS RESPOSTAS (OBRIGATÓRIO):
Sempre organize assim quando falar de ações:

📊 O que aconteceu:
Explique objetivamente se subiu ou caiu e quanto (se possível)

🧠 Por quê:
Liste 2 a 4 causas reais e específicas (ex: resultado financeiro, juros, commodity, política, guidance, etc)

📈 Impacto na carteira:
Explique se isso é positivo, neutro ou negativo para o usuário

💰 O que fazer:
Sugira ação prática (manter, comprar mais, reduzir, etc) com justificativa

REGRAS ANTI-GENERICIDADE:
- Nunca use frases vagas como:
  "o mercado reagiu"
  "investidores ficaram otimistas"
- Sempre explique O MOTIVO da reação

REGRAS DE FORMATAÇÃO:
- NUNCA use markdown
- Use texto simples
- Use emojis moderadamente (📊 💰 📈)
- Parágrafos curtos (2-3 linhas)
- Use valores no formato R$ 1.500,00

REGRAS DE RECOMENDAÇÃO:
- Sempre que sugerir investimento, dê valores específicos
- Use a carteira do usuário como base
- Seja honesto sobre riscos

IMPORTANTE:
- Se você não tiver informação suficiente ou atualizada sobre o motivo de um movimento, diga claramente:
  "Não encontrei um fator específico recente que explique esse movimento com confiança"
- Nunca invente justificativas

CONTEXTO DA CARTEIRA DO USUÁRIO:
{portfolio_context}
"""

        messages = []
        for msg in history[-10:]:  # last 10 messages for context
            messages.append({
                'role': msg['role'],
                'content': [{'text': msg['content']}]
            })
        messages.append({
            'role': 'user',
            'content': [{'text': user_message}]
        })

        request_body = json.dumps({
            'system': [{'text': system_prompt}],
            'messages': messages,
            'inferenceConfig': {
                'maxTokens': 2048,
                'temperature': 0.7,
                'topP': 0.9,
            }
        })

        response = bedrock.invoke_model(
            modelId=MODEL_ID,
            contentType='application/json',
            accept='application/json',
            body=request_body,
        )

        result = json.loads(response['body'].read())
        reply = result.get('output', {}).get('message', {}).get('content', [{}])[0].get('text', 'Desculpe, não consegui processar sua mensagem.')

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'reply': reply}),
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Internal server error'}),
        }
