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

## Project Structure

\`\`\`
miner-dapp/
├── app/
│   ├── api/                    # API routes
│   │   ├── mining/            # Mining endpoints
│   │   ├── rewards/           # Reward distribution
│   │   ├── staking/           # Staking operations
│   │   ├── withdrawals/       # Withdrawal processing
│   │   └── admin/             # Admin operations
│   ├── mining/                # Mining dashboard
│   ├── staking/               # Staking interface
│   ├── withdraw/              # Withdrawal page
│   └── admin/                 # Admin dashboard
├── components/
│   ├── mining-task-card.tsx   # Task component
│   ├── reward-chart.tsx       # Charts
│   └── ui/                    # shadcn components
├── contracts/
│   ├── MinerToken.sol         # ERC20 token
│   ├── RewardDistributorV2.sol# Reward distribution
│   ├── StakingV2.sol          # Staking contract
│   └── Treasury.sol           # Treasury management
├── lib/
│   ├── mining-engine.ts       # Mining logic
│   ├── batch-distributor.ts   # Batch processing
│   ├── treasury-manager.ts    # Buyback operations
│   ├── audit-logger.ts        # Compliance logging
│   └── contract-client.ts     # Contract interactions
├── scripts/
│   ├── deploy-thirdweb.ts     # Deployment script
│   ├── hardhat.config.ts      # Contract config
│   └── auto-buyback-scheduler.ts
└── database/
    └── 001_init_schema.sql    # Database schema
\`\`\`

## API Documentation

### Mining
- `POST /api/mining/submit` - Submit task for mining
- `GET /api/mining/status` - Get user mining stats

### Rewards
- `POST /api/rewards/batch-process` - Process reward batch (admin)
- `GET /api/rewards/history` - Get reward history

### Staking
- `POST /api/staking/stake` - Stake tokens
- `POST /api/staking/claim-rewards` - Claim staking rewards
- `GET /api/staking/positions` - Get staking positions

### Withdrawals
- `POST /api/withdrawals/create` - Create withdrawal
- `GET /api/withdrawals/history` - Get withdrawal history

### Admin
- `GET /api/admin/reports/daily-summary` - Daily report
- `GET /api/admin/reports/compliance` - Compliance report
- `GET /api/admin/treasury/metrics` - Treasury metrics

## Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete instructions.

### Quick Deploy to Vercel
\`\`\`bash
vercel deploy
\`\`\`

### Deploy Contracts
\`\`\`bash
npm run deploy:polygon    # Mainnet
npm run deploy:sepolia    # Testnet
\`\`\`

## Revenue Model

- **Task Fees**: 2% of task reward value
- **Staking Fee**: 0% (rewards cover costs)
- **Withdrawal Fee**: 2% (PayPal processing)
- **Conversion Fee**: 2% (token → stablecoin swap)

Target: KES 50,000/day (~$385) from fee accumulation.

## Roadmap

- Phase 1: MVP with manual PayPal processing
- Phase 2: Automated PayPal API integration
- Phase 3: Mobile app (iOS/Android)
- Phase 4: Multi-chain deployment
- Phase 5: DAO governance

## License

MIT

## Support

Issues? Check the [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) troubleshooting section.
