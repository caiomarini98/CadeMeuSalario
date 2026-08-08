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

# Minimum characters to consider pypdf extraction successful
MIN_TEXT_LENGTH = 100


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


def save_file_hash(user_id, file_hash, key):
    """Register file hash in DynamoDB to prevent reprocessing."""
    if not file_hash:
        return
    try:
        table.put_item(Item={
            'userId': user_id,
            'dataType': f'file-hash#{file_hash}',
            'key': key,
            'createdAt': int(time.time()),
        })
    except Exception as e:
        print(f"Error saving file hash: {e}")


def remove_file_hash(user_id, file_hash):
    """Remove file hash from DynamoDB (for when user deletes invoice)."""
    if not file_hash:
        return
    try:
        table.delete_item(Key={'userId': user_id, 'dataType': f'file-hash#{file_hash}'})
    except Exception:
        pass


def extract_text_pypdf(bucket, key):
    """Extract text from PDF using pypdf (for text-based PDFs). No Textract cost."""
    import pypdf
    import io

    obj = s3.get_object(Bucket=bucket, Key=key)
    pdf_bytes = obj['Body'].read()

    try:
        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))

        # Check if PDF is encrypted/password-protected
        if reader.is_encrypted:
            raise Exception('PASSWORD_PROTECTED')

        text_parts = []
        for page in reader.pages:
            page_text = page.extract_text() or ''
            text_parts.append(page_text)

        text = '\n'.join(text_parts)
        return text.strip()
    except Exception as e:
        if 'PASSWORD_PROTECTED' in str(e):
            raise
        print(f"pypdf extraction failed: {e}")
        return ''


def extract_text_textract_sync(bucket, key):
    """Textract sync — JPEG/PNG only."""
    response = textract.detect_document_text(
        Document={'S3Object': {'Bucket': bucket, 'Name': key}}
    )
    lines = []
    for block in response.get('Blocks', []):
        if block['BlockType'] == 'LINE':
            lines.append(block.get('Text', ''))
    return '\n'.join(lines)


def extract_text_textract_async(bucket, key):
    """Textract async — for scanned PDFs that pypdf can't read."""
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
            file_hash = msg.get('fileHash', '')

            print(f"Processing invoice: user={user_id}, key={key}, hash={file_hash[:8] if file_hash else 'none'}")

            # Mark as processing
            save_status(user_id, key, 'processing')

            # Extract text based on file type
            lower_key = key.lower()
            job_id = None
            text = ''

            if lower_key.endswith('.pdf'):
                # Strategy: try pypdf first (free, fast), fallback to Textract (paid)
                print("Attempting pypdf extraction...")
                text = extract_text_pypdf(BUCKET, key)

                if len(text) >= MIN_TEXT_LENGTH:
                    print(f"pypdf success: {len(text)} chars extracted")
                else:
                    # Likely a scanned PDF — use Textract
                    print(f"pypdf insufficient ({len(text)} chars), falling back to Textract...")
                    text, job_id = extract_text_textract_async(BUCKET, key)
                    print(f"Textract extracted: {len(text)} chars")
            else:
                # Images: always use Textract
                text = extract_text_textract_sync(BUCKET, key)

            if not text.strip():
                result = {'expenses': [], 'totalAmount': 0, 'referenceMonth': ''}
                save_status(user_id, key, 'done', result)
                save_file_hash(user_id, file_hash, key)
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

            # Save result and register hash
            save_status(user_id, key, 'done', result)
            save_file_hash(user_id, file_hash, key)
            if job_id:
                _save_job_result(user_id, job_id, result)

            print(f"Done: {len(result['expenses'])} expenses, total={result['totalAmount']}")

        except Exception as e:
            error_msg = str(e)
            print(f"Error processing record: {error_msg}")
            # Save error status
            try:
                save_status(user_id, key, 'error', {'error': error_msg})
            except Exception:
                pass
            # Re-raise to trigger SQS retry/DLQ
            raise


def _save_job_result(user_id, job_id, result):
    """Save by jobId for backward compatibility with check-status polling."""
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
