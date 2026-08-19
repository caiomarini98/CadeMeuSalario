"""Create Stripe Checkout session for subscription."""
import json
import os
import boto3
import urllib.request
import urllib.parse

ssm = boto3.client('ssm')

# Price IDs
PRICES = {
    'essencial_monthly': 'price_1U5xT3HcAbRQBmOijmAVZjYQ',
    'essencial_yearly': 'price_1U5xT3HcAbRQBmOiwGXHH5pR',
    'pro_monthly': 'price_1U5xT4HcAbRQBmOib3qSCuQV',
    'pro_yearly': 'price_1U5xT4HcAbRQBmOiCJ9aHLe7',
}

_stripe_key = None


def get_stripe_key():
    global _stripe_key
    if not _stripe_key:
        resp = ssm.get_parameter(Name='/kdmeusalario/stripe-secret-key', WithDecryption=True)
        _stripe_key = resp['Parameter']['Value']
    return _stripe_key


def stripe_request(path, data):
    """Make a request to Stripe API."""
    key = get_stripe_key()
    encoded = urllib.parse.urlencode(data, doseq=True).encode()
    req = urllib.request.Request(
        f'https://api.stripe.com/v1{path}',
        data=encoded,
        headers={'Authorization': f'Bearer {key}'},
        method='POST',
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def get_user_id(event):
    claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
    return claims.get('sub', '')


def get_user_email(event):
    claims = event.get('requestContext', {}).get('authorizer', {}).get('jwt', {}).get('claims', {})
    return claims.get('email', '')


def handler(event, context):
    try:
        user_id = get_user_id(event)
        if not user_id:
            return {'statusCode': 401, 'body': json.dumps({'error': 'Unauthorized'})}

        body = json.loads(event.get('body', '{}'))
        plan = body.get('plan', 'essencial_monthly')
        
        if plan not in PRICES:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Plano inválido'})}

        price_id = PRICES[plan]
        email = get_user_email(event)
        
        # Determine success/cancel URLs
        origin = event.get('headers', {}).get('origin', 'https://cademeusalario.com.br')

        # Create checkout session
        session_data = {
            'mode': 'subscription',
            'payment_method_types[]': ['card'],
            'line_items[0][price]': price_id,
            'line_items[0][quantity]': '1',
            'success_url': f'{origin}/app?checkout=success',
            'cancel_url': f'{origin}/app?checkout=cancel',
            'client_reference_id': user_id,
            'subscription_data[trial_period_days]': '7',
            'subscription_data[metadata][user_id]': user_id,
        }
        
        if email:
            session_data['customer_email'] = email

        session = stripe_request('/checkout/sessions', session_data)

        return {
            'statusCode': 200,
            'body': json.dumps({'url': session['url']}),
        }

    except Exception as e:
        print(f"Error: {e}")
        return {'statusCode': 500, 'body': json.dumps({'error': 'Internal server error'})}
