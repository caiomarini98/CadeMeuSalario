import os
from datetime import datetime, timezone
import boto3
from boto3.dynamodb.conditions import Key

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('USER_DATA_TABLE', 'kdmeusalario-user-data'))

# Limits per plan
MONTHLY_LIMITS = {'free': 1, 'premium': 10, 'admin': 999}


def get_user_id(event):
    claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
    return claims.get('sub', '')


def get_user_role(event):
    claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
    return claims.get('custom:role', 'user')


def _month_key():
    return datetime.now(timezone.utc).strftime('%Y-%m')


def check_rate_limit(user_id, role='user'):
    """Returns (allowed: bool, remaining: int, limit: int)."""
    plan = 'admin' if role == 'admin' else 'free'  # TODO: read plan from user profile
    limit = MONTHLY_LIMITS.get(plan, 5)
    data_type = f'rate_limit#{_month_key()}'

    result = table.get_item(Key={'userId': user_id, 'dataType': data_type})
    count = int(result.get('Item', {}).get('payload', '0'))

    remaining = max(0, limit - count)
    return count < limit, remaining, limit


def increment_usage(user_id):
    """Increment monthly counter. Call AFTER successful processing."""
    data_type = f'rate_limit#{_month_key()}'
    table.update_item(
        Key={'userId': user_id, 'dataType': data_type},
        UpdateExpression='SET payload = if_not_exists(payload, :zero) + :one',
        ExpressionAttributeValues={':zero': 0, ':one': 1},
    )
