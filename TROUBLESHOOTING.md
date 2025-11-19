# CryptoMining Platform - Troubleshooting Guide

This comprehensive guide helps you resolve common issues when setting up and running the CryptoMining Platform locally.

## 🚀 Quick Diagnosis

First, run the environment test:
```bash
node quick-test.js
```

This will identify most setup issues automatically.

---

## 📦 Installation Issues

### Problem: `npm install` fails or takes too long

#### Solutions:

1. **Clean Installation**
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Progressive Installation**
   ```bash
   ./install-progressive.sh
   ```

3. **Use Legacy Peer Dependencies**
   ```bash
   npm install --legacy-peer-deps
   ```

4. **Install Minimal Packages First**
   ```bash
   npm install next react react-dom typescript
   npm run dev  # Test if basic setup works
   ```

### Problem: Permission Errors

```bash
# Clear npm cache with sudo
sudo npm cache clean --force

# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) node_modules

# Or use nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### Problem: Network Timeouts

```bash
# Increase npm timeout
npm config set timeout 60000

# Use different registry
npm config set registry https://registry.npmjs.org/

# Install one package at a time
npm install next
npm install react
npm install react-dom
# ... continue with other packages
```

---

## 🔧 Development Server Issues

### Problem: `npm run dev` fails to start

#### Common Solutions:

1. **Check Port Availability**
   ```bash
   # Check what's using port 3000
   lsof -i :3000

   # Kill the process
   kill -9 <PID>

   # Or use different port
   PORT=3001 npm run dev
   ```

2. **Check Node.js Version**
   ```bash
   node -v  # Should be 18.0.0 or higher

   # If too old, update with nvm
   nvm install 18
   nvm use 18
   ```

3. **Check Environment Variables**
   ```bash
   # Verify .env.local exists
   ls -la .env.local

   # Check for syntax errors
   node -e "require('dotenv').config(); console.log('Environment loaded successfully')"
   ```

4. **Check File Permissions**
   ```bash
   # Make sure scripts are executable
   chmod +x setup-dev.sh
   chmod +x install-progressive.sh
   chmod +x quick-test.js
   ```

### Problem: Next.js Configuration Errors

#### "Invalid next.config.mjs options detected"

**Solution**: The `appDir` option is deprecated in Next.js 14.

Update `next.config.mjs`:
```javascript
// Remove this line:
// appDir: true,

// Keep only:
experimental: {
  serverComponentsExternalPackages: ['pg'],
},
```

### Problem: TypeScript Compilation Errors

1. **Run Type Check Manually**
   ```bash
   npm run type-check
   ```

2. **Fix Common Issues**
   - Missing imports: Add proper import statements
   - Type errors: Add type annotations or use `any` temporarily
   - Missing modules: Install required packages

3. **Skip Type Errors (Development Only)**
   ```javascript
   // In next.config.mjs
   typescript: {
     ignoreBuildErrors: true,
   },
   ```

---

## 🗄 Database Issues

### Problem: Database Connection Failed

#### Solutions:

1. **Check Connection String**
   ```bash
   # Test connection
   node -e "
   const { Pool } = require('pg');
   const pool = new Pool({ connectionString: process.env.NEON_POSTGRES_URL });
   pool.query('SELECT NOW()').then(console.log).catch(console.error);
   "
   ```

2. **Use Neon Cloud (Recommended)**
   - Go to [neon.tech](https://neon.tech)
   - Create free account and database
   - Copy connection string to `.env.local`

3. **Local PostgreSQL Setup**
   ```bash
   # Install PostgreSQL
   # macOS: brew install postgresql
   # Ubuntu: sudo apt-get install postgresql postgresql-contrib

   # Start service
   brew services start postgresql  # macOS
   sudo systemctl start postgresql  # Linux

   # Create database
   createdb miner_dapp
   ```

4. **Mock Database for Testing**
   Add to `.env.local`:
   ```env
   NEON_POSTGRES_URL=postgresql://mock:mock@localhost:5432/mock
   ```

### Problem: "Connection refused" Error

```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql  # macOS
sudo systemctl start postgresql  # Linux

# Check port
netstat -an | grep 5432
```

---

## 🔐 Authentication Issues

### Problem: JWT Secrets Not Set

**Solution**: Add to `.env.local`:
```env
JWT_SECRET=dev-jwt-secret-key-change-in-production-32chars
NEXTAUTH_SECRET=dev-nextauth-secret-key-change-in-production
```

Generate secure secrets:
```bash
openssl rand -base64 32
```

### Problem: Authentication Not Working

1. **Check Environment Variables**
   ```bash
   grep -E "(JWT_SECRET|NEXTAUTH_SECRET)" .env.local
   ```

2. **Clear Browser Data**
   - Clear cookies and localStorage
   - Open in incognito mode

3. **Check API Endpoints**
   ```bash
   curl http://localhost:3000/api/health
   ```

---

## 🎨 UI and Styling Issues

### Problem: Tailwind CSS Not Working

1. **Check Configuration Files**
   ```bash
   ls -la tailwind.config.ts postcss.config.mjs
   ```

2. **Verify Tailwind Classes**
   ```bash
   # Check if Tailwind is processing
   npm run build
   ```

3. **Restart Development Server**
   ```bash
   npm run dev
   ```

### Problem: Radix UI Components Not Working

```bash
# Verify Radix UI packages are installed
npm list @radix-ui

