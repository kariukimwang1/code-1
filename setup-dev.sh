#!/bin/bash

# CryptoMining Platform - Development Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up CryptoMining Platform for development..."

# Check Node.js version
echo "📋 Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18.0.0 or higher."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18.0.0 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v) found"

# Check npm version
echo "📋 Checking npm version..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env.local
    echo "⚠️  Please edit .env.local with your configuration"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p .next
mkdir -p logs

# Check if PostgreSQL connection is configured
echo "🗄️  Checking database configuration..."
if grep -q "your-database-connection-string" .env.local 2>/dev/null; then
    echo "⚠️  Please configure your database connection in .env.local"
    echo "   You can use Neon (https://neon.tech/) for a free PostgreSQL database"
else
    echo "✅ Database configuration found"
fi

# Check JWT secrets
if grep -q "your-super-secret" .env.local 2>/dev/null; then
    echo "⚠️  Please update JWT_SECRET and NEXTAUTH_SECRET in .env.local"
fi

# Run type check
echo "🔍 Running type check..."
npm run type-check || echo "⚠️  Type check failed. Please fix TypeScript errors."

# Final setup
echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.local with your configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo "4. Visit http://localhost:3000/admin for the admin dashboard"
echo ""
echo "Available commands:"
echo "- npm run dev          # Start development server"
echo "- npm run build        # Build for production"
echo "- npm run type-check   # Run TypeScript check"
echo "- npm run lint         # Run ESLint"
echo "- npm run clean        # Clean and reinstall"
echo ""
echo "📚 For more information, see README.md and SETUP.md"
echo ""
echo "Happy Development! 🚀"