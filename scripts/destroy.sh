#!/bin/bash
set -e
cd "$(dirname "$0")/.."

PROFILE="AWSAdministratorAccess-101134489565"
REGION="us-east-1"
STACK="kdmeusalario"

echo "⚠️  Isso vai deletar toda a infra do KDMeuSalario."
echo "   A tabela DynamoDB será PRESERVADA (DeletionPolicy: Retain)."
echo ""
read -p "Tem certeza? (s/N) " confirm
if [[ "$confirm" != "s" && "$confirm" != "S" ]]; then
  echo "Cancelado."
  exit 0
fi

echo "📋 Buscando buckets da stack..."
WEB_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK --profile $PROFILE --region $REGION --query "Stacks[0].Outputs[?OutputKey=='WebBucketName'].OutputValue" --output text 2>/dev/null || echo "")
INVOICE_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK --profile $PROFILE --region $REGION --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text 2>/dev/null || echo "")

echo "🗑️  [1/3] Esvaziando buckets S3..."
[ -n "$WEB_BUCKET" ] && aws s3 rm s3://$WEB_BUCKET --recursive --profile $PROFILE 2>/dev/null || true
[ -n "$INVOICE_BUCKET" ] && aws s3 rm s3://$INVOICE_BUCKET --recursive --profile $PROFILE 2>/dev/null || true

echo "💥 [2/3] Deletando stack CloudFormation..."
sam delete --stack-name $STACK --profile $PROFILE --region $REGION --no-prompts

echo "🧹 [3/3] Limpando build local..."
rm -rf infra/.aws-sam/build dist

echo "✅ Infra removida. Tabela DynamoDB '$STACK-user-data' foi preservada."
