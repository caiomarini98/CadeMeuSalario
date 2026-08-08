import json
import os
import boto3
from rate_limit import get_user_id, get_user_plan, check_rate_limit, increment_usage

sqs = boto3.client('sqs')
QUEUE_URL = os.environ['INVOICE_QUEUE_URL']


def handler(event, context):
    """Validate request and send to SQS for async processing."""
    try:
        user_id = get_user_id(event)
        if not user_id:
            return {'statusCode': 401, 'body': json.dumps({'error': 'Unauthorized'})}

        # Double-check rate limit (defense in depth — already checked at upload-url)
        plan = get_user_plan(event)
        allowed, remaining, limit = check_rate_limit(user_id, plan)
        if not allowed:
            return {
                'statusCode': 429,
                'body': json.dumps({
                    'error': f'Limite mensal atingido ({limit} faturas).',
                    'code': 'RATE_LIMIT_EXCEEDED',
                }),
            }

        body = json.loads(event.get('body', '{}'))
        key = body.get('key', '')

        if not key:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing key parameter'})}

        if not key.startswith(f"uploads/{user_id}/"):
            return {'statusCode': 403, 'body': json.dumps({'error': 'Access denied'})}

        # Increment usage counter NOW (before processing, to prevent race conditions)
        increment_usage(user_id)

        # Send to SQS for async processing
        msg_params = {
            'QueueUrl': QUEUE_URL,
            'MessageBody': json.dumps({
                'userId': user_id,
                'key': key,
            }),
        }
        if QUEUE_URL.endswith('.fifo'):
            msg_params['MessageGroupId'] = user_id
        sqs.send_message(**msg_params)

        return {
            'statusCode': 202,
            'body': json.dumps({
                'status': 'queued',
                'key': key,
                'remaining': remaining - 1,
            }),
        }

    except Exception as e:
        print(f"Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': 'Internal server error'})}
