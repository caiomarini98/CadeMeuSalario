import json
import boto3
from bedrock_helper import categorize_expenses
from rate_limit import get_user_id

textract = boto3.client('textract')


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

        # SUCCEEDED
        text = get_textract_text(job_id)

        if not text.strip():
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'done',
                    'expenses': [],
                    'totalAmount': 0,
                    'referenceMonth': '',
                }),
            }

        categorized = categorize_expenses(text)

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
