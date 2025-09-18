# Azure Deployment Guide for Hotel SaaS Backend

## 🎯 Overview

This guide will help you deploy your Node.js/Express hotel SaaS backend to Microsoft Azure App Service. Your app will be accessible via a custom URL that you can use in your frontend.

## 📋 **Your Application Analysis:**

- **Framework:** Node.js + Express.js
- **Database:** MongoDB (Multi-tenant with shared cluster)
- **Features:** WebSocket support, Multi-tenant middleware, JWT auth
- **Dependencies:** 15 production dependencies
- **Entry Point:** `server.js`
- **Port:** 5050 (development) / 8080 (Azure)

## 🔧 **Required Environment Variables:**

```env
NODE_ENV=production
PORT=8080
MONGODB_URI=your_main_mongodb_connection_string
MONGODB_TENANT_URI=your_tenant_mongodb_connection_string  
JWT_SECRET=your_jwt_secret_key
FRONTEND_URL=https://innexora.app
```

## 🚀 **Step-by-Step Deployment**

### **Step 1: Install Azure CLI**

```bash
# macOS
brew install azure-cli

# Verify installation
az --version
```

### **Step 2: Login to Azure**

```bash
az login
```

### **Step 3: Create Resource Group**

```bash
az group create \
  --name innexora-backend-rg \
  --location "East US"
```

### **Step 4: Create App Service Plan**

```bash
# Create Linux App Service plan (recommended for Node.js)
az appservice plan create \
  --name innexora-backend-plan \
  --resource-group innexora-backend-rg \
  --sku B1 \
  --is-linux
```

### **Step 5: Create Web App**

```bash
# Create the web app with Node.js runtime
az webapp create \
  --resource-group innexora-backend-rg \
  --plan innexora-backend-plan \
  --name innexora-backend-api \
  --runtime "NODE|18-lts" \
  --deployment-local-git
```

**Note:** Replace `innexora-backend-api` with your preferred app name (must be globally unique).

### **Step 6: Configure Application Settings**

```bash
# Set Node.js version and startup file
az webapp config appsettings set \
  --resource-group innexora-backend-rg \
  --name innexora-backend-api \
  --settings \
    WEBSITE_NODE_DEFAULT_VERSION="18.x" \
    SCM_DO_BUILD_DURING_DEPLOYMENT="true"

# Set startup command
az webapp config set \
  --resource-group innexora-backend-rg \
  --name innexora-backend-api \
  --startup-file "npm start"
```

### **Step 7: Configure Environment Variables**

```bash
# Configure your environment variables
az webapp config appsettings set \
  --resource-group innexora-backend-rg \
  --name innexora-backend-api \
  --settings \
    NODE_ENV="production" \
    PORT="8080" \
    MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/innexora-main" \
    MONGODB_TENANT_URI="mongodb+srv://username:password@cluster.mongodb.net/" \
    JWT_SECRET="your-super-secret-jwt-key" \
    FRONTEND_URL="https://innexora.app"
```

**Important:** Replace the MongoDB URIs and JWT secret with your actual values.

### **Step 8: Deploy Your Code**

#### **Option A: Git Deployment (Recommended)**

```bash
# Navigate to your backend directory
cd /Users/akarshrajput/Documents/innexora/backend

# Add Azure remote
az webapp deployment source config-local-git \
  --name innexora-backend-api \
  --resource-group innexora-backend-rg

# Get deployment credentials
az webapp deployment list-publishing-credentials \
  --name innexora-backend-api \
  --resource-group innexora-backend-rg

# Add Azure remote (use the Git URL from above command)
git remote add azure https://<username>@innexora-backend-api.scm.azurewebsites.net:443/innexora-backend-api.git

# Deploy
git add .
git commit -m "Azure deployment"
git push azure main
```

#### **Option B: ZIP Deployment**

```bash
# Create deployment package
zip -r backend-deploy.zip . -x "node_modules/*" ".git/*" "*.log" ".env*"

# Deploy ZIP file
az webapp deployment source config-zip \
  --resource-group innexora-backend-rg \
  --name innexora-backend-api \
  --src backend-deploy.zip
```

