# MINER - Web3 Earning Platform

A complete, production-ready full-stack dApp for token rewards, staking, and PayPal withdrawals.

## Features

- **Proof of Contribution Mining**: Earn tokens through legitimate tasks (data tagging, quizzes, referrals)
- **Variable Staking**: 3 tiers (Flexible 5% APY, 30-day 10% APY, 90-day 25% APY)
- **Mining Multiplier**: Up to 1.5x boost for stakers
- **Treasury Buyback**: Automatic token buyback to maintain price floor
- **PayPal Integration**: Phase 1 (manual), Phase 2 (automated)
- **KYC Compliance**: 3-tier system with withdrawal limits
- **Audit Logging**: Immutable compliance records
- **Admin Dashboard**: Real-time metrics and compliance reports

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, PostgreSQL
- **Blockchain**: Solidity (ERC20, Staking), thirdweb deployment
- **APIs**: RESTful with JWT auth
- **External**: PayPal, Ethers.js

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env.local
# ... fill in variables

# Setup database
psql -U postgres -d miner_dapp < scripts/001_init_schema.sql

# Deploy contracts to thirdweb
npm run deploy:sepolia

# Start development server
npm run dev

# Visit http://localhost:3000
\`\`\`

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
