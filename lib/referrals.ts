import { query } from "./database"

export async function createReferral(referrerId: string, referredUserId: string) {
  const result = await query(
    `INSERT INTO referrals (referrer_id, referred_user_id, status) 
     VALUES ($1, $2, 'pending') RETURNING *`,
    [referrerId, referredUserId],
  )
  return result.rows[0]
}

export async function getReferralStats(userId: string) {
  const result = await query(
    `SELECT COUNT(*) as referral_count, SUM(reward_tokens) as total_rewards 
     FROM referrals WHERE referrer_id = $1 AND status = 'active'`,
    [userId],
  )
  return result.rows[0]
}

export async function activateReferral(referralId: string, rewardTokens: number) {
  const result = await query(`UPDATE referrals SET status = 'active', reward_tokens = $1 WHERE id = $2 RETURNING *`, [
    rewardTokens,
    referralId,
  ])
  return result.rows[0]
}

export async function generateReferralLink(userId: string): Promise<string> {
  return `https://app.miner.io/ref/${Buffer.from(userId).toString("base64")}`
}
