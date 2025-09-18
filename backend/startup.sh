#!/bin/bash

# Azure App Service startup script for Node.js application
echo "🚀 Starting Innexora Backend API..."

# Set NODE_ENV if not already set
export NODE_ENV=${NODE_ENV:-production}

# Set PORT for Azure App Service
export PORT=${PORT:-8080}

echo "📋 Environment Configuration:"
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"
echo "  Node Version: $(node --version)"
echo "  NPM Version: $(npm --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm ci --production
fi

# Start the application
echo "🎯 Starting application with: npm start"
exec npm start