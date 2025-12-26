#!/bin/bash

# Fix Vercel environment variables
# This script removes and re-adds the Alpaca credentials to fix any encoding issues

echo "🔧 Fixing Vercel Environment Variables"
echo ""

# Remove old variables
echo "Removing old ALPACA_API_KEY..."
echo "production" | npx vercel env rm ALPACA_API_KEY

echo "Removing old ALPACA_SECRET_KEY..."
echo "production" | npx vercel env rm ALPACA_SECRET_KEY

echo "Removing old ALPACA_BASE_URL..."
echo "production" | npx vercel env rm ALPACA_BASE_URL

echo ""
echo "✅ Old variables removed"
echo ""

# Read from .env.local
if [ -f .env.local ]; then
  echo "📖 Reading credentials from .env.local..."
  source .env.local
  
  # Add new variables (properly trimmed)
  echo "Adding ALPACA_API_KEY..."
  echo "$ALPACA_API_KEY" | npx vercel env add ALPACA_API_KEY production
  
  echo "Adding ALPACA_SECRET_KEY..."
  echo "$ALPACA_SECRET_KEY" | npx vercel env add ALPACA_SECRET_KEY production
  
  echo "Adding ALPACA_BASE_URL..."
  echo "$ALPACA_BASE_URL" | npx vercel env add ALPACA_BASE_URL production
  
  echo ""
  echo "✅ Environment variables updated!"
  echo ""
  echo "🚀 Now redeploy with: npx vercel --prod"
else
  echo "❌ .env.local not found!"
  echo "Please create .env.local with your Alpaca credentials"
  exit 1
fi

