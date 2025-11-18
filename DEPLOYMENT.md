# MINER Platform Production Deployment Guide

## 🚀 Overview

This guide provides comprehensive instructions for deploying the MINER cryptocurrency mining and staking platform to production. The platform includes:

- **Frontend**: Next.js Web3 dApp with wallet integration
- **Backend**: API routes for authentication, payments, KYC
- **Smart Contracts**: ERC20 token, mining, staking, treasury contracts
- **Payment Processing**: Stripe and PayPal integration
- **Automation**: Treasury management, buybacks, reward distribution
- **Monitoring**: Real-time health checks and alerting

## 📋 Prerequisites

### Infrastructure Requirements

1. **Domain Name** (e.g., miner.com)
2. **SSL Certificate** (Let's Encrypt recommended)
3. **Database** (PostgreSQL 14+)
4. **Redis** (for caching and automation)
5. **Server** (Linux, 8GB+ RAM, 100GB+ storage)
6. **Node.js** (18.x LTS)
7. **Ethereum/ETH Balance** (for contract deployment gas fees)

### Services & APIs

1. **Blockchain RPCs**
   - Infura or Alchemy (Ethereum)
   - Polygon RPC endpoints
   - BSC RPC endpoints

2. **Payment Processors**
   - Stripe account (live mode)
   - PayPal Business account

3. **External Services**
   - Google Cloud Platform (OAuth)
   - KYC provider (Sumsub, Veriff)
   - Monitoring (Sentry, PagerDuty)
   - Email service (SendGrid, AWS SES)

## 🔧 Environment Setup

### 1. Environment Variables

Copy the production environment template:

```bash
cp .env.production.example .env.production
```

Configure all required variables:

```bash
# Core Configuration
NODE_ENV=production
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-super-secret-key-here

# Database
DATABASE_URL=postgresql://user:password@host:port/miner_prod

# Blockchain RPCs
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
POLYGON_RPC_URL=https://polygon-rpc.com
BSC_RPC_URL=https://bsc-dataseed1.binance.org

# Deployer Wallet (NEVER commit actual private key)
PRIVATE_KEY=0x1234567890abcdef...

# Payment Processors
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# External Services
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
REDIS_URL=redis://user:password@host:port
```

### 2. Install Dependencies

```bash
npm ci --production
```

### 3. Database Setup

```bash
# Create production database
createdb miner_prod

# Run migrations
npm run db:migrate

# Seed initial data (optional)
npm run db:seed
```

## 📜 Smart Contract Deployment

### 1. Pre-Deployment Checklist

- [ ] Deployer wallet has sufficient ETH for gas fees (1+ ETH recommended)
- [ ] All contract code audited and verified
- [ ] Testnet deployment completed and verified
- [ ] Treasury multi-sig wallet created
- [ ] Team wallet addresses prepared

### 2. Execute Deployment

```bash
# Run production deployment
npx tsx scripts/production-deployment.ts
```

This will:
- Deploy Miner Token to Ethereum, Polygon, and BSC
- Deploy Mining, Staking, and Treasury contracts
- Fund treasury with initial tokens
- Generate deployment report

### 3. Verify Contracts

After deployment, verify contracts on block explorers:

- **Ethereum**: https://etherscan.io/
- **Polygon**: https://polygonscan.com/
- **BSC**: https://bscscan.com/

### 4. Update Environment

Add deployed contract addresses to `.env.production`:

```bash
ETHEREUM_TOKEN_ADDRESS=0x...
ETHEREUM_MINING_ADDRESS=0x...
ETHEREUM_STAKING_ADDRESS=0x...
ETHEREUM_TREASURY_ADDRESS=0x...
```

## 🔍 Production Validation

### Run Validation Suite

```bash
# Comprehensive validation
npx tsx scripts/production-validation.ts
```

This validates:
- Environment configuration
- Database connectivity
- Blockchain connections
- Contract deployment
- Payment systems
- Security settings
- API endpoints
- Performance metrics

### Critical Checks Before Going Live

- [ ] All validations pass
- [ ] Smart contracts verified on block explorers
- [ ] Treasury multi-sig operational
- [ ] Payment processor webhooks configured
- [ ] SSL certificate installed
- [ ] Monitoring and alerting active
- [ ] Backup procedures tested

## 🤖 Automation Setup

### 1. Start Production Automation

```bash
# Run automation service
npx tsx scripts/production-automation.ts
```

This handles:
- Daily reward distribution
- Automated buybacks
- Treasury management
- Health monitoring
- Emergency procedures

### 2. Configure Scheduled Tasks

The automation includes cron jobs for:
- Daily reward distribution (midnight UTC)
- Hourly buyback checks
- Weekly system cleanup
- Monthly treasury reports

### 3. Set Up Process Manager

Use PM2 for production process management:

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'miner-app',
      script: 'npm',
      args: 'start',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'miner-automation',
      script: 'npx',
      args: 'tsx scripts/production-automation.ts',
      instances: 1,
      exec_mode: 'fork'
    }
  ]
}
EOF

# Start services
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## 🔐 Security Configuration

### 1. SSL/TLS Setup

```bash
# Install SSL certificate (Let's Encrypt)
sudo apt install certbot
sudo certbot --nginx -d your-domain.com
```

