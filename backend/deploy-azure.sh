#!/bin/bash

# Azure Deployment Script for Innexora Backend
# Run this script to deploy your backend to Microsoft Azure

echo "🚀 Starting Azure Deployment for Innexora Backend..."

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the backend directory."
    exit 1
fi

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first:"
    echo "   brew install azure-cli"
    exit 1
fi

# Check if user is logged in to Azure
if ! az account show &> /dev/null; then
    echo "📋 Please login to Azure first..."
    az login
fi

# Variables (customize these)
RESOURCE_GROUP="innexora-backend-rg"
APP_SERVICE_PLAN="innexora-backend-plan"
WEB_APP_NAME="innexora-backend-api"
LOCATION="East US"

echo "📋 Deployment Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  App Service Plan: $APP_SERVICE_PLAN"
echo "  Web App Name: $WEB_APP_NAME"
echo "  Location: $LOCATION"

# Create resource group
echo "🏗️  Creating resource group..."
az group create --name $RESOURCE_GROUP --location "$LOCATION"

# Create App Service plan
echo "🏗️  Creating App Service plan..."
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

# Create web app
echo "🏗️  Creating web app..."
az webapp create \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --name $WEB_APP_NAME \
  --runtime "NODE|18-lts" \
  --deployment-local-git

# Configure app settings
echo "⚙️  Configuring app settings..."
az webapp config appsettings set \
  --resource-group $RESOURCE_GROUP \
  --name $WEB_APP_NAME \
  --settings \
    WEBSITE_NODE_DEFAULT_VERSION="18.x" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true"

# Set startup command
echo "⚙️  Setting startup command..."
az webapp config set \
  --resource-group $RESOURCE_GROUP \
  --name $WEB_APP_NAME \
  --startup-file "npm start"

# Configure CORS
echo "🌐 Configuring CORS..."
az webapp cors add \
  --resource-group $RESOURCE_GROUP \
  --name $WEB_APP_NAME \
  --allowed-origins "https://innexora.app" "https://*.innexora.app"

# Enable logging
echo "📊 Enabling logging..."
az webapp log config \
  --resource-group $RESOURCE_GROUP \
  --name $WEB_APP_NAME \
  --application-logging filesystem \
  --level information

# Get deployment URL
DEPLOYMENT_URL=$(az webapp show \
  --resource-group $RESOURCE_GROUP \
  --name $WEB_APP_NAME \
  --query "defaultHostName" \
  --output tsv)

echo ""
echo "✅ Azure infrastructure created successfully!"
echo ""
echo "🔗 Your backend will be available at:"
echo "   https://$DEPLOYMENT_URL"
echo ""
echo "📋 Next Steps:"
echo "1. Configure environment variables in Azure portal:"
echo "   - NODE_ENV=production"
echo "   - MONGODB_URI=your_mongodb_connection_string"
echo "   - MONGODB_TENANT_URI=your_tenant_mongodb_connection_string"
echo "   - JWT_SECRET=your_jwt_secret"
echo "   - FRONTEND_URL=https://innexora.app"
echo ""
echo "2. Deploy your code using Git:"
echo "   git remote add azure https://$WEB_APP_NAME.scm.azurewebsites.net:443/$WEB_APP_NAME.git"
echo "   git push azure main"
echo ""
echo "3. Update your frontend environment variable:"
echo "   NEXT_PUBLIC_API_URL=https://$DEPLOYMENT_URL/api"
echo ""
echo "📖 For detailed instructions, see AZURE_DEPLOYMENT_GUIDE.md"