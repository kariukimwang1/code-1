# MINER dApp - Complete Deployment Guide

## Overview
Full-stack token/reward dApp with blockchain mining (Proof of Contribution), smart contracts on thirdweb, and PayPal integration.

## Architecture

### Smart Contracts (Solidity)
- **MinerToken.sol** - ERC20 token (1B supply) with mint controls
- **RewardDistributorV2.sol** - Distributes verified rewards with batch processing
- **StakingV2.sol** - Flexible staking with lock periods (0, 30, 90 days) and variable APY
- **Treasury.sol** - Manages buyback operations and token stability

### Backend (Node.js/TypeScript)
- Mining Engine - Calculates rewards based on task type, user trust score, and staking multiplier
- Batch Distributor - Processes pending rewards into blockchain batches hourly
- Treasury Manager - Auto-executes buyback when conditions are met
- Audit Logger - Immutable compliance logging

### Frontend (Next.js 16)
- Mining Dashboard - Real-time reward tracking and task submissions
- Staking Interface - Lock periods and APY visualization
- Withdrawal System - PayPal integration with KYC tiers
- Admin Panel - Daily metrics, compliance reports, audit trails

### Database (PostgreSQL)
- Users, tasks, reward ledger, staking positions, withdrawals
- Daily metrics, treasury operations, audit logs

---

## Deployment Steps

### 1. Setup Environment Variables

\`\`\`bash
# Copy and fill out
cp .env.example .env.local

# Required variables:
DEPLOYER_PRIVATE_KEY=0x...          # Deployer wallet private key
ORACLE_ADDRESS=0x...                 # Backend signer address
ADMIN_API_KEY=...                     # For admin endpoints
REWARD_SIGNER_KEY=0x...              # For signing rewards
DATABASE_URL=postgresql://...        # PostgreSQL connection
PAYPAL_CLIENT_ID=...                 # PayPal API credentials
PAYPAL_CLIENT_SECRET=...
\`\`\`

### 2. Deploy Smart Contracts to thirdweb

#### Option A: Using thirdweb Dashboard
1. Go to [thirdweb.com](https://thirdweb.com)
2. Click "Deploy"
3. Upload `contracts/MinerToken.sol`
4. Select network (Polygon, BSC, Ethereum, Sepolia)
5. Deploy and note contract address
6. Repeat for RewardDistributorV2, StakingV2, Treasury

#### Option B: Using Hardhat Script
\`\`\`bash
# Compile contracts
npm run compile:contracts

# Deploy to Sepolia (testnet)
npm run deploy:sepolia

# Deploy to Polygon (mainnet)
npm run deploy:polygon

# Deploy to BSC (mainnet)
npm run deploy:bsc
\`\`\`

#### Deployment Output Example
\`\`\`
MinerToken: 0x1234...
RewardDistributor: 0x5678...
Staking: 0x9abc...
Treasury: 0xdef0...
\`\`\`

### 3. Setup Database

\`\`\`bash
# Create PostgreSQL database
createdb miner_dapp

# Run migrations
psql miner_dapp < scripts/001_init_schema.sql

# Verify tables created
psql miner_dapp -c "\dt"
\`\`\`

### 4. Update Contract Registry

Edit `lib/contract-registry.ts` with deployed addresses:

\`\`\`typescript
"sepolia-main": {
  token: "0x...",
  rewardDistributor: "0x...",
  staking: "0x...",
  treasury: "0x...",
}
\`\`\`

### 5. Install Dependencies

\`\`\`bash
npm install

# Or with pnpm
pnpm install
\`\`\`

### 6. Start Services

\`\`\`bash
# Development
npm run dev

# Production build
npm run build
npm start

# Mining batch processor (separate terminal)
npm run mining:batch

# Auto-buyback scheduler (separate terminal)
node scripts/auto-buyback-scheduler.ts
\`\`\`

### 7. Setup Cron Jobs

#### Daily Mining Reset (UTC 00:00)
\`\`\`bash
0 0 * * * curl -X POST http://localhost:3000/api/mining/daily-reset \
  -H "x-admin-key: $ADMIN_API_KEY"
\`\`\`

#### Hourly Batch Processing (Every hour)
\`\`\`bash
0 * * * * curl -X POST http://localhost:3000/api/rewards/batch-process \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 100}'
\`\`\`

#### Daily PayPal Processing (10 AM UTC)
\`\`\`bash
0 10 * * * curl -X POST http://localhost:3000/api/withdrawals/process-paypal \
  -H "x-admin-key: $ADMIN_API_KEY"
\`\`\`

---

## Smart Contract Verification

### Verify on Etherscan (Sepolia)
\`\`\`bash
npm run verify:contracts -- \
  --network sepolia \
  --address 0x... \
  --constructorArgs "0x..."
\`\`\`

### Manual Verification on thirdweb
1. Go to deployed contract on thirdweb dashboard
2. Click "Verify Source Code"
3. Select Solidity compiler version (0.8.20)
4. Paste source code

---

## Key Features Checklist

- [x] ERC20 Token with 1B supply
- [x] Proof of Contribution mining model
- [x] Batch reward distribution with signatures
- [x] Variable APY staking (5%-25%)
- [x] Mining multiplier boost (1.0x - 1.5x)
- [x] Treasury buyback system
- [x] PayPal withdrawal integration
- [x] KYC tiered limits
- [x] Audit logging for compliance
- [x] Admin reporting dashboard
- [x] thirdweb deployment ready

---

## Testing

### Unit Tests
\`\`\`bash
npm run test
\`\`\`

### Integration Tests
\`\`\`bash
npm run test:integration
\`\`\`

### Contract Tests (Hardhat)
\`\`\`bash
npx hardhat test
\`\`\`

---

## Monitoring

### Daily Metrics
\`\`\`bash
curl http://localhost:3000/api/admin/reports/daily-summary \
  -H "x-admin-key: $ADMIN_API_KEY"
\`\`\`

### Compliance Report (Last 30 Days)
\`\`\`bash
curl "http://localhost:3000/api/admin/reports/compliance?days=30" \
  -H "x-admin-key: $ADMIN_API_KEY"
\`\`\`

### Treasury Metrics
\`\`\`bash
curl http://localhost:3000/api/admin/treasury/metrics \
  -H "x-admin-key: $ADMIN_API_KEY"
\`\`\`

---

## Security Considerations

1. **Private Keys**: Never commit to repository. Use `.env.local` and secret manager
2. **Oracle Signature**: Backend signer must be secure - consider hardware wallet
3. **Rate Limiting**: All endpoints have rate limits to prevent abuse
4. **KYC Tiers**: Enforce 2-step verification for high-value withdrawals
5. **Audit Trail**: All critical operations logged immutably
6. **Contract Upgrades**: Use proxy pattern for future upgrades

---

## Troubleshooting

### Deployment Fails with "Insufficient Funds"
- Ensure deployer wallet has enough native tokens for gas
- On testnet, use faucet: https://faucets.chain.link

### Batch Processing Hangs
- Check database connection: `psql $DATABASE_URL -c "SELECT 1"`
- Verify REWARD_SIGNER_KEY is valid private key
- Check contract balance for reward tokens

### PayPal Webhooks Not Firing
- Verify webhook URL is accessible
- Check PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET
- Review PayPal dashboard event logs

---

## Support

For issues or questions:
1. Check GitHub issues
2. Review audit logs for errors
3. Check Etherscan/thirdweb for contract status
4. Enable debug logging: `DEBUG=* npm run dev`