# If missing, install:
npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-dropdown-menu
```

### Problem: Recharts Not Working

```bash
# Install Recharts if missing
npm install recharts

# Check if it's installed
npm list recharts
```

---

## 🔧 General Development Issues

### Problem: Hot Reload Not Working

1. **Check File Watching**
   ```bash
   # On Linux/macOS, check if file watching works
   echo "test" > test.txt && ls test.txt
   rm test.txt
   ```

2. **Increase Watchers**
   ```bash
   # Linux
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

3. **Clear Build Cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

### Problem: Memory Issues

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Check memory usage
npm run dev &
top -p $!
```

### Problem: ESLint Errors

1. **Install ESLint**
   ```bash
   npm install -D eslint eslint-config-next
   ```

2. **Create ESLint Config**
   ```json
   {
     "extends": ["next/core-web-vitals"]
   }
   ```

3. **Run Lint Fix**
   ```bash
   npm run lint -- --fix
   ```

---

## 🐳 Docker Issues

### Problem: Docker Build Fails

1. **Install Docker**
   - [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Docker Engine for Linux

2. **Check Docker Version**
   ```bash
   docker --version
   docker-compose --version
   ```

3. **Clean Docker Cache**
   ```bash
   docker system prune -a
   ```

### Problem: Port Already in Use

```bash
# Check what's using the ports
docker-compose -f docker-compose.dev.yml ps

# Stop containers
docker-compose -f docker-compose.dev.yml down

# Kill stuck containers
docker kill $(docker ps -q)
```

### Problem: Database Connection in Docker

1. **Check Database Container**
   ```bash
   docker-compose -f docker-compose.dev.yml logs postgres
   ```

2. **Wait for Database**
   ```bash
   # Add health check to docker-compose.dev.yml
   healthcheck:
     test: ["CMD-SHELL", "pg_isready -U postgres"]
     interval: 10s
     timeout: 5s
     retries: 5
   ```

---

## 🧪 Testing and Debugging

### Running Tests

```bash
# Environment test
node quick-test.js

# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

### Debug Mode

1. **Enable Debug Logging**
   ```bash
   DEBUG=* npm run dev
   ```

2. **Check Network Requests**
   - Open browser DevTools
   - Check Network tab
   - Look for failed requests

3. **Check Console Logs**
   - Browser console for client-side errors
   - Terminal for server-side errors

### Common Debug Commands

```bash
# Check environment variables
node -e "require('dotenv').config(); console.log(process.env)"

# Test database connection
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.NEON_POSTGRES_URL });
pool.connect().then(() => console.log('DB OK')).catch(console.error);
"

# Test TypeScript compilation
npx tsc --noEmit
```

---

## 📱 Performance Issues

### Slow Development Server

1. **Optimize Imports**
   - Remove unused imports
   - Use dynamic imports for large libraries

2. **Use Less Source Maps**
   ```javascript
   // In next.config.mjs
   webpack: (config, { dev }) => {
     if (dev) {
       config.devtool = 'eval-cheap-module-source-map';
     }
     return config;
   }
   ```

3. **Increase Build Memory**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm run dev
   ```

---

## 🆘 Getting Help

### Self-Help Checklist

1. ✅ Run `node quick-test.js`
2. ✅ Check this troubleshooting guide
3. ✅ Search existing GitHub issues
4. ✅ Check the console for specific error messages

### Report an Issue

When reporting an issue, include:

1. **Environment Information**
   ```bash
   node -v
   npm -v
   OS info
   ```

2. **Error Messages**
   - Full error stack trace
   - Browser console errors
   - Terminal output

3. **Steps to Reproduce**
   - What you did
   - What you expected
   - What actually happened

### Community Support

- GitHub Issues
- Discord/Slack channels (if available)
- Stack Overflow with tag `cryptomining-platform`

---

## 🔧 Advanced Solutions

### Use NVM for Node.js Management

```bash
# Install NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Use Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
```

### Use Yarn Instead of NPM

```bash
# Install Yarn
npm install -g yarn

# Install dependencies
yarn install

# Run development server
yarn dev
```

### Use Package Managers for Faster Installs

```bash
# pnpm (faster than npm)
npm install -g pnpm
pnpm install

# Bun (even faster)
npm install -g bun
bun install
```

---

**Remember**: Most issues are related to environment configuration. Start with the environment test (`node quick-test.js`) and follow the guide step by step.