import type { Pool } from "pg"
import crypto from "crypto"

export enum TaskCategory {
  AD_BASED = "ad_based",
  MICRO_JOBS = "micro_jobs",
  SURVEYS = "surveys",
  LEARNING_QUESTS = "learning_quests",
  REFERRAL = "referral",
  STAKING_VALIDATION = "staking_validation",
}

export interface TaskCategoryConfig {
  name: string
  description: string
  rewardMin: number
  rewardMax: number
  estimatedTime: string
  verificationMethod: "ai" | "oracle" | "auto" | "manual"
  multiplierBoost: number // 1.0 = no boost, 1.5 = 50% boost for trust levels
}

export interface AdvancedTask {
  id: string
  title: string
  description: string
  category: TaskCategory
  reward: number
  rewardMin: number
  rewardMax: number
  estimatedTime: string
  difficulty: "easy" | "medium" | "hard"
  trustMultiplier: number
  stakingBoost: number
  verificationMethod: "ai" | "oracle" | "auto" | "manual"
  proofRequired: string[]
  completionLimit?: number // daily or lifetime
  expiresAt?: Date
  metadata: Record<string, any>
}

export interface TaskSubmission {
  id: string
  userId: string
  taskId: string
  proofHash: string
  proofData: Record<string, any>
  submittedAt: Date
  status: "pending" | "verified" | "rejected"
  verifiedAt?: Date
  reward?: number
}

export const TASK_CONFIGS: Record<TaskCategory, TaskCategoryConfig> = {
  [TaskCategory.AD_BASED]: {
    name: "Watch & Earn",
    description: "Watch sponsored videos and advertisements",
    rewardMin: 5,
    rewardMax: 20,
    estimatedTime: "30s-2min",
    verificationMethod: "oracle",
    multiplierBoost: 1.0,
  },
  [TaskCategory.MICRO_JOBS]: {
    name: "Work & Mine",
    description: "Perform data labeling, tagging, and micro-tasks",
    rewardMin: 10,
    rewardMax: 50,
    estimatedTime: "5-15min",
    verificationMethod: "ai",
    multiplierBoost: 1.1,
  },
  [TaskCategory.SURVEYS]: {
    name: "Opinion Mining",
    description: "Complete surveys and provide feedback",
    rewardMin: 15,
    rewardMax: 60,
    estimatedTime: "10-20min",
    verificationMethod: "oracle",
    multiplierBoost: 1.05,
  },
  [TaskCategory.LEARNING_QUESTS]: {
    name: "Learn to Earn",
    description: "Complete educational quizzes and blockchain literacy",
    rewardMin: 5,
    rewardMax: 25,
    estimatedTime: "5-10min",
    verificationMethod: "auto",
    multiplierBoost: 1.15,
  },
  [TaskCategory.REFERRAL]: {
    name: "Invite & Mine",
    description: "Refer friends and earn commissions",
    rewardMin: 20,
    rewardMax: 100,
    estimatedTime: "1min",
    verificationMethod: "oracle",
    multiplierBoost: 1.2,
  },
  [TaskCategory.STAKING_VALIDATION]: {
    name: "Stake & Validate",
    description: "Stake tokens or validate other tasks for rewards",
    rewardMin: 0,
    rewardMax: 0, // Variable APY
    estimatedTime: "Passive",
    verificationMethod: "auto",
    multiplierBoost: 1.25,
  },
}

// Revenue tracking for mining algorithm
export interface RevenueStream {
  id: string
  source: "ads" | "surveys" | "micro_jobs" | "referrals" | "premiums" | "fees"
  amount: number // in base currency (KES or USD)
  currency: "KES" | "USD" | "MINER"
  tokensGenerated: number
  timestamp: Date
  metadata: Record<string, any>
}

export class TaskSystem {
  private pool: Pool

  constructor(pool: Pool) {
    this.pool = pool
  }

