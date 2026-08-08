"""Demo invoice processing — allows 1 free invoice per IP + session.

No Cognito auth required. Rate limited by IP + demo session ID.
"""
import json
import os
import uuid
import boto3

s3 = boto3.client('s3')
sqs = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('USER_DATA_TABLE', 'kdmeusalario-user-data'))

BUCKET = os.environ['BUCKET_NAME']
QUEUE_URL = os.environ['INVOICE_QUEUE_URL']

ALLOWED_TYPES = {'application/pdf', 'image/jpeg', 'image/png', 'image/webp'}
MAX_SIZE_MB = 5  # Lower limit for demo
DEMO_LIMIT = 1


def get_source_ip(event):
    """Extract client IP from API Gateway request context."""
    return event.get('requestContext', {}).get('http', {}).get('sourceIp', 'unknown')


def get_demo_session(event):
    """Extract demo session ID from header."""
    headers = event.get('headers', {})
    return headers.get('x-demo-session', '') or headers.get('X-Demo-Session', '')


def check_demo_limit(ip, session_id):
    """Check if this IP or session has already used their demo invoice."""
    # Check by IP
    try:
        resp = table.get_item(Key={'userId': 'demo', 'dataType': f'demo-ip#{ip}'})
        if resp.get('Item'):
            return False
    except Exception:
        pass

    # Check by session
    if session_id:
        try:
            resp = table.get_item(Key={'userId': 'demo', 'dataType': f'demo-session#{session_id}'})
            if resp.get('Item'):
                return False
        except Exception:
            pass

    return True


def register_demo_usage(ip, session_id):
    """Register that this IP and session have used their demo invoice."""
    import time
    now = int(time.time())
    ttl = now + (30 * 24 * 3600)  # Expire after 30 days

    try:
        table.put_item(Item={
            'userId': 'demo',
            'dataType': f'demo-ip#{ip}',
            'createdAt': now,
            'ttl': ttl,
        })
    except Exception:
        pass

    if session_id:
        try:
            table.put_item(Item={
                'userId': 'demo',
                'dataType': f'demo-session#{session_id}',
                'createdAt': now,
                'ttl': ttl,
            })
        except Exception:
            pass


def handler(event, context):
    """Handle demo invoice upload request."""
    try:
        ip = get_source_ip(event)
        session_id = get_demo_session(event)

        # Check rate limit
        if not check_demo_limit(ip, session_id):
            return {
                'statusCode': 429,
                'body': json.dumps({
                    'error': 'Limite do demo atingido (1 fatura). Crie uma conta para processar mais.',
                    'code': 'DEMO_LIMIT_EXCEEDED',
                }),
            }

        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'upload-url')

        if action == 'upload-url':
            filename = body.get('filename', 'invoice.pdf')
            content_type = body.get('contentType', 'application/pdf')
            file_size = body.get('fileSize', 0)

            # Validate
            if content_type not in ALLOWED_TYPES:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Tipo de arquivo não permitido. Aceitos: PDF, JPEG, PNG, WebP'}),
                }

            if file_size and file_size > MAX_SIZE_MB * 1024 * 1024:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Arquivo muito grande. Máximo no demo: {MAX_SIZE_MB}MB'}),
                }

            demo_user_id = f"demo-{ip.replace('.', '-')}-{session_id[:8] if session_id else 'anon'}"
            key = f"uploads/{demo_user_id}/{uuid.uuid4()}/{filename}"

            params = {'Bucket': BUCKET, 'Key': key, 'ContentType': content_type}
            if file_size:
                params['ContentLength'] = int(file_size)

            url = s3.generate_presigned_url('put_object', Params=params, ExpiresIn=300)

            return {
                'statusCode': 200,
                'body': json.dumps({'uploadUrl': url, 'key': key}),
            }

        elif action == 'process':
            key = body.get('key', '')
            if not key:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Missing key'})}

            # Register demo usage BEFORE processing
            register_demo_usage(ip, session_id)

            demo_user_id = key.split('/')[1] if '/' in key else f"demo-{ip}"

            # Send to SQS
            sqs.send_message(
                QueueUrl=QUEUE_URL,
                MessageBody=json.dumps({
                    'userId': demo_user_id,
                    'key': key,
                    'fileHash': '',
                }),
            )

            return {
                'statusCode': 202,
                'body': json.dumps({'status': 'queued', 'key': key}),
            }

        elif action == 'check-status':
            key = body.get('key', '')
            if not key:
                return {'statusCode': 400, 'body': json.dumps({'error': 'Missing key'})}

            demo_user_id = key.split('/')[1] if '/' in key else f"demo-{ip}"

            try:
                resp = table.get_item(Key={'userId': demo_user_id, 'dataType': f'invoice-job#{key}'})
                item = resp.get('Item')
                if not item:
                    return {'statusCode': 200, 'body': json.dumps({'status': 'processing'})}

                status = item.get('status', '')
                if status == 'done':
                    result = json.loads(item.get('result', '{}'))
                    return {
                        'statusCode': 200,
                        'body': json.dumps({
                            'status': 'done',
                            'expenses': result.get('expenses', []),
                            'totalAmount': result.get('totalAmount', 0),
                            'referenceMonth': result.get('referenceMonth', ''),
                        }),
                    }
                if status == 'error':
                    result = json.loads(item.get('result', '{}'))
                    return {'statusCode': 200, 'body': json.dumps({'status': 'error', 'error': result.get('error', 'Erro')})}

                return {'statusCode': 200, 'body': json.dumps({'status': 'processing'})}
            except Exception:
                return {'statusCode': 200, 'body': json.dumps({'status': 'processing'})}

        return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid action'})}

    except Exception as e:
        print(f"Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': 'Internal server error'})}
