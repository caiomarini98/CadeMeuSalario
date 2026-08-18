"""Pre Sign-Up trigger — auto-links external providers (Google) to existing Cognito users.

When a user signs in via Google and an account with the same email already exists,
this trigger links the external identity to the existing account instead of creating a duplicate.
"""
import boto3

cognito = boto3.client('cognito-idp')


def handler(event, context):
    user_pool_id = event['userPoolId']
    trigger_source = event['triggerSource']
    user_email = event['request']['userAttributes'].get('email', '')

    # Only act on external provider sign-ups (Google, Facebook, etc.)
    if trigger_source == 'PreSignUp_ExternalProvider' and user_email:
        # Check if a native user with this email already exists
        try:
            resp = cognito.list_users(
                UserPoolId=user_pool_id,
                Filter=f'email = "{user_email}"',
                Limit=1,
            )
            existing_users = resp.get('Users', [])

            # Find native (non-external) user with same email
            native_user = None
            for u in existing_users:
                # Native users don't have a provider prefix in username
                if not any(u['Username'].startswith(p) for p in ['Google_', 'Facebook_', 'LoginWithAmazon_']):
                    native_user = u
                    break

            if native_user:
                # Link the external provider to the existing native user
                provider_name = event['userName'].split('_')[0]  # e.g., 'Google'
                provider_user_id = event['userName'].split('_', 1)[1]  # e.g., '1234567890'

                cognito.admin_link_provider_for_user(
                    UserPoolId=user_pool_id,
                    DestinationUser={
                        'ProviderName': 'Cognito',
                        'ProviderAttributeValue': native_user['Username'],
                    },
                    SourceUser={
                        'ProviderName': provider_name,
                        'ProviderAttributeName': 'Cognito_Subject',
                        'ProviderAttributeValue': provider_user_id,
                    },
                )
                print(f"Linked {provider_name} user to existing native user: {native_user['Username']}")

        except Exception as e:
            print(f"Error in pre-signup link: {e}")
            # Don't block sign-up if linking fails

    # Auto-confirm and auto-verify email for external providers
    if trigger_source == 'PreSignUp_ExternalProvider':
        event['response']['autoConfirmUser'] = True
        event['response']['autoVerifyEmail'] = True

    return event