  generateProofHash(data: Record<string, any>, userId: string): string {
    const payload = JSON.stringify({ ...data, userId, timestamp: Date.now() })
    return crypto.createHash("sha256").update(payload).digest("hex")
  }

  async createTask(
    title: string,
    category: TaskCategory,
    rewardRange: [number, number],
    metadata: Record<string, any>,
  ): Promise<AdvancedTask> {
    const config = TASK_CONFIGS[category]
    const task: AdvancedTask = {
      id: crypto.randomUUID(),
      title,
      description: config.description,
      category,
      reward: Math.floor((rewardRange[0] + rewardRange[1]) / 2),
      rewardMin: rewardRange[0],
      rewardMax: rewardRange[1],
      estimatedTime: config.estimatedTime,
      difficulty: "medium",
      trustMultiplier: 1.0,
      stakingBoost: 1.0,
      verificationMethod: config.verificationMethod,
      proofRequired: this.getProofRequirements(category),
      metadata,
    }

    return task
  }

  private getProofRequirements(category: TaskCategory): string[] {
    const requirements: Record<TaskCategory, string[]> = {
      [TaskCategory.AD_BASED]: ["view_duration", "ad_id", "device_fingerprint", "timestamp"],
      [TaskCategory.MICRO_JOBS]: ["task_hash", "submission_file", "accuracy_score"],
      [TaskCategory.SURVEYS]: ["survey_token", "responses_hash", "completion_time"],
      [TaskCategory.LEARNING_QUESTS]: ["quiz_score", "answers_hash", "time_taken"],
      [TaskCategory.REFERRAL]: ["referral_link", "new_user_id", "kyc_verified"],
      [TaskCategory.STAKING_VALIDATION]: ["stake_proof", "validation_count", "accuracy_rate"],
    }
    return requirements[category] || []
  }

  async submitTask(userId: string, taskId: string, proofData: Record<string, any>): Promise<TaskSubmission> {
    const proofHash = this.generateProofHash(proofData, userId)

    const submission: TaskSubmission = {
      id: crypto.randomUUID(),
      userId,
      taskId,
      proofHash,
      proofData,
      submittedAt: new Date(),
      status: "pending",
    }

    // Store in database
    try {
      await this.pool.query(
        `INSERT INTO task_submissions 
        (id, user_id, task_id, proof_hash, proof_data, submitted_at, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          submission.id,
          userId,
          taskId,
          proofHash,
          JSON.stringify(proofData),
          submission.submittedAt,
          submission.status,
        ],
      )
    } catch (error) {
      console.error("[v0] Task submission DB error:", error)
      throw error
    }

    return submission
  }

  async verifyTask(
    submissionId: string,
    verificationMethod: string,
  ): Promise<{ verified: boolean; reward: number; reason?: string }> {
    // This would call external AI/Oracle services
    // For now, returns mock verification
    console.log(`[v0] Verifying task ${submissionId} using ${verificationMethod}`)

    return { verified: true, reward: 10 }
  }

  async calculateDynamicReward(
    userId: string,
    baseReward: number,
    trustLevel: number,
    stakingBoost: number,
  ): Promise<number> {
    const trustMultiplier = Math.min(1 + trustLevel * 0.1, 1.5)
    const finalReward = Math.round(baseReward * trustMultiplier * stakingBoost)
    return finalReward
  }

  async recordRevenue(source: string, amount: number, currency: string, tokensGenerated: number): Promise<void> {
    await this.pool.query(
      `INSERT INTO revenue_streams 
      (id, source, amount, currency, tokens_generated, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), source, amount, currency, tokensGenerated, new Date()],
    )
  }

  async getDailyRevenue(): Promise<number> {
    const result = await this.pool.query(
      `SELECT SUM(CAST(amount as NUMERIC)) as total FROM revenue_streams 
       WHERE DATE(timestamp) = CURRENT_DATE`,
    )
    return Number.parseFloat(result.rows[0]?.total || 0)
  }
}

export default TaskSystem
