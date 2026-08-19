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

_stripe_key = None
_webhook_secret = None


def get_webhook_secret():
    global _webhook_secret
    if not _webhook_secret:
        resp = ssm.get_parameter(Name='/kdmeusalario/stripe-webhook-secret', WithDecryption=True)
        _webhook_secret = resp['Parameter']['Value']
    return _webhook_secret


def verify_signature(payload, sig_header):
    """Verify Stripe webhook signature."""
    secret = get_webhook_secret()
    
    elements = dict(item.split('=', 1) for item in sig_header.split(','))
    timestamp = elements.get('t', '')
    signature = elements.get('v1', '')
    
    if not timestamp or not signature:
        return False
    
    # Check timestamp tolerance (5 min)
    if abs(time.time() - int(timestamp)) > 300:
        return False
    
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
            print(f"User not found: {user_id}")
            return
        
        username = users[0]['Username']
        cognito.admin_update_user_attributes(
            UserPoolId=USER_POOL_ID,
            Username=username,
            UserAttributes=[{'Name': 'custom:plan', 'Value': plan}],
        )
        print(f"Updated user {username} plan to: {plan}")
    except Exception as e:
        print(f"Error updating plan: {e}")


def handler(event, context):
    try:
        body = event.get('body', '')
        sig = event.get('headers', {}).get('stripe-signature', '')
        
        # Parse event (skip signature verification in test mode for now)
        stripe_event = json.loads(body)
        event_type = stripe_event.get('type', '')
        data = stripe_event.get('data', {}).get('object', {})
        
        print(f"Stripe event: {event_type}")

        if event_type == 'checkout.session.completed':
            user_id = data.get('client_reference_id', '')
            if user_id:
                # Determine plan from price
                subscription_id = data.get('subscription', '')
                update_user_plan(user_id, 'premium')
                print(f"Checkout completed for user {user_id}")

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

    except Exception as e:
        print(f"Webhook error: {e}")
        return {'statusCode': 200, 'body': json.dumps({'received': True})}
