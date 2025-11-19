# CryptoMining Platform - Local Development Setup

A comprehensive cryptocurrency mining and trading platform with advanced admin functionality.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **PostgreSQL** (for local database) or use Neon
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd miner-dapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your configuration. See [Environment Variables](#environment-variables) below.

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠 Available Scripts

- `npm run dev` - Start development server (http://localhost:3000)
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm run clean` - Clean node_modules and reinstall
- `npm run setup:local` - Clean setup for local development

## 🌍 Environment Variables

### Required for Development

Create a `.env.local` file with these variables:

```env
# Database
NEON_POSTGRES_URL=postgresql://username:password@host:port/database

# Authentication
JWT_SECRET=your-super-secret-jwt-key
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Blockchain (for development, you can use testnets)
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/your-key
PRIVATE_KEY=your-test-wallet-private-key

# Optional Services (for full functionality)
STRIPE_SECRET_KEY=sk_test_your-stripe-key
THIRDWEB_CLIENT_ID=your-thirdweb-client-id
```

### Getting Service Keys

1. **Database**: Set up a free [Neon PostgreSQL](https://neon.tech/) account
2. **Blockchain RPC**: Create an [Infura](https://infura.io/) account for RPC URLs
3. **Stripe**: Get API keys from [Stripe Dashboard](https://dashboard.stripe.com/)
4. **Thirdweb**: Get client ID from [Thirdweb Dashboard](https://thirdweb.com/)

## 🔐 Security Features

- JWT-based authentication
- Rate limiting and DDoS protection
- SQL injection prevention
- XSS protection
- CSRF protection
- Secure headers
- Input validation

## 👥 Admin Features

Access the admin dashboard at `/admin` with admin credentials:

### Admin Sections

1. **Overview** - System metrics and statistics
2. **Users** - User management and controls
3. **Analytics** - Business intelligence and reports
4. **System** - System monitoring and health
5. **Security** - Security events and monitoring
6. **Settings** - System configuration

### API Endpoints

- `/api/admin/overview` - Overview data
- `/api/admin/users` - User management
- `/api/admin/analytics` - Analytics data
- `/api/admin/security` - Security monitoring
- `/api/admin/settings` - Settings management

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   └── ...                # Other app pages
├── lib/                   # Utility libraries
│   ├── auth/              # Authentication logic
│   ├── security/          # Security hardening
│   └── ...                # Other utilities
├── public/                # Static assets
├── scripts/               # Automation scripts
├── contracts/             # Smart contracts
└── mobile/                # React Native app
```

## 🚀 Features

- **Proof of Contribution Mining**: Earn tokens through legitimate tasks (data tagging, quizzes, referrals)
- **Variable Staking**: 3 tiers (Flexible 5% APY, 30-day 10% APY, 90-day 25% APY)
- **Mining Multiplier**: Up to 1.5x boost for stakers
- **Treasury Buyback**: Automatic token buyback to maintain price floor
- **PayPal Integration**: Phase 1 (manual), Phase 2 (automated)
- **KYC Compliance**: 3-tier system with withdrawal limits
- **Audit Logging**: Immutable compliance records
- **Admin Dashboard**: Real-time metrics and compliance reports
- **Advanced Security**: Enterprise-grade security with zero-trust architecture
- **Real-time Analytics**: Business intelligence and reporting

## 🔧 Troubleshooting

### Installation Issues

**Problem**: `npm install` fails with peer dependency conflicts
```bash
# Solution
npm install --legacy-peer-deps
```

**Problem**: TypeScript errors during build
```bash
# Solution (development only)
npm run type-check
# Fix type errors in IDE, then run build again
```

### Runtime Issues

**Problem**: Database connection failed
- Check `NEON_POSTGRES_URL` in `.env.local`
- Ensure database is accessible
- Verify SSL mode is correct

**Problem**: Authentication not working
- Verify `JWT_SECRET` is set
- Check `NEXTAUTH_URL` matches your local URL
- Clear browser cookies and localStorage

### Performance Issues

**Problem**: Development server is slow
```bash
# Use optimized development config
npm run dev
# Next.js is already optimized for development
```

**Problem**: Memory issues
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run dev
```

## 🛡 Security Best Practices

1. **Never commit `.env.local`** - Add to `.gitignore`
2. **Use strong JWT secrets** - Minimum 32 characters
3. **Enable HTTPS in production**
4. **Regular security updates**
5. **Monitor security logs**

## 📱 Mobile App

The platform includes a React Native mobile app in the `/mobile` directory:

```bash
cd mobile
npm install
npm run start  # For Expo Go
# or
npm run android  # For Android
npm run ios      # For iOS
```

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

## 🚀 Deployment

### Local Production Build

```bash
npm run build
npm run start
```

### Environment-specific Builds

```bash
# Development
NODE_ENV=development npm run build

# Production
NODE_ENV=production npm run build
```

## 📊 Monitoring & Logging

The platform includes comprehensive monitoring:

- **Performance metrics** in admin dashboard
- **Security event logging**
- **Error tracking** (integrate with Sentry)
- **Analytics tracking** (Vercel Analytics)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:

1. Check this README
2. Review the admin dashboard for system status
3. Check GitHub Issues
4. Contact the development team

---

## 🔑 Quick Development Commands

```bash
# Full clean setup
npm run setup:local

# Development with hot reload
npm run dev

# Type checking
npm run type-check

# Build check
npm run build

# Production test
npm run start
```

**Happy Development! 🚀**
