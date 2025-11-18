import type { Pool } from "pg"
import crypto from "crypto"

export interface MiningConfig {
  dailyRevenueTarget: number // in KES/USD
  userRewardPercentage: number // 60%
  treasuryPercentage: number // 15%
  stakingPercentage: number // 10%
  referralPercentage: number // 10%
  reservePercentage: number // 5%
  emissionRate: number // tokens per KES earned
}

export interface MiningResult {
  totalRevenue: number
  tokensMinted: number
  userRewardPool: number
  treasuryAllocation: number
  stakingAllocation: number
  referralAllocation: number
  reserveAllocation: number
  timestamp: Date
}

export const DEFAULT_MINING_CONFIG: MiningConfig = {
  dailyRevenueTarget: 50000, // 50,000 KES
  userRewardPercentage: 0.6,
  treasuryPercentage: 0.15,
  stakingPercentage: 0.1,
  referralPercentage: 0.1,
  reservePercentage: 0.05,
  emissionRate: 1.0, // 1 MINER = 1 KES value (adjustable)
}

export class MiningEngineV2 {
  private pool: Pool
  private config: MiningConfig

  constructor(pool: Pool, config: Partial<MiningConfig> = {}) {
    this.pool = pool
    this.config = { ...DEFAULT_MINING_CONFIG, ...config }
  }

  async calculateDailyMining(): Promise<MiningResult> {
    // Get total revenue for today
    const totalRevenue = await this.getDailyRevenue()

    // Calculate total tokens to mint
    const tokensMinted = Math.floor(totalRevenue * this.config.emissionRate)

    // Distribute tokens according to allocation
    const userRewardPool = Math.floor(tokensMinted * this.config.userRewardPercentage)
    const treasuryAllocation = Math.floor(tokensMinted * this.config.treasuryPercentage)
    const stakingAllocation = Math.floor(tokensMinted * this.config.stakingPercentage)
    const referralAllocation = Math.floor(tokensMinted * this.config.referralPercentage)
    const reserveAllocation = Math.floor(tokensMinted * this.config.reservePercentage)

    const result: MiningResult = {
      totalRevenue,
      tokensMinted,
      userRewardPool,
      treasuryAllocation,
      stakingAllocation,
      referralAllocation,
      reserveAllocation,
      timestamp: new Date(),
    }

    // Record mining event
    await this.recordMiningEvent(result)

    return result
  }

  private async getDailyRevenue(): Promise<number> {
    try {
      const result = await this.pool.query(
        `SELECT COALESCE(SUM(CAST(amount AS NUMERIC)), 0) as total 
         FROM revenue_streams 
         WHERE DATE(timestamp) = CURRENT_DATE`,
      )
      return Number.parseFloat(result.rows[0]?.total || 0)
    } catch (error) {
      console.error("[v0] Revenue query error:", error)
      return 0
    }
  }

  async recordRevenue(
    source: "ads" | "surveys" | "micro_jobs" | "referrals" | "premiums" | "fees",
    amount: number,
    currency = "KES",
  ): Promise<void> {
    const tokensGenerated = Math.floor(amount * this.config.emissionRate)

    await this.pool.query(
      `INSERT INTO revenue_streams (id, source, amount, currency, tokens_generated, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), source, amount, currency, tokensGenerated, new Date()],
    )
  }

  private async recordMiningEvent(result: MiningResult): Promise<void> {
    const {
      totalRevenue,
      tokensMinted,
      userRewardPool,
      treasuryAllocation,
      stakingAllocation,
      referralAllocation,
      reserveAllocation,
    } = result

    // Get stats for the day
    const statsResult = await this.pool.query(
      `SELECT COUNT(DISTINCT user_id) as active_users, 
              COUNT(*) as total_tasks,
              AVG(reward_tokens) as avg_reward
       FROM task_submissions
       WHERE DATE(submitted_at) = CURRENT_DATE AND status = 'verified'`,
    )

    const stats = statsResult.rows[0] || {
      active_users: 0,
      total_tasks: 0,
      avg_reward: 0,
    }

    await this.pool.query(
      `INSERT INTO daily_mining_records 
       (id, date, total_revenue, total_tokens_minted, user_reward_pool, 
        treasury_allocation, staking_allocation, referral_allocation, 
        reserve_allocation, active_users, total_tasks_completed, average_task_value)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
      [
        crypto.randomUUID(),
        new Date().toISOString().split("T")[0],
        totalRevenue,
        tokensMinted,
        userRewardPool,
        treasuryAllocation,
        stakingAllocation,
        referralAllocation,
        reserveAllocation,
        stats.active_users,
        stats.total_tasks,
        stats.avg_reward,
      ],
    )
  }

