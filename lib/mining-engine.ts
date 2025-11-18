import { query } from "./database"

/**
 * Mining Engine - Processes contributions and generates rewards
 * Implements Proof of Contribution model with scoring algorithm
 */

export interface MiningTask {
  id: string
  type: "micro_task" | "quiz" | "sponsored" | "referral" | "compute"
  weight: number
  baseReward: number // in tokens
  difficulty: "easy" | "medium" | "hard"
}

export const MINING_TASKS: Record<string, MiningTask> = {
  micro_task: {
    id: "micro_task",
    type: "micro_task",
    weight: 1.0,
    baseReward: 5,
    difficulty: "easy",
  },
  quiz: {
    id: "quiz",
    type: "quiz",
    weight: 1.2,
    baseReward: 6,
    difficulty: "medium",
  },
  sponsored: {
    id: "sponsored",
    type: "sponsored",
    weight: 2.0,
    baseReward: 10,
    difficulty: "medium",
  },
  referral: {
    id: "referral",
    type: "referral",
    weight: 0.5,
    baseReward: 2,
    difficulty: "easy",
  },
  compute: {
    id: "compute",
    type: "compute",
    weight: 1.5,
    baseReward: 7.5,
    difficulty: "hard",
  },
}

interface UserTrustMetrics {
  trustScore: number // 0-100
  completionRate: number // 0-100
  rejectionRate: number // 0-100
  accountAge: number // days
}

async function getUserTrustScore(userId: string): Promise<UserTrustMetrics> {
  const result = await query(
    `SELECT 
      COALESCE((completed_tasks::float / (completed_tasks + rejected_tasks + 1)) * 100, 50) as trust_score,
      COALESCE(completed_tasks::float / (completed_tasks + 1) * 100, 50) as completion_rate,
      COALESCE(rejected_tasks::float / (completed_tasks + rejected_tasks + 1) * 100, 0) as rejection_rate,
      EXTRACT(DAY FROM (NOW() - created_at)) as account_age
     FROM users WHERE id = $1`,
    [userId],
  )

  if (result.rows.length === 0) {
    return {
      trustScore: 50,
      completionRate: 50,
      rejectionRate: 0,
      accountAge: 0,
    }
  }

  return {
    trustScore: result.rows[0].trust_score,
    completionRate: result.rows[0].completion_rate,
    rejectionRate: result.rows[0].rejection_rate,
    accountAge: Math.floor(result.rows[0].account_age),
  }
}

async function getStakeMultiplier(userId: string): Promise<number> {
  const result = await query(
    `SELECT COALESCE(AVG(tier_multiplier), 1.0) as multiplier 
     FROM staking_positions 
     WHERE user_id = $1 AND end_time > NOW()`,
    [userId],
  )

  return result.rows[0]?.multiplier || 1.0
}

export async function calculateMiningReward(
  userId: string,
  taskType: string,
  submissionProof: string,
): Promise<number> {
  const task = MINING_TASKS[taskType]
  if (!task) throw new Error(`Unknown task type: ${taskType}`)

  // Get user metrics
  const trust = await getUserTrustScore(userId)
  const stakeMultiplier = await getStakeMultiplier(userId)

  // Trust multiplier (0.5 - 1.5x based on score)
  const trustMultiplier = Math.max(0.5, Math.min(1.5, trust.trustScore / 50))

  // Calculate base reward
  let reward = task.baseReward * task.weight * trustMultiplier * stakeMultiplier

  // Account age boost (extra 10% after 30 days)
  if (trust.accountAge > 30) {
    reward *= 1.1
  }

  // Round to 2 decimals
  return Math.round(reward * 100) / 100
}

export async function recordMiningSubmission(
  userId: string,
  taskType: string,
  taskId: string,
  submissionProof: string,
): Promise<{
  submissionId: string
  calculatedReward: number
  status: string
}> {
  const reward = await calculateMiningReward(userId, taskType, submissionProof)

  const result = await query(
    `INSERT INTO task_submissions 
     (user_id, task_id, task_type, submission_proof, calculated_reward, status) 
     VALUES ($1, $2, $3, $4, $5, 'pending_verification')
     RETURNING id, calculated_reward, status`,
    [userId, taskId, taskType, submissionProof, reward],
  )

  return {
    submissionId: result.rows[0].id,
    calculatedReward: result.rows[0].calculated_reward,
    status: result.rows[0].status,
  }
}

export async function verifyAndApproveSubmission(submissionId: string, approved: boolean): Promise<void> {
  if (approved) {
    const submission = await query(`SELECT user_id, calculated_reward, task_id FROM task_submissions WHERE id = $1`, [
      submissionId,
    ])

    if (submission.rows.length === 0) throw new Error("Submission not found")

    const { user_id, calculated_reward, task_id } = submission.rows[0]

    // Record reward in ledger
    await query(
      `INSERT INTO reward_ledger (user_id, task_id, amount, status) 
       VALUES ($1, $2, $3, 'pending_onchain')
       ON CONFLICT (user_id, task_id) DO UPDATE SET amount = amount + $3`,
      [user_id, task_id, calculated_reward],
    )

    // Update submission
    await query(`UPDATE task_submissions SET status = 'approved' WHERE id = $1`, [submissionId])

    // Update user stats
    await query(`UPDATE users SET completed_tasks = completed_tasks + 1 WHERE id = $1`, [user_id])
  } else {
    await query(`UPDATE task_submissions SET status = 'rejected' WHERE id = $1`, [submissionId])

    // Update rejection stats
    const submission = await query(`SELECT user_id FROM task_submissions WHERE id = $1`, [submissionId])
    if (submission.rows.length > 0) {
      await query(`UPDATE users SET rejected_tasks = rejected_tasks + 1 WHERE id = $1`, [submission.rows[0].user_id])
    }
  }
}
