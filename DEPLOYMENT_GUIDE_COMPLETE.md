# MINER dApp - Complete Deployment Guide

## System Overview

This is a production-ready full-stack token and reward earning dApp with:
- 6 task categories for users to earn MINER tokens
- Real-revenue mining algorithm (50,000 KES/day target)
- Dual withdrawal system (PayPal + Stripe)
- Smart contract infrastructure (thirdweb-deployed)
- Admin dashboard with analytics
- Green gradient responsive UI with animations

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon)
- Stripe account with API keys
- PayPal Business account
- thirdweb account for contract deployment
- Private key for smart contract deployment

### Environment Setup

\`\`\`bash
# Create .env.local file
cp .env.example .env.local
\`\`\`

Fill in your environment variables:

\`\`\`env
# Database
NEON_POSTGRES_URL=postgresql://...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...

# thirdweb Deployment
PRIVATE_KEY=0x...
THIRDWEB_API_KEY=...
TREASURY_ADDRESS=0x...
REWARD_ORACLE_ADDRESS=0x...

# JWT Secret
JWT_SECRET=your_secure_secret_key_here
\`\`\`

### Installation

\`\`\`bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Build smart contracts
npm run compile:contracts

# Start development server
npm run dev
\`\`\`

## Smart Contract Deployment

### Deploy to thirdweb

\`\`\`bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to Polygon mainnet
npm run deploy:polygon

# Deploy to BSC mainnet
npm run deploy:bsc
\`\`\`

This will deploy 4 contracts in order:
1. **MinerTokenV2** - ERC20 token (1B supply)
2. **StakingV2** - Flexible staking with APY
3. **RewardDistributorV3** - Off-chain reward recording
4. **Treasury** - Buyback and liquidity management

Deployment addresses will be saved to `deployments/latest.json`.

## Task Categories

### 1. Watch & Earn (Ad-Based)
- Reward: 5-20 MINER per view
- Time: 30s-2min
- Verification: Oracle
- Revenue: Advertiser payments

### 2. Work & Mine (Micro Jobs)
- Reward: 10-50 MINER per job
- Time: 5-15min
- Verification: AI model
- Revenue: Data partner payments

### 3. Opinion Mining (Surveys)
- Reward: 15-60 MINER per survey
- Time: 10-20min
- Verification: Oracle
- Revenue: Market research clients

### 4. Learn to Earn (Quests)
- Reward: 5-25 MINER per quiz
- Time: 5-10min
- Verification: Auto-graded
- Revenue: Educational partners

### 5. Invite & Mine (Referrals)
- Reward: 20-100 MINER per referral
- Time: 1min setup
- Verification: Oracle
- Revenue: User acquisition

### 6. Stake & Validate
- Reward: Variable (5-25% APY)
- Time: Passive/ongoing
- Verification: On-chain
- Revenue: Treasury staking yields

## Mining Algorithm

Daily mining calculation:
\`\`\`
Daily Revenue (from all sources) = X KES
Tokens to mint = X × 1.0 (emission rate)

Distribution:
- 60% to users (mining rewards)
- 15% to treasury (operational costs)
- 10% to staking pool (APY)
- 10% to referral bonuses
- 5% to reserve fund
\`\`\`

### Running Daily Mining

\`\`\`bash
# Process batch rewards
npm run mining:batch

# Reset daily mining cycle
npm run mining:daily
\`\`\`

## Payment Processing

### PayPal Withdrawals

1. User requests withdrawal in dashboard
2. System validates KYC level and balance
3. Payment processor creates batch payout
4. Tokens are burned from user balance
5. Webhook confirms payout status
6. Funds arrive in user's PayPal account

### Stripe Payouts

1. Connect user's Stripe account
2. Request withdrawal amount
3. Create instant payout to connected account
4. Burn tokens and deduct from balance
5. Confirmation received from Stripe

### Both systems support:
- KYC tiered withdrawal limits
- Fee calculation (1-3% per transaction)
- Fraud detection
- Refund processing
- Audit logging

## Database Schema

Key tables:
- `users` - User accounts and KYC
- `advanced_tasks` - Task definitions with 6 categories
- `task_submissions` - User task completions
- `revenue_streams` - Revenue tracking for mining
- `daily_mining_records` - Daily aggregated stats
- `user_trust_levels` - Reputation scoring
- `staking_positions` - Locked tokens
- `withdrawals` - Payment history
- `payment_transactions` - Stripe/PayPal records

Run migrations:
\`\`\`bash
psql $DATABASE_URL < scripts/001_init_schema.sql
psql $DATABASE_URL < scripts/002_extend_schema_tasks.sql
psql $DATABASE_URL < scripts/003_payment_integration.sql
\`\`\`

## Admin Dashboard

Access at `/admin/dashboard` (requires admin role).

Features:
- Real-time mining statistics
- Revenue breakdown by source
- User activity trends
- System health monitoring
- Contract deployment status
- Manual reward processing
- Treasury and buyback controls
- Audit logging and compliance

## API Endpoints

### Tasks
- `GET /api/tasks` - List available tasks
- `POST /api/tasks/[id]/submit` - Submit task proof
- `GET /api/tasks/[id]` - Get task details

### Mining
- `POST /api/mining/submit` - Submit mining work
- `GET /api/mining/status` - Get mining status

### Withdrawals
- `POST /api/withdrawals/create` - Request withdrawal
- `GET /api/withdrawals/history` - View withdrawal history

### Payments
- `POST /api/payments/paypal/webhook` - PayPal webhook handler
- `POST /api/payments/stripe/webhook` - Stripe webhook handler

### Admin
- `GET /api/admin/analytics` - Dashboard analytics
- `GET /api/admin/treasury/metrics` - Treasury stats
- `POST /api/admin/treasury/execute-buyback` - Trigger buyback

## Security Considerations

1. **JWT Authentication** - All protected endpoints use JWT
2. **Rate Limiting** - 100 requests per minute per IP
3. **CORS** - Configured for production domain
4. **HTTPS** - Required in production
5. **Environment Variables** - All secrets in .env.local
6. **Database Encryption** - SSL connections
7. **Smart Contract Audits** - Use trusted audit firms
8. **Signature Verification** - Oracle signatures verified
9. **KYC Integration** - Anti-fraud and compliance
10. **Audit Logging** - All transactions logged

## Performance Optimization

1. **Database Indexes** - Optimized for common queries
2. **Caching** - SWR for client-side data fetching
3. **API Batching** - Batch reward processing
4. **Smart Contract Gas** - Optimized Solidity code
5. **CDN** - Static assets served via Vercel Edge
6. **Image Optimization** - Next.js automatic optimization

## Monitoring & Alerts

Set up monitoring for:
- API response times
- Database query performance
- Smart contract state changes
- Payment failures
- User KYC rejections
- Revenue anomalies
- System uptime

Tools: Datadog, New Relic, or custom monitoring

## Scaling Strategy

### Phase 1: MVP (Current)
- 1,000 DAU
- Single database
- Basic caching

### Phase 2: Growth
- 10,000 DAU
- Database replication
- Redis caching
- Load balancing

### Phase 3: Scale
- 50,000 DAU
- Multi-region deployment
- Sharding by user
- Advanced analytics

## Production Checklist

- [ ] All environment variables configured
- [ ] Database backups scheduled
- [ ] Smart contracts deployed to mainnet
- [ ] SSL certificates valid
- [ ] API rate limiting active
- [ ] Monitoring and alerts set up
- [ ] Admin access restricted
- [ ] Webhook endpoints configured
- [ ] KYC provider integrated
- [ ] Compliance review completed
- [ ] Security audit passed
- [ ] Load testing completed
- [ ] Incident response plan ready
- [ ] Team training completed

## Support & Resources

- Documentation: /docs
- API Reference: /api/docs
- Smart Contract Docs: /contracts
- Community Discord: [link]
- Support Email: support@miner.com

---

Last Updated: November 2025
Version: 1.0.0