  async distributeUserRewards(userRewardPool: number): Promise<void> {
    // Get all verified task submissions for today
    const submissions = await this.pool.query(
      `SELECT ts.id, ts.user_id, ts.reward_tokens, ul.trust_score
       FROM task_submissions ts
       JOIN users u ON ts.user_id = u.id
       LEFT JOIN user_trust_levels ul ON u.id = ul.user_id
       WHERE DATE(ts.submitted_at) = CURRENT_DATE AND ts.status = 'verified'
       ORDER BY ts.submitted_at DESC`,
    )

    const totalWeight = submissions.rows.reduce((sum, row) => sum + (row.reward_tokens || 0), 0)

    // Distribute proportionally
    for (const submission of submissions.rows) {
      const weight = submission.reward_tokens || 0
      const proportion = weight / totalWeight
      const userReward = Math.floor(userRewardPool * proportion)

      // Update user balance
      await this.pool.query(`UPDATE user_balances SET token_balance = token_balance + $1 WHERE user_id = $2`, [
        userReward,
        submission.user_id,
      ])

      // Record reward
      await this.pool.query(
        `INSERT INTO reward_ledger (id, user_id, task_id, amount, status)
         VALUES ($1, $2, $3, $4, $5)`,
        [crypto.randomUUID(), submission.user_id, null, userReward, "completed"],
      )
    }
  }

  async updateUserTrustLevels(): Promise<void> {
    const users = await this.pool.query(
      `SELECT DISTINCT user_id FROM task_submissions 
       WHERE DATE(submitted_at) = CURRENT_DATE`,
    )

    for (const { user_id } of users.rows) {
      const stats = await this.pool.query(
        `SELECT 
          COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as failed_count
         FROM task_submissions WHERE user_id = $1`,
        [user_id],
      )

      const { verified_count, failed_count } = stats.rows[0]
      const totalTasks = verified_count + failed_count
      const accuracyRate = (verified_count / totalTasks) * 100

      // Determine trust level
      let level = "Bronze"
      let trustScore = 50

      if (accuracyRate >= 95 && verified_count >= 50) {
        level = "Platinum"
        trustScore = 100
      } else if (accuracyRate >= 90 && verified_count >= 25) {
        level = "Gold"
        trustScore = 80
      } else if (accuracyRate >= 85 && verified_count >= 10) {
        level = "Silver"
        trustScore = 65
      }

      await this.pool.query(
        `INSERT INTO user_trust_levels (id, user_id, trust_score, level, completed_tasks, verified_tasks, accuracy_rate)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (user_id) DO UPDATE SET
         trust_score = $3, level = $4, completed_tasks = $5, verified_tasks = $6, accuracy_rate = $7`,
        [crypto.randomUUID(), user_id, trustScore, level, totalTasks, verified_count, accuracyRate],
      )
    }
  }

  async getMiningStats(days = 7): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM daily_mining_records 
       WHERE date >= CURRENT_DATE - INTERVAL '${days} days'
       ORDER BY date DESC`,
    )
    return result.rows
  }
}

export default MiningEngineV2
