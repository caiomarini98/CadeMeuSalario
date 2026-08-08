import json
import boto3

ssm = boto3.client('ssm', region_name='us-east-1')


def handler(event, context):
    try:
        result = ssm.get_parameter(Name='/kdmeusalario/brapi-token')
        token = result['Parameter']['Value']
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'brapiToken': token}),
        }
    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Internal server error'}),
        }