### **Step 9: Configure CORS for Your Frontend**

```bash
# Allow your frontend domain
az webapp cors add \
  --resource-group innexora-backend-rg \
  --name innexora-backend-api \
  --allowed-origins "https://innexora.app" "https://*.innexora.app"
```

### **Step 10: Enable Logging**

```bash
# Enable application logging
az webapp log config \
  --resource-group innexora-backend-rg \
  --name innexora-backend-api \
  --application-logging filesystem \
  --level information

# Enable HTTP logging
az webapp log config \
  --resource-group innexora-backend-rg \
  --name innexora-backend-api \
  --web-server-logging filesystem
```

## 🌐 **Your Backend URL**

After deployment, your backend will be available at:
```
https://innexora-backend-api.azurewebsites.net
```

## 🔗 **Update Your Frontend**

Update your frontend environment variable:

```bash
# In your frontend .env file
NEXT_PUBLIC_API_URL=https://innexora-backend-api.azurewebsites.net/api
```

Then redeploy your frontend to Vercel.

## 📊 **Monitor Your Deployment**

```bash
# Check application logs
az webapp log tail \
  --resource-group innexora-backend-rg \
  --name innexora-backend-api

# Check app status
az webapp show \
  --resource-group innexora-backend-rg \
  --name innexora-backend-api \
  --query "state"
```

## 🧪 **Test Your Deployment**

```bash
# Test health endpoint
curl https://innexora-backend-api.azurewebsites.net/health

# Test API
curl https://innexora-backend-api.azurewebsites.net/api/hotel/check-subdomain/demo
```

## 🔧 **Troubleshooting**

### **Common Issues:**

1. **App not starting:**
   ```bash
   # Check logs
   az webapp log tail --resource-group innexora-backend-rg --name innexora-backend-api
   ```

2. **Database connection issues:**
   - Verify MongoDB connection strings
   - Check if MongoDB Atlas allows Azure IP ranges
   - Test connection locally first

3. **CORS errors:**
   ```bash
   # Add more origins if needed
   az webapp cors add --resource-group innexora-backend-rg --name innexora-backend-api --allowed-origins "https://yourdomain.com"
   ```

4. **Environment variables not working:**
   ```bash
   # List current settings
   az webapp config appsettings list --resource-group innexora-backend-rg --name innexora-backend-api
   ```

## 🎯 **Custom Domain (Optional)**

If you want a custom domain like `api.innexora.app`:

```bash
# Add custom domain
az webapp config hostname add \
  --resource-group innexora-backend-rg \
  --webapp-name innexora-backend-api \
  --hostname "api.innexora.app"

# Configure SSL
az webapp config ssl bind \
  --resource-group innexora-backend-rg \
  --name innexora-backend-api \
  --certificate-thumbprint <thumbprint> \
  --ssl-type SNI
```

## 💰 **Cost Optimization**

- **B1 tier:** ~$13/month (recommended for production)
- **F1 tier:** Free (limited, good for testing)
- **S1 tier:** ~$74/month (better performance)

## 📈 **Scaling Options**

```bash
# Scale up (better hardware)
az appservice plan update \
  --name innexora-backend-plan \
  --resource-group innexora-backend-rg \
  --sku S1

# Scale out (more instances)
az webapp config appsettings set \
  --resource-group innexora-backend-rg \
  --name innexora-backend-api \
  --settings WEBSITE_INSTANCE_COUNT="2"
```

## ✅ **Final Steps**

1. **Test all endpoints** with your Azure URL
2. **Update frontend** with new API URL
3. **Monitor logs** for any issues
4. **Set up alerts** for downtime/errors

Your backend will be fully functional and ready to handle all your hotel subdomains! 🎉

## 🔄 **Continuous Deployment**

For future updates, just push to your Git repository:

```bash
git add .
git commit -m "Update backend"
git push azure main
```

Your Azure App Service will automatically rebuild and deploy the changes.