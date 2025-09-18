#!/bin/bash

echo "🚀 Deploying frontend fixes to Vercel..."

# Navigate to frontend directory
cd /Users/akarshrajput/Documents/innexora/frontend

# Check if there are uncommitted changes
if [[ -n $(git status --porcelain) ]]; then
    echo "📝 Committing changes..."
    git add .
    git commit -m "Fix WebSocket URLs and mixed content issues

- Add environment variable support for WebSocket connections
- Fix guest client to use same backend URL for all requests
- Remove tenant-specific URL construction that caused mixed content errors
- Add proper subdomain detection via headers for guest API calls"
else
    echo "✅ No uncommitted changes found"
fi

# Push to trigger Vercel deployment
echo "📤 Pushing to trigger Vercel deployment..."
git push origin main

echo "✅ Frontend fixes deployed!"
echo "🔗 Check your Vercel dashboard for deployment status"
echo "📋 Changes made:"
echo "  ✅ Fixed WebSocket URLs to use Azure backend"
echo "  ✅ Fixed guest client mixed content issues" 
echo "  ✅ Added proper subdomain detection for public pages"