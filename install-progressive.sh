#!/bin/bash

# Progressive Installation Script for CryptoMining Platform
# This script installs dependencies in stages to avoid timeout issues

set -e

echo "🚀 Progressive Installation for CryptoMining Platform"
echo "=================================================="

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f1 | sed 's/v//')
echo "📋 Node.js version: $NODE_VERSION"

if [ -z "$NODE_VERSION" ] || [ "${NODE_VERSION%%.*}" -lt 18 ]; then
    echo "❌ Node.js 18+ required. Found: $NODE_VERSION"
    exit 1
fi

# Clean previous installation
echo "🧹 Cleaning previous installation..."
rm -rf node_modules .next package-lock.json

# Stage 1: Essential Next.js packages
echo "📦 Stage 1: Installing essential Next.js packages..."
npm install next@^14.2.0 react@^18.2.0 react-dom@^18.2.0 typescript@^5.0.0

# Stage 2: Type definitions
echo "📦 Stage 2: Installing type definitions..."
npm install -D @types/node@^22.0.0 @types/react@^18.2.0 @types/react-dom@^18.2.0

# Stage 3: Tailwind CSS
echo "📦 Stage 3: Installing Tailwind CSS..."
npm install -D tailwindcss@^3.3.0 postcss@^8.5.0 autoprefixer@^10.4.20

# Stage 4: ESLint
echo "📦 Stage 4: Installing ESLint..."
npm install -D eslint@^8.0.0 eslint-config-next@^14.2.0

# Stage 5: Core utilities
echo "📦 Stage 5: Installing core utilities..."
npm install clsx@^2.1.1 class-variance-authority@^0.7.1 lucide-react@^0.454.0

# Stage 6: Form handling
echo "📦 Stage 6: Installing form handling..."
npm install react-hook-form@^7.60.0 @hookform/resolvers@^3.10.0 zod@^3.25.76

# Stage 7: UI components (Radix UI)
echo "📦 Stage 7: Installing Radix UI components..."
npm install @radix-ui/react-dialog@^1.1.4 @radix-ui/react-dropdown-menu@^2.1.4 @radix-ui/react-tabs@^1.1.1 @radix-ui/react-toast@^1.2.4

# Stage 8: Charts and data
echo "📦 Stage 8: Installing charts and data libraries..."
npm install recharts@^2.8.0 swr@^2.2.0 date-fns@^4.1.0

# Stage 9: Backend dependencies
echo "📦 Stage 9: Installing backend dependencies..."
npm install bcryptjs@^2.4.3 jsonwebtoken@^9.0.2 pg@^8.11.0 dotenv@^16.3.1

# Stage 10: Additional types
echo "📦 Stage 10: Installing additional type definitions..."
npm install -D @types/bcryptjs@^2.4.0 @types/jsonwebtoken@^9.0.0 @types/pg@^8.10.0

# Stage 11: Additional utilities
echo "📦 Stage 11: Installing additional utilities..."
npm install sonner@^1.7.4 tailwind-merge@^2.5.5 tailwindcss-animate@^1.0.7

echo "✅ Installation completed successfully!"
echo ""
echo "🧪 Running verification test..."
node quick-test.js

echo ""
echo "🎉 Ready for development!"
echo ""
echo "Next steps:"
echo "1. Configure .env.local: cp .env.example .env.local"
echo "2. Start development server: npm run dev"
echo "3. Open http://localhost:3000"
echo "4. Visit admin: http://localhost:3000/admin"