import { query } from "./database"
import { ethers } from "ethers"

export interface RewardRecord {
  userId: string
  taskId: string
  amount: number
}

export async function recordReward(record: RewardRecord) {
  const result = await query(
    `INSERT INTO reward_ledger (user_id, task_id, amount, status) 
     VALUES ($1, $2, $3, 'pending') RETURNING id`,
    [record.userId, record.taskId, record.amount],
  )
  return result.rows[0]
}

export async function getPendingRewards(userId: string) {
  const result = await query(
    `SELECT SUM(amount) as total FROM reward_ledger 
     WHERE user_id = $1 AND status = 'pending'`,
    [userId],
  )
  return result.rows[0]?.total || 0
}

export async function claimRewards(userId: string) {
  const result = await query(
    `UPDATE user_balances SET pending_rewards = 0 
     WHERE user_id = $1 RETURNING *`,
    [userId],
  )
  return result.rows[0]
}

export async function signRewardData(userId: string, amount: number, taskId: string): Promise<string> {
  const rewardData = ethers.solidityPacked(["address", "uint256", "bytes32"], [userId, amount, ethers.id(taskId)])

  const signer = new ethers.Wallet(process.env.REWARD_SIGNER_KEY!)
  return signer.signMessage(ethers.getBytes(rewardData))
}
