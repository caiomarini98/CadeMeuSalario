import json
import os
import time
import boto3
from bedrock_helper import categorize_expenses

s3 = boto3.client('s3')
textract = boto3.client('textract')
dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ.get('USER_DATA_TABLE', 'kdmeusalario-user-data'))

BUCKET = os.environ['BUCKET_NAME']


def save_status(user_id, key, status, data=None):
    """Save processing status to DynamoDB."""
    item = {
        'userId': user_id,
        'dataType': f'invoice-job#{key}',
        'status': status,
        'updatedAt': int(time.time()),
    }
    if data:
        item['result'] = json.dumps(data)
    table.put_item(Item=item)


def extract_text_sync(bucket, key):
    """Textract sync — JPEG/PNG only."""
    response = textract.detect_document_text(
        Document={'S3Object': {'Bucket': bucket, 'Name': key}}
    )
    lines = []
    for block in response.get('Blocks', []):
        if block['BlockType'] == 'LINE':
            lines.append(block.get('Text', ''))
    return '\n'.join(lines)


def extract_text_async(bucket, key):
    """Textract async — PDF. Starts job and polls until complete."""
    start = textract.start_document_text_detection(
        DocumentLocation={'S3Object': {'Bucket': bucket, 'Name': key}}
    )
    job_id = start['JobId']

    # Poll for completion (max ~4 min)
    for _ in range(80):
        time.sleep(3)
        result = textract.get_document_text_detection(JobId=job_id)
        status = result['JobStatus']

        if status == 'SUCCEEDED':
            lines = []
            for block in result.get('Blocks', []):
                if block['BlockType'] == 'LINE':
                    lines.append(block.get('Text', ''))

            # Handle pagination
            next_token = result.get('NextToken')
            while next_token:
                result = textract.get_document_text_detection(
                    JobId=job_id, NextToken=next_token
                )
                for block in result.get('Blocks', []):
                    if block['BlockType'] == 'LINE':
                        lines.append(block.get('Text', ''))
                next_token = result.get('NextToken')

            return '\n'.join(lines), job_id

        if status == 'FAILED':
            raise Exception(f"Textract failed: {result.get('StatusMessage', 'Unknown error')}")

    raise Exception("Textract timeout — job did not complete in time")


def handler(event, context):
    """Process invoice from SQS message."""
    for record in event.get('Records', []):
        try:
            msg = json.loads(record['body'])
            user_id = msg['userId']
            key = msg['key']

            print(f"Processing invoice: user={user_id}, key={key}")

            # Mark as processing
            save_status(user_id, key, 'processing')

            # Extract text based on file type
            lower_key = key.lower()
            job_id = None

            if lower_key.endswith('.pdf'):
                text, job_id = extract_text_async(BUCKET, key)
            else:
                text = extract_text_sync(BUCKET, key)

            if not text.strip():
                result = {'expenses': [], 'totalAmount': 0, 'referenceMonth': ''}
                save_status(user_id, key, 'done', result)
                # Also save by jobId if we have one
                if job_id:
                    _save_job_result(user_id, job_id, result)
                print(f"Empty text for {key}")
                return

            # Categorize with Bedrock
            categorized = categorize_expenses(text)

            result = {
                'expenses': categorized.get('expenses', []),
                'totalAmount': categorized.get('totalAmount', 0),
                'referenceMonth': categorized.get('referenceMonth', ''),
            }

            # Save result
            save_status(user_id, key, 'done', result)
            if job_id:
                _save_job_result(user_id, job_id, result)

            print(f"Done processing {key}: {len(result['expenses'])} expenses, total={result['totalAmount']}")

        except Exception as e:
            print(f"Error processing record: {e}")
            # Save error status
            try:
                save_status(user_id, key, 'error', {'error': str(e)})
            except Exception:
                pass
            # Re-raise to trigger SQS retry/DLQ
            raise


def _save_job_result(user_id, job_id, result):
    """Also save by jobId for backward compatibility with check-status polling."""
    try:
        table.put_item(Item={
            'userId': user_id,
            'dataType': f'invoice-result#{job_id}',
            'status': 'done',
            'expenses': json.dumps(result.get('expenses', [])),
            'totalAmount': result.get('totalAmount', 0),
            'referenceMonth': result.get('referenceMonth', ''),
        })
    except Exception as e:
        print(f"Error saving job result: {e}")