### 2. Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 3. Security Headers

Configure nginx for security headers:

```nginx
# /etc/nginx/sites-available/miner
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # Application proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📊 Monitoring & Alerting

### 1. Application Monitoring

Set up Sentry for error tracking:

```bash
# Install Sentry SDK
npm install @sentry/nextjs
```

Configure in `sentry.client.config.js` and `sentry.server.config.js`.

### 2. Infrastructure Monitoring

Use tools like:
- **Prometheus + Grafana** for metrics
- **ELK Stack** for logs
- **Pingdom** for uptime monitoring

### 3. Alerting Configuration

Set up alerts for:
- Contract balance drops below thresholds
- High gas prices affecting operations
- API error rates above 5%
- Database connection failures
- Payment processor failures

## 🔄 Payment Processor Setup

### Stripe Configuration

1. **Create Webhooks**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `invoice.payment_succeeded`
   - `account.updated`

2. **Configure webhook endpoint**:
   ```
   https://your-domain.com/api/payments/stripe-webhook
   ```

3. **Set webhook secret** in environment variables.

### PayPal Configuration

1. **Create IPN Webhook**:
   ```
   https://your-domain.com/api/payments/paypal-webhook
   ```

2. **Enable IPN** in PayPal developer settings.

3. **Verify webhook ID** matches environment configuration.

## 🧪 Testing in Production

### 1. Staged Rollout

1. Deploy to production with limited user access
2. Enable features gradually:
   - User registration
   - Wallet connection
   - Test transactions (< $1)
   - Full functionality

### 2. Transaction Testing

Test all transaction types with small amounts:
- Token transfers
- Mining rewards
- Staking operations
- Payment processing

### 3. Performance Testing

Load test critical endpoints:
- `/api/auth/signin`
- `/api/kyc/submit`
- `/api/mining/start`
- `/api/staking/stake`

## 📋 Post-Deployment Checklist

### Immediate Actions

- [ ] Verify all contracts are operational
- [ ] Test payment processing with real transactions
- [ ] Confirm monitoring dashboards are receiving data
- [ ] Test emergency pause functionality
- [ ] Validate KYC submission flow

### First 24 Hours

- [ ] Monitor gas usage and transaction success rates
- [ ] Review error logs and Sentry reports
- [ ] Check payment processor settlements
- [ ] Verify automation scripts are running
- [ ] Test user support workflows

### First Week

- [ ] Analyze user onboarding conversion rates
- [ ] Review treasury operations and balances
- [ ] Validate smart contract interaction patterns
- [ ] Check for any unusual activity or security concerns
- [ ] Optimize performance bottlenecks

## 🚨 Emergency Procedures

### Emergency Pause

1. **Manual Emergency Stop**:
   ```bash
   # Stop all services
   pm2 stop all

   # Pause contracts
   npx tsx scripts/emergency-pause.ts
   ```

2. **Environment Variable Override**:
   ```bash
   EMERGENCY_PAUSE=true
   EMERGENCY_PAUSE_REASON="Manual emergency"
   ```

### Service Recovery

1. **Database Issues**:
   ```bash
   # Check connection
   npm run db:health

   # Restore from backup if needed
   npm run db:restore backup_name
   ```

2. **Blockchain Issues**:
   ```bash
   # Switch to backup RPC
   UPDATE networks SET rpc_url = 'backup-url' WHERE name = 'ethereum';
   ```

3. **Payment Processor Issues**:
   - Temporarily disable affected payment method
   - Process pending transactions manually
   - Notify users of service interruption

## 📞 Support & Maintenance

### Regular Maintenance Tasks

- **Daily**: Review system health and error logs
- **Weekly**: Check contract balances and gas costs
- **Monthly**: Generate treasury and performance reports
- **Quarterly**: Security audit and code review

### Support Channels

1. **User Support**: Set up helpdesk system
2. **Technical Support**: On-call rotation for critical issues
3. **Security**: Contact information for security researchers

### Documentation Maintenance

- Keep API documentation current
- Update deployment guides with new requirements
- Maintain troubleshooting documentation
- Regular security advisories and updates

## 🔄 Updates & Upgrades

### Smart Contract Upgrades

1. **Proxy Pattern**: Use upgradeable contracts
2. **Timelock**: Implement governance delays
3. **Testing**: Thorough testnet testing before mainnet

### Application Updates

1. **Blue-Green Deployment**: Zero-downtime updates
2. **Database Migrations**: Careful migration planning
3. **Feature Flags**: Gradual feature rollouts

---

## 🎉 Success Metrics

Monitor these key metrics post-launch:

- **User Acquisition**: New registrations, KYC completions
- **Transaction Volume**: Mining rewards, staking activity
- **Financial Metrics**: Treasury growth, operating costs
- **Technical Performance**: Uptime, response times, error rates
- **Compliance**: KYC approval rates, AML alerts

Regular reviews of these metrics will guide platform improvements and feature development.

---

**⚠️ IMPORTANT**: This deployment involves real cryptocurrency and financial transactions. Ensure you have:

- Legal counsel review
- Comprehensive insurance coverage
- Experienced blockchain development team
- Robust security measures
- Regulatory compliance procedures

The MINER team is not responsible for financial losses or regulatory issues resulting from improper deployment.