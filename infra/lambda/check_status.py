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


def get_cached_result(user_id, lookup_key):
    """Check if we have a cached result (by jobId or S3 key)."""
    try:
        resp = table.get_item(Key={'userId': user_id, 'dataType': f'invoice-result#{lookup_key}'})
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


def get_job_status(user_id, key):
    """Check processing status by S3 key (new SQS flow)."""
    try:
        resp = table.get_item(Key={'userId': user_id, 'dataType': f'invoice-job#{key}'})
        item = resp.get('Item')
        if not item:
            return None

        status = item.get('status', '')
        if status == 'done':
            result = json.loads(item.get('result', '{}'))
            return {
                'status': 'done',
                'expenses': result.get('expenses', []),
                'totalAmount': result.get('totalAmount', 0),
                'referenceMonth': result.get('referenceMonth', ''),
            }
        if status == 'error':
            result = json.loads(item.get('result', '{}'))
            return {'status': 'error', 'error': result.get('error', 'Processing failed')}
        if status == 'processing':
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
        print(f"Error saving result: {e}")


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
        key = body.get('key', '')

        if not job_id and not key:
            return {'statusCode': 400, 'body': json.dumps({'error': 'Missing jobId or key'})}

        # New flow: check by S3 key
        if key:
            result = get_job_status(user_id, key)
            if result:
                return {'statusCode': 200, 'body': json.dumps(result)}
            # Not found yet — still queued
            return {'statusCode': 200, 'body': json.dumps({'status': 'processing'})}

        # Legacy flow: check by Textract jobId
        # Check cache first
        cached = get_cached_result(user_id, job_id)
        if cached:
            return {'statusCode': 200, 'body': json.dumps(cached)}

        # Check Textract status
        result = textract.get_document_text_detection(JobId=job_id)
        status = result['JobStatus']

        if status == 'IN_PROGRESS':
            return {'statusCode': 200, 'body': json.dumps({'status': 'processing'})}

        if status == 'FAILED':
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'error',
                    'error': result.get('StatusMessage', 'Textract failed'),
                }),
            }

        # SUCCEEDED
        text = get_textract_text(job_id)

        if not text.strip():
            empty_result = {'status': 'done', 'expenses': [], 'totalAmount': 0, 'referenceMonth': ''}
            save_result(user_id, job_id, empty_result)
            return {'statusCode': 200, 'body': json.dumps(empty_result)}

        mark_categorizing(user_id, job_id)
        categorized = categorize_expenses(text)
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
        return {'statusCode': 500, 'body': json.dumps({'error': 'Internal server error'})}
