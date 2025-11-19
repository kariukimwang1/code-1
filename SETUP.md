# Local Development Setup Guide

This guide provides multiple ways to set up the CryptoMining Platform for local development.

## 🚀 Quick Setup Options

### Option 1: Docker Development (Recommended)
The easiest way to get started with all dependencies pre-configured.

```bash
# Clone and navigate to the project
git clone <repository-url>
cd miner-dapp

# Start development environment
npm run docker:dev

# The application will be available at:
# - Main app: http://localhost:3000
# - Database admin: http://localhost:8080
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
```

### Option 2: Local Node.js Setup
For development directly on your machine.

#### Prerequisites
- Node.js 18.0.0 or higher
- npm 8.0.0 or higher
- PostgreSQL 13+ (or use Neon cloud database)
- Git

#### Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set Up Database**

   **Option A: Local PostgreSQL**
   ```bash
   # Create database
   createdb miner_dapp

   # Import schema (if schema file exists)
   psql -d miner_dapp < database/schema.sql
   ```

   **Option B: Neon Cloud Database**
   - Sign up at [neon.tech](https://neon.tech)
   - Create a new project
   - Copy the connection string
   - Add to `.env.local`

3. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration:
   ```env
   # Database
   NEON_POSTGRES_URL=postgresql://username:password@host:port/database

   # Authentication
   JWT_SECRET=your-super-secret-jwt-key
   NEXTAUTH_SECRET=your-nextauth-secret
   NEXTAUTH_URL=http://localhost:3000
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🐳 Docker Development

### Development Environment
```bash
# Start all services (app, database, redis, adminer)
npm run docker:dev

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop services
npm run docker:dev-down

# Clean everything (removes volumes)
npm run docker:dev-clean
```

### Production Environment
```bash
# Build and run production containers
npm run docker:prod

# Stop production services
npm run docker:prod-down
```

### Docker Services
- **app**: Next.js application on port 3000
- **postgres**: PostgreSQL database on port 5432
- **redis**: Redis cache on port 6379
- **adminer**: Database admin tool on port 8080

## 🛠 Available Commands

### Development
```bash
npm run dev          # Start Next.js development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
```

### Maintenance
```bash
npm run clean        # Clean node_modules and reinstall
npm run setup:local  # Clean setup for local development
```

### Docker
```bash
npm run docker:dev         # Start development environment
npm run docker:dev-down    # Stop development environment
npm run docker:dev-clean   # Clean development environment
npm run docker:prod        # Start production environment
npm run docker:prod-down   # Stop production environment
```

## 🔧 Environment Configuration

### Required Environment Variables

```env
# Database
NEON_POSTGRES_URL=postgresql://username:password@host:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Application
NODE_ENV=development
PORT=3000
```

### Optional Environment Variables

```env
# Blockchain (for crypto features)
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/your-key
PRIVATE_KEY=your-wallet-private-key

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your-stripe-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key

# Thirdweb
THIRDWEB_CLIENT_ID=your-thirdweb-client-id

# Redis (for caching)
REDIS_URL=redis://localhost:6379

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## 🗄 Database Setup

### Using Neon Cloud (Recommended for Development)

1. **Sign up**: [Neon Console](https://neon.tech/console)
2. **Create Project**: Click "New Project"
3. **Get Connection String**: Dashboard → Connect → Copy connection string
4. **Add to Environment**: Put in `.env.local` as `NEON_POSTGRES_URL`

### Using Local PostgreSQL

```bash
# Install PostgreSQL
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql postgresql-contrib
# Windows: Download from postgresql.org

# Start PostgreSQL service
# macOS: brew services start postgresql
# Ubuntu: sudo systemctl start postgresql
# Windows: Start from Services

# Create database user and database
sudo -u postgres createuser --interactive
sudo -u postgres createdb miner_dapp
```

## 🔍 Troubleshooting

### Docker Issues

**Problem**: `Port 3000 is already in use`
```bash
# Check what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.dev.yml
```

**Problem**: `Database connection failed`
```bash
# Check if database is running
docker-compose -f docker-compose.dev.yml ps postgres

# Restart database
docker-compose -f docker-compose.dev.yml restart postgres
```

### Local Development Issues

**Problem**: `npm install` fails
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

**Problem**: Type errors during build
```bash
# Run type check to see specific errors
npm run type-check

# Fix TypeScript errors in your IDE
# Then try building again
```

**Problem**: Database connection issues
```bash
# Check environment variables
cat .env.local

# Test database connection
psql $NEON_POSTGRES_URL
```

## 🌐 Accessing Services

Once running, you can access:

- **Main Application**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin
- **Database Admin**: http://localhost:8080 (if using Docker)
- **API Documentation**: http://localhost:3000/api

## 🧪 Testing the Setup

1. **Visit the application**: Open http://localhost:3000
2. **Check admin panel**: Navigate to http://localhost:3000/admin
3. **Test API endpoints**:
   ```bash
   curl http://localhost:3000/api/health
   ```
4. **Check database connection** (if using Docker Adminer):
   - Open http://localhost:8080
   - Server: postgres
   - Username: postgres
   - Password: password
   - Database: miner_dapp

## 📚 Next Steps

After successful setup:

1. **Explore the admin dashboard** at `/admin`
2. **Configure additional services** (Stripe, Thirdweb, etc.)
3. **Review the API documentation** in the `/app/api` directory
4. **Customize the application** for your needs

## 🆘 Getting Help

If you encounter issues:

1. Check this setup guide
2. Review the main README.md
3. Check the application logs
4. Review GitHub issues
5. Contact the development team

---

**Happy Development! 🚀**