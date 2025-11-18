import { query } from "./database"
import { ethers } from "ethers"

/**
 * Batch Distributor - Processes pending rewards and creates blockchain batches
 * Handles daily caps, nonce management, and signature generation
 */

export interface BatchReward {
  userAddress: string
  amount: string // in wei
  taskHash: string
  nonce: number
}

export interface ProcessedBatch {
  batchId: number
  rewardCount: number
  totalAmount: string
  signature: string
  txHash?: string
  status: "pending" | "submitted" | "confirmed" | "failed"
}

async function getRewardSigningKey(): Promise<string> {
  const key = process.env.REWARD_SIGNER_KEY
  if (!key) throw new Error("REWARD_SIGNER_KEY not configured")
  return key
}

async function getPendingRewards(limit = 100): Promise<BatchReward[]> {
  const result = await query(
    `SELECT 
      u.wallet_address as user_address,
      (rl.amount * 10^18)::TEXT as amount,
      ENCODE(DIGEST(rl.task_id, 'sha256'), 'hex') as task_hash,
      COALESCE(rc.nonce, 0) + 1 as nonce
     FROM reward_ledger rl
     JOIN users u ON rl.user_id = u.id
     LEFT JOIN reward_claims rc ON rl.user_id = rc.user_id
     WHERE rl.status = 'pending_onchain' AND u.wallet_address IS NOT NULL
     ORDER BY rl.created_at ASC
     LIMIT $1`,
    [limit],
  )

  return result.rows
}

export async function createRewardBatch(batchSize = 100): Promise<ProcessedBatch> {
  const pendingRewards = await getPendingRewards(batchSize)

  if (pendingRewards.length === 0) {
    throw new Error("No pending rewards to process")
  }

  // Calculate total
  const totalAmount = pendingRewards.reduce((sum, r) => sum + BigInt(r.amount), BigInt(0))

  // Create batch ID
  const batchId = Math.floor(Date.now() / 1000)

  // Sign batch
  const signingKey = await getRewardSigningKey()
  const signer = new ethers.Wallet(signingKey)

  const batchMessage = ethers.solidityPacked(
    ["uint256", "address[]", "uint256[]", "bytes32[]"],
    [
      batchId,
      pendingRewards.map((r) => r.userAddress),
      pendingRewards.map((r) => BigInt(r.amount)),
      pendingRewards.map((r) => r.taskHash),
    ],
  )

  const signature = await signer.signMessage(ethers.getBytes(batchMessage))

  // Record batch in DB
  await query(
    `INSERT INTO reward_batches (batch_id, total_amount, reward_count, signature, status)
     VALUES ($1, $2, $3, $4, 'pending')`,
    [batchId.toString(), totalAmount.toString(), pendingRewards.length, signature],
  )

  // Mark rewards as submitted
  for (const reward of pendingRewards) {
    await query(
      `UPDATE reward_ledger SET status = 'batch_submitted', batch_id = $1
       WHERE user_id = (SELECT id FROM users WHERE wallet_address = $2)`,
      [batchId.toString(), reward.userAddress],
    )
  }

  return {
    batchId: batchId,
    rewardCount: pendingRewards.length,
    totalAmount: totalAmount.toString(),
    signature,
    status: "pending",
  }
}

export async function executeRewardBatch(
  provider: ethers.Provider,
  rewardDistributorAddress: string,
  batchId: number,
  rewards: BatchReward[],
  signature: string,
): Promise<string> {
  const signerKey = process.env.DEPLOYER_PRIVATE_KEY
  if (!signerKey) throw new Error("DEPLOYER_PRIVATE_KEY not set")

  const signer = new ethers.Wallet(signerKey, provider)

  // Get contract ABI
  const abi = [
    `function processBatch(
      address[] calldata users,
      uint256[] calldata amounts,
      bytes32[] calldata taskHashes,
      bytes calldata signature
    ) external`,
  ]

  const contract = new ethers.Contract(rewardDistributorAddress, abi, signer)

  try {
    const tx = await contract.processBatch(
      rewards.map((r) => r.userAddress),
      rewards.map((r) => BigInt(r.amount)),
      rewards.map((r) => r.taskHash),
      signature,
    )

    const receipt = await tx.wait()

    // Update batch status
    await query(
      `UPDATE reward_batches SET status = 'confirmed', tx_hash = $1
       WHERE batch_id = $2`,
      [receipt?.hash || tx.hash, batchId.toString()],
    )

    // Update individual rewards
    await query(
      `UPDATE reward_ledger SET status = 'claimed'
       WHERE status = 'batch_submitted' AND batch_id = $1`,
      [batchId.toString()],
    )

    return tx.hash
  } catch (error) {
    await query(
      `UPDATE reward_batches SET status = 'failed', error = $1
       WHERE batch_id = $2`,
      [String(error), batchId.toString()],
    )
    throw error
  }
}

export async function resetDailyEmissionCap(): Promise<void> {
  const resetTime = new Date()
  resetTime.setUTCHours(0, 0, 0, 0)

  await query(
    `INSERT INTO daily_metrics (reset_date, daily_cap, daily_emitted)
     VALUES ($1, 500000, 0)
     ON CONFLICT (reset_date) DO UPDATE SET daily_emitted = 0`,
    [resetTime],
  )
}
