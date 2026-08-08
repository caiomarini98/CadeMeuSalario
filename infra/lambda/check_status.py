import json
import os
import boto3
from bedrock_helper import categorize_expenses
from rate_limit import get_user_id

textract = boto3.client('textract')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('USER_DATA_TABLE', 'kdmeusalario-user-data'))


def get_textract_text(job_id):
    """Get all text from a completed Textract job."""
    lines = []
    result = textract.get_document_text_detection(JobId=job_id)

    for block in result.get('Blocks', []):
        if block['BlockType'] == 'LINE':
            lines.append(block.get('Text', ''))

    next_token = result.get('NextToken')
    while next_token:
        result = textract.get_document_text_detection(
            JobId=job_id, NextToken=next_token
        )
        for block in result.get('Blocks', []):
            if block['BlockType'] == 'LINE':
                lines.append(block.get('Text', ''))
        next_token = result.get('NextToken')

    return '\n'.join(lines)


def get_cached_result(user_id, job_id):
    """Check if we already have a cached result for this job."""
    try:
        resp = table.get_item(Key={'userId': user_id, 'dataType': f'invoice-result#{job_id}'})
        item = resp.get('Item')
        if item and item.get('status') == 'done':
            return {
                'status': 'done',
                'expenses': json.loads(item.get('expenses', '[]')),
                'totalAmount': item.get('totalAmount', 0),
                'referenceMonth': item.get('referenceMonth', ''),
            }
        if item and item.get('status') == 'categorizing':
            return {'status': 'processing'}
    except Exception:
        pass
    return None


def save_result(user_id, job_id, categorized):
    """Cache the categorization result in DynamoDB."""
    try:
        table.put_item(Item={
            'userId': user_id,
            'dataType': f'invoice-result#{job_id}',
            'status': 'done',
            'expenses': json.dumps(categorized.get('expenses', [])),
            'totalAmount': categorized.get('totalAmount', 0),
            'referenceMonth': categorized.get('referenceMonth', ''),
        })
    except Exception as e:
        print(f"Error saving result to DynamoDB: {e}")


def mark_categorizing(user_id, job_id):
    """Mark that categorization is in progress."""
    try:
        table.put_item(Item={
            'userId': user_id,
            'dataType': f'invoice-result#{job_id}',
            'status': 'categorizing',
        })
    except Exception:
        pass


def handler(event, context):
    try:
        user_id = get_user_id(event)
        if not user_id:
            return {'statusCode': 401, 'body': json.dumps({'error': 'Unauthorized'})}

        body = json.loads(event.get('body', '{}'))
        job_id = body.get('jobId', '')

        if not job_id:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing jobId'}),
            }

        # Check cache first
        cached = get_cached_result(user_id, job_id)
        if cached:
            return {'statusCode': 200, 'body': json.dumps(cached)}

        # Check Textract status
        result = textract.get_document_text_detection(JobId=job_id)
        status = result['JobStatus']

        if status == 'IN_PROGRESS':
            return {
                'statusCode': 200,
                'body': json.dumps({'status': 'processing'}),
            }

        if status == 'FAILED':
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'error',
                    'error': result.get('StatusMessage', 'Textract failed'),
                }),
            }

        # SUCCEEDED — extract text and categorize
        text = get_textract_text(job_id)

        if not text.strip():
            empty_result = {
                'status': 'done',
                'expenses': [],
                'totalAmount': 0,
                'referenceMonth': '',
            }
            save_result(user_id, job_id, empty_result)
            return {'statusCode': 200, 'body': json.dumps(empty_result)}

        # Mark as categorizing so next poll knows we're working on it
        mark_categorizing(user_id, job_id)

        # Call Bedrock for categorization
        categorized = categorize_expenses(text)

        # Cache the result
        save_result(user_id, job_id, categorized)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'status': 'done',
                'expenses': categorized.get('expenses', []),
                'totalAmount': categorized.get('totalAmount', 0),
                'referenceMonth': categorized.get('referenceMonth', ''),
            }),
        }

    except Exception as e:
        print(f"Error: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'}),
        }
