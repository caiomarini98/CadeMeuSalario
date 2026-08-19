import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('USER_DATA_TABLE', 'kdmeusalario-user-data'))


def get_user_id(event):
    """Extract userId from Cognito JWT claims."""
    claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
    return claims.get('sub', '')


# Whitelist of allowed dataTypes — prevents access to internal keys (rate_limit#, file-hash#, etc.)
ALLOWED_DATA_TYPES = {'portfolio', 'invoices', 'fixedIncome', 'goals', 'income', 'settings', 'alerts'}


def respond(status, body):
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps(body),
    }


def handler(event, context):
    try:
        user_id = get_user_id(event)
        if not user_id:
            return respond(401, {'error': 'Unauthorized'})

        method = event.get('requestContext', {}).get('http', {}).get('method', '')
        data_type = event.get('pathParameters', {}).get('dataType', '')

        if not data_type:
            return respond(400, {'error': 'dataType required'})

        if data_type not in ALLOWED_DATA_TYPES:
            return respond(400, {'error': 'Invalid dataType'})

        if method == 'GET':
            result = table.get_item(Key={'userId': user_id, 'dataType': data_type})
            item = result.get('Item')
            if item:
                return respond(200, {'data': json.loads(item.get('payload', '{}'))})
            return respond(200, {'data': None})

        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            payload = body.get('data', {})
            table.put_item(Item={
                'userId': user_id,
                'dataType': data_type,
                'payload': json.dumps(payload),
            })
            return respond(200, {'success': True})

        return respond(405, {'error': 'Method not allowed'})

    except Exception as e:
        print(f"Error: {e}")
        return respond(500, {'error': 'Internal server error'})
