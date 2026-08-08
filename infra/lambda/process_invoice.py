import json
import os
import boto3
from bedrock_helper import categorize_expenses
from rate_limit import get_user_id, get_user_role, check_rate_limit, increment_usage

s3 = boto3.client('s3')
textract = boto3.client('textract')

BUCKET = os.environ['BUCKET_NAME']


def extract_text_sync(bucket, key):
    """Textract sync — JPEG/PNG only."""
    response = textract.detect_document_text(
        Document={'S3Object': {'Bucket': bucket, 'Name': key}}
    )
    lines = []
    for block in response.get('Blocks', []):
        if block['BlockType'] == 'LINE':
            lines.append(block.get('Text', ''))
    return '\n'.join(lines)


def handler(event, context):
    try:
        user_id = get_user_id(event)
        if not user_id:
            return {'statusCode': 401, 'body': json.dumps({'error': 'Unauthorized'})}

        role = get_user_role(event)
        allowed, remaining, limit = check_rate_limit(user_id, role)
        if not allowed:
            return {
                'statusCode': 429,
                'body': json.dumps({'error': f'Limite mensal atingido ({limit} faturas). Upgrade para processar mais.'}),
            }

        body = json.loads(event.get('body', '{}'))
        key = body.get('key', '')

        if not key:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing key parameter'})}

        if not key.startswith(f"uploads/{user_id}/"):
            return {'statusCode': 403, 'body': json.dumps({'error': 'Access denied'})}

        lower_key = key.lower()

        if lower_key.endswith('.pdf'):
            start = textract.start_document_text_detection(
                DocumentLocation={'S3Object': {'Bucket': BUCKET, 'Name': key}}
            )
            increment_usage(user_id)
            return {
                'statusCode': 202,
                'body': json.dumps({
                    'status': 'processing',
                    'jobId': start['JobId'],
                    'key': key,
                    'remaining': remaining - 1,
                }),
            }
        else:
            text = extract_text_sync(BUCKET, key)
            if not text.strip():
                return {
                    'statusCode': 200,
                    'body': json.dumps({'status': 'done', 'expenses': [], 'totalAmount': 0, 'referenceMonth': ''}),
                }
            result = categorize_expenses(text)
            increment_usage(user_id)
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'done',
                    'expenses': result.get('expenses', []),
                    'totalAmount': result.get('totalAmount', 0),
                    'referenceMonth': result.get('referenceMonth', ''),
                    'remaining': remaining - 1,
                }),
            }

    except Exception as e:
        print(f"Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': 'Internal server error'})}
