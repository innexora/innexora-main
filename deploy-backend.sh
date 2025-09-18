#!/bin/bash

echo "🚀 Starting backend deployment to Azure..."

# Navigate to project root
cd /Users/akarshrajput/Documents/innexora

# Check if there are uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Committing changes..."
    git add .
    echo "Enter commit message:"
    read commit_message
    git commit -m "$commit_message"
else
    echo "✅ No uncommitted changes found"
fi

# Navigate to backend
cd backend

echo "📦 Creating deployment package..."
# Remove old zip if exists
rm -f ../backend-deploy.zip

# Create new deployment zip
zip -r ../backend-deploy.zip . -x "node_modules/*" ".git/*" "*.log" "*.env"

echo "🌐 Deploying to Azure..."
# Deploy to Azure
az webapp deploy --resource-group innexora-backend-rg --name innexora-backend-api --src-path ../backend-deploy.zip --type zip

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔗 Your backend is live at: http://innexora-backend-api.azurewebsites.net"
    
    # Clean up
    rm -f ../backend-deploy.zip
    
    echo "🧪 Testing API endpoint..."
    curl -s http://innexora-backend-api.azurewebsites.net/api/auth/test | head -1
    echo ""
    echo "✨ Deployment complete!"
else
    echo "❌ Deployment failed!"
    exit 1
fi