#!/bin/bash
set -e
cd "$(dirname "$0")/.."

PROFILE="AWSAdministratorAccess-101134489565"
REGION="us-east-1"
STACK="kdmeusalario"

echo "🔨 [1/5] Build backend..."
sam build --template-file infra/template.yaml --build-dir infra/.aws-sam/build

echo "🚀 [2/5] Deploy backend..."
sam deploy --template-file infra/.aws-sam/build/template.yaml --stack-name $STACK --capabilities CAPABILITY_IAM --resolve-s3 --profile $PROFILE --region $REGION

echo "📋 Buscando outputs da stack..."
WEB_BUCKET=$(aws cloudformation describe-stacks --stack-name $STACK --profile $PROFILE --region $REGION --query "Stacks[0].Outputs[?OutputKey=='WebBucketName'].OutputValue" --output text)
WEBSITE_URL=$(aws cloudformation describe-stacks --stack-name $STACK --profile $PROFILE --region $REGION --query "Stacks[0].Outputs[?OutputKey=='WebsiteUrl'].OutputValue" --output text)
API_URL=$(aws cloudformation describe-stacks --stack-name $STACK --profile $PROFILE --region $REGION --query "Stacks[0].Outputs[?OutputKey=='ApiUrl'].OutputValue" --output text)
POOL_ID=$(aws cloudformation describe-stacks --stack-name $STACK --profile $PROFILE --region $REGION --query "Stacks[0].Outputs[?OutputKey=='UserPoolId'].OutputValue" --output text)
CLIENT_ID=$(aws cloudformation describe-stacks --stack-name $STACK --profile $PROFILE --region $REGION --query "Stacks[0].Outputs[?OutputKey=='UserPoolClientId'].OutputValue" --output text)

# Extract CloudFront domain and find distribution ID
CF_DOMAIN=$(echo $WEBSITE_URL | sed 's|https://||')
CF_DIST=$(aws cloudfront list-distributions --profile $PROFILE --query "DistributionList.Items[?DomainName=='$CF_DOMAIN'].Id" --output text)

echo "📝 Atualizando .env..."
cat > .env << EOF
VITE_API_URL=$API_URL
VITE_COGNITO_USER_POOL_ID=$POOL_ID
VITE_COGNITO_CLIENT_ID=$CLIENT_ID
EOF

echo "📦 [3/5] Build frontend..."
npm run build

echo "☁️  [4/5] Upload frontend..."
aws s3 sync dist/ s3://$WEB_BUCKET --delete --profile $PROFILE

echo "🔄 [5/5] Invalidar cache CloudFront..."
aws cloudfront create-invalidation --distribution-id $CF_DIST --paths "/*" --profile $PROFILE > /dev/null

echo ""
echo "✅ Deploy completo!"
echo "🌐 $WEBSITE_URL"
