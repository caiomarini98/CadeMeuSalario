import os
from datetime import datetime, timezone
import boto3

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('USER_DATA_TABLE', 'kdmeusalario-user-data'))

# Limits per plan: free=3, premium=10, admin=unlimited
MONTHLY_LIMITS = {'free': 3, 'premium': 10, 'admin': 999999}


def get_user_id(event):
    claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
    return claims.get('sub', '')


def get_user_role(event):
    claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
    return claims.get('custom:role', 'user')


def get_user_plan(event):
    """Determine user plan from JWT claims. Admin role = unlimited, otherwise check custom:plan."""
    claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
    role = claims.get('custom:role', 'user')
    if role == 'admin':
        return 'admin'
    plan = claims.get('custom:plan', 'free')
    if plan in ('free', 'premium'):
        return plan
    return 'free'


def _month_key():
    return datetime.now(timezone.utc).strftime('%Y-%m')


def check_rate_limit(user_id, plan='free'):
    """Returns (allowed: bool, remaining: int, limit: int)."""
    limit = MONTHLY_LIMITS.get(plan, 3)
    data_type = f'rate_limit#{_month_key()}'

    result = table.get_item(Key={'userId': user_id, 'dataType': data_type})
    count = int(result.get('Item', {}).get('payload', '0'))

    remaining = max(0, limit - count)
    return count < limit, remaining, limit


def get_usage_count(user_id):
    """Get current month usage count."""
    data_type = f'rate_limit#{_month_key()}'
    result = table.get_item(Key={'userId': user_id, 'dataType': data_type})
    return int(result.get('Item', {}).get('payload', '0'))


def increment_usage(user_id):
    """Increment monthly counter. Call AFTER successful processing."""
    data_type = f'rate_limit#{_month_key()}'
    table.update_item(
        Key={'userId': user_id, 'dataType': data_type},
        UpdateExpression='SET payload = if_not_exists(payload, :zero) + :one',
        ExpressionAttributeValues={':zero': 0, ':one': 1},
    )
