"""Rate limiting — atomic check-and-increment using DynamoDB conditional writes."""
import os
from datetime import datetime, timezone
import boto3
from botocore.exceptions import ClientError

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('USER_DATA_TABLE', 'kdmeusalario-user-data'))

# Limits per plan
MONTHLY_LIMITS = {'free': 0, 'premium': 3, 'essencial': 3, 'pro': 999999, 'admin': 999999}


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
    if plan in ('free', 'premium', 'essencial', 'pro'):
        return plan
    return 'free'


def _month_key():
    return datetime.now(timezone.utc).strftime('%Y-%m')


def check_rate_limit(user_id, plan='free'):
    """Returns (allowed: bool, remaining: int, limit: int).

    NOTE: This is a read-only check. For atomic enforcement, use check_and_increment().
    """
    limit = MONTHLY_LIMITS.get(plan, 3)
    data_type = f'rate_limit#{_month_key()}'

    result = table.get_item(Key={'userId': user_id, 'dataType': data_type})
    count = int(result.get('Item', {}).get('payload', '0'))

    remaining = max(0, limit - count)
    return count < limit, remaining, limit


def check_and_increment(user_id, plan='free'):
    """Atomic check-and-increment to prevent race conditions (TOCTOU).

    Uses DynamoDB ConditionExpression to atomically verify the counter is below
    the limit AND increment it in a single operation. If two concurrent requests
    arrive, only one will succeed — the other gets ConditionalCheckFailedException.

    Returns (allowed: bool, remaining: int, limit: int).
    """
    limit = MONTHLY_LIMITS.get(plan, 3)

    # Admin/pro have effectively unlimited access
    if limit >= 999999:
        return True, 999999, limit

    data_type = f'rate_limit#{_month_key()}'

    try:
        result = table.update_item(
            Key={'userId': user_id, 'dataType': data_type},
            UpdateExpression='SET payload = if_not_exists(payload, :zero) + :one',
            ConditionExpression='attribute_not_exists(payload) OR payload < :limit',
            ExpressionAttributeValues={
                ':zero': 0,
                ':one': 1,
                ':limit': limit,
            },
            ReturnValues='UPDATED_NEW',
        )
        new_count = int(result['Attributes']['payload'])
        remaining = max(0, limit - new_count)
        return True, remaining, limit
    except ClientError as e:
        if e.response['Error']['Code'] == 'ConditionalCheckFailedException':
            # Counter already at or above limit
            return False, 0, limit
        raise


def get_usage_count(user_id):
    """Get current month usage count."""
    data_type = f'rate_limit#{_month_key()}'
    result = table.get_item(Key={'userId': user_id, 'dataType': data_type})
    return int(result.get('Item', {}).get('payload', '0'))


def increment_usage(user_id):
    """Increment monthly counter (non-conditional).

    DEPRECATED: Prefer check_and_increment() for atomic enforcement.
    Kept for backward compatibility with invoice_worker.py.
    """
    data_type = f'rate_limit#{_month_key()}'
    table.update_item(
        Key={'userId': user_id, 'dataType': data_type},
        UpdateExpression='SET payload = if_not_exists(payload, :zero) + :one',
        ExpressionAttributeValues={':zero': 0, ':one': 1},
    )
