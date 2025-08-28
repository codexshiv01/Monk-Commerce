#!/bin/bash

# 🚀 Render Deployment Script for Coupon API
# This script helps prepare your application for deployment

echo "🚀 Preparing Coupon API for Render Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Error: Failed to install dependencies."
    exit 1
fi

# Run tests to ensure everything works
echo "🧪 Running tests..."
npm test

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Some tests failed. You may want to fix them before deploying."
    read -p "Do you want to continue with deployment? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled."
        exit 1
    fi
fi

# Check if .env file exists
if [ -f ".env" ]; then
    echo "⚠️  Found .env file. Make sure to set these environment variables in Render:"
    echo "📝 Environment variables from .env:"
    grep -v '^#' .env | grep -v '^$' | while IFS= read -r line; do
        echo "   $line"
    done
    echo ""
fi

# Check if Git is initialized
if [ ! -d ".git" ]; then
    echo "📁 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Coupon API ready for deployment"
    echo "✅ Git repository initialized."
    echo "🔗 Don't forget to add your remote origin:"
    echo "   git remote add origin https://github.com/yourusername/coupon-api.git"
    echo "   git push -u origin main"
else
    echo "✅ Git repository already exists."
    
    # Check for uncommitted changes
    if [ -n "$(git status --porcelain)" ]; then
        echo "📝 You have uncommitted changes. Committing them..."
        git add .
        git commit -m "Prepare for deployment - $(date)"
        echo "✅ Changes committed."
    fi
    
    # Push to remote if it exists
    if git remote | grep -q origin; then
        echo "🚀 Pushing to remote repository..."
        git push
        echo "✅ Code pushed to repository."
    else
        echo "🔗 No remote origin found. Add your GitHub repository:"
        echo "   git remote add origin https://github.com/yourusername/coupon-api.git"
        echo "   git push -u origin main"
    fi
fi

echo ""
echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. 🌐 Go to https://render.com and sign up/login"
echo "2. 🔗 Connect your GitHub repository"
echo "3. ⚙️  Set environment variables in Render dashboard:"
echo "   - NODE_ENV=production"
echo "   - DATABASE_URL=your_database_url"
echo "4. 🚀 Deploy your service"
echo ""
echo "📖 Check DEPLOYMENT_GUIDE.md for detailed instructions!"
echo ""
echo "🎯 Your API will be available at: https://your-app-name.onrender.com"

