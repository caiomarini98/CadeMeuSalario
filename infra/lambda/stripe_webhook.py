"""Stripe webhook — handles subscription events and updates user plan in Cognito."""
import json
import os
import hashlib
import hmac
import time
import boto3

ssm = boto3.client('ssm')
cognito = boto3.client('cognito-idp')

USER_POOL_ID = os.environ.get('USER_POOL_ID', '')

_webhook_secret = None


def get_webhook_secret():
    global _webhook_secret
    if not _webhook_secret:
        resp = ssm.get_parameter(Name='/kdmeusalario/stripe-webhook-secret', WithDecryption=True)
        _webhook_secret = resp['Parameter']['Value']
    return _webhook_secret


def verify_signature(payload, sig_header):
    """Verify Stripe webhook signature (v1 scheme).

    Stripe signs webhooks using HMAC-SHA256 with a timestamp to prevent replay attacks.
    See: https://docs.stripe.com/webhooks/signatures
    """
    secret = get_webhook_secret()

    # Parse signature header: "t=<timestamp>,v1=<signature>"
    elements = {}
    for item in sig_header.split(','):
        parts = item.split('=', 1)
        if len(parts) == 2:
            elements[parts[0].strip()] = parts[1].strip()

    timestamp = elements.get('t', '')
    signature = elements.get('v1', '')

    if not timestamp or not signature:
        return False

    # Reject events older than 5 minutes (replay protection)
    try:
        if abs(time.time() - int(timestamp)) > 300:
            return False
    except (ValueError, TypeError):
        return False

    # Compute expected signature
    signed_payload = f"{timestamp}.{payload}"
    expected = hmac.new(
        secret.encode(), signed_payload.encode(), hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected, signature)


def update_user_plan(user_id, plan):
    """Update custom:plan attribute in Cognito."""
    try:
        # Find user by sub
        resp = cognito.list_users(
            UserPoolId=USER_POOL_ID,
            Filter=f'sub = "{user_id}"',
            Limit=1,
        )
        users = resp.get('Users', [])
        if not users:
            print(f"User not found for plan update")
            return

        username = users[0]['Username']
        cognito.admin_update_user_attributes(
            UserPoolId=USER_POOL_ID,
            Username=username,
            UserAttributes=[{'Name': 'custom:plan', 'Value': plan}],
        )
        print(f"Updated user plan to: {plan}")
    except Exception as e:
        print(f"Error updating plan: {e}")


def handler(event, context):
    try:
        body = event.get('body', '')
        sig = event.get('headers', {}).get('stripe-signature', '')

        # SECURITY: Verify webhook signature before processing
        if not sig:
            print("Missing stripe-signature header")
            return {'statusCode': 401, 'body': json.dumps({'error': 'Missing signature'})}

        if not verify_signature(body, sig):
            print("Invalid webhook signature — rejecting event")
            return {'statusCode': 401, 'body': json.dumps({'error': 'Invalid signature'})}

        stripe_event = json.loads(body)
        event_type = stripe_event.get('type', '')
        data = stripe_event.get('data', {}).get('object', {})

        print(f"Stripe event: {event_type}")

        if event_type == 'checkout.session.completed':
            user_id = data.get('client_reference_id', '')
            if user_id:
                update_user_plan(user_id, 'premium')
                print(f"Checkout completed — plan upgraded")

        elif event_type == 'customer.subscription.created':
            metadata = data.get('metadata', {})
            user_id = metadata.get('user_id', '')
            if user_id:
                update_user_plan(user_id, 'premium')

        elif event_type == 'customer.subscription.updated':
            metadata = data.get('metadata', {})
            user_id = metadata.get('user_id', '')
            status = data.get('status', '')
            if user_id:
                if status in ('active', 'trialing'):
                    update_user_plan(user_id, 'premium')
                elif status in ('canceled', 'unpaid', 'past_due'):
                    update_user_plan(user_id, 'free')

        elif event_type == 'customer.subscription.deleted':
            metadata = data.get('metadata', {})
            user_id = metadata.get('user_id', '')
            if user_id:
                update_user_plan(user_id, 'free')

        return {'statusCode': 200, 'body': json.dumps({'received': True})}

    except json.JSONDecodeError:
        print("Invalid JSON in webhook body")
        return {'statusCode': 400, 'body': json.dumps({'error': 'Invalid JSON'})}
    except Exception as e:
        print(f"Webhook error: {type(e).__name__}")
        return {'statusCode': 500, 'body': json.dumps({'error': 'Internal error'})}
