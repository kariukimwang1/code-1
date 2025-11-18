# Neon Database Setup Guide

This project is fully integrated with Neon PostgreSQL database hosting.

## Quick Start

1. **Connection String**: Your database is already connected via the Neon integration
2. **Environment Variables**: Add these to your Vercel project environment:

\`\`\`bash
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
\`\`\`

3. **Run Migrations**:

\`\`\`bash
npm run db:migrate
\`\`\`

4. **Verify Connection**:

\`\`\`bash
npm run db:test
\`\`\`

## Database Schema

The system includes:
- **users**: User profiles and KYC levels
- **tasks**: Available earning opportunities
- **task_submissions**: User task completions
- **mining_records**: Mining activity tracking
- **rewards**: Pending and claimed rewards
- **staking_positions**: User stake data
- **withdrawals**: Withdrawal request history
- **payment_accounts**: Stripe/PayPal account links
- **audit_logs**: Compliance tracking

All tables are optimized with proper indexing for production workloads.

## Backup & Disaster Recovery

Neon automatically handles:
- Daily automated backups
- Point-in-time recovery (14 days)
- Failover protection
- SSL/TLS encryption

No additional backup configuration needed.
