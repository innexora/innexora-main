#!/bin/bash

# Vercel Deployment Script for Hotel SaaS Frontend
# Run this script to deploy to Vercel with proper configuration

echo "🚀 Starting Vercel Deployment for Hotel SaaS Frontend..."

# Check if we're in the frontend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the frontend directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Creating from example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "📝 Please edit .env.local with your actual backend URL:"
        echo "   NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api"
        read -p "Press Enter after updating .env.local to continue..."
    else
        echo "❌ Error: .env.example not found. Please create .env.local manually."
        exit 1
    fi
fi

# Build the project locally to check for errors
echo "🔨 Building project locally to check for errors..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix the errors before deploying."
    exit 1
fi

echo "✅ Local build successful!"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Next Steps:"
echo "1. Add your custom domain in Vercel dashboard"
echo "2. Configure DNS for subdomain support:"
echo "   - A record: @ → 76.76.19.61"
echo "   - CNAME: * → cname.vercel-dns.com"
echo "3. Set environment variables in Vercel:"
echo "   - NEXT_PUBLIC_API_URL"
echo "   - NEXT_TELEMETRY_DISABLED"
echo ""
echo "🌐 Test URLs (after domain setup):"
echo "   - Main: https://yourdomain.com"
echo "   - Paradise: https://paradise.yourdomain.com"
echo "   - Marvel: https://marvel.yourdomain.com"
echo "   - Demo: https://demo.yourdomain.com"
echo ""
echo "📖 For detailed instructions, see VERCEL_DEPLOYMENT_GUIDE.md"