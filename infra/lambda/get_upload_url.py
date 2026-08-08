import json
import os
import uuid
import boto3
from rate_limit import get_user_id, get_user_plan, check_rate_limit

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('USER_DATA_TABLE', 'kdmeusalario-user-data'))
BUCKET = os.environ['BUCKET_NAME']

ALLOWED_TYPES = {'application/pdf', 'image/jpeg', 'image/png', 'image/webp'}
MAX_SIZE_MB = 10


def check_duplicate(user_id, file_hash):
    """Check if a file with this hash was already processed for this user."""
    if not file_hash:
        return False
    try:
        resp = table.get_item(Key={'userId': user_id, 'dataType': f'file-hash#{file_hash}'})
        item = resp.get('Item')
        return item is not None
    except Exception:
        return False


def handler(event, context):
    try:
        user_id = get_user_id(event)
        if not user_id:
            return {'statusCode': 401, 'body': json.dumps({'error': 'Unauthorized'})}

        # Check rate limit BEFORE generating upload URL
        plan = get_user_plan(event)
        allowed, remaining, limit = check_rate_limit(user_id, plan)
        if not allowed:
            plan_label = 'Premium' if plan == 'free' else 'um plano superior'
            return {
                'statusCode': 429,
                'body': json.dumps({
                    'error': f'Limite mensal atingido ({limit} faturas). Faça upgrade para {plan_label} para processar mais.',
                    'code': 'RATE_LIMIT_EXCEEDED',
                    'limit': limit,
                    'plan': plan,
                }),
            }

        body = json.loads(event.get('body', '{}'))
        filename = body.get('filename', 'invoice.pdf')
        content_type = body.get('contentType', 'application/pdf')
        file_size = body.get('fileSize', 0)
        file_hash = body.get('fileHash', '')

        # Check for duplicate file
        if file_hash and check_duplicate(user_id, file_hash):
            return {
                'statusCode': 409,
                'body': json.dumps({
                    'error': 'Esta fatura já foi processada anteriormente. Exclua a existente para reprocessar.',
                    'code': 'DUPLICATE_FILE',
                }),
            }

        # Validate content type
        if content_type not in ALLOWED_TYPES:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Tipo de arquivo não permitido. Aceitos: PDF, JPEG, PNG, WebP'}),
            }

        # Validate file size
        if file_size and file_size > MAX_SIZE_MB * 1024 * 1024:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': f'Arquivo muito grande. Máximo: {MAX_SIZE_MB}MB'}),
            }

        # Validate extension matches content type
        ext = filename.rsplit('.', 1)[-1].lower() if '.' in filename else ''
        valid_exts = {'application/pdf': 'pdf', 'image/jpeg': 'jpg,jpeg', 'image/png': 'png', 'image/webp': 'webp'}
        expected = valid_exts.get(content_type, '')
        if ext not in expected.split(','):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Extensão do arquivo não corresponde ao tipo informado'}),
            }

        key = f"uploads/{user_id}/{uuid.uuid4()}/{filename}"

        params = {'Bucket': BUCKET, 'Key': key, 'ContentType': content_type}
        if file_size:
            params['ContentLength'] = int(file_size)

        url = s3.generate_presigned_url('put_object', Params=params, ExpiresIn=300)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'uploadUrl': url,
                'key': key,
                'fileHash': file_hash,
                'remaining': remaining - 1,
                'limit': limit,
            }),
        }

    except Exception as e:
        print(f"Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': 'Internal server error'})}
