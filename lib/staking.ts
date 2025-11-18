import { query } from "./database"

export async function createStakingPosition(userId: string, amount: number, lockDays: number, apy: number) {
  const lockUntil = lockDays > 0 ? new Date(Date.now() + lockDays * 24 * 60 * 60 * 1000) : null
  const result = await query(
    `INSERT INTO staking_positions (user_id, amount, lock_until, apy, status) 
     VALUES ($1, $2, $3, $4, 'active') RETURNING *`,
    [userId, amount, lockUntil, apy],
  )
  return result.rows[0]
}

export async function getUserStakingPositions(userId: string) {
  const result = await query("SELECT * FROM staking_positions WHERE user_id = $1 ORDER BY created_at DESC", [userId])
  return result.rows
}

export async function calculateStakingRewards(userId: string): Promise<number> {
  const positions = await getUserStakingPositions(userId)
  let totalRewards = 0

  const now = Date.now()
  for (const position of positions) {
    if (position.status === "active") {
      const timeStaked = (now - position.start_at.getTime()) / (1000 * 60 * 60 * 24) // days
      const yearlyRewards = (position.amount * position.apy) / 100
      const dailyRewards = yearlyRewards / 365
      totalRewards += dailyRewards * timeStaked
    }
  }

  return Math.floor(totalRewards)
}

export async function unstakePosition(positionId: string) {
  const result = await query(`UPDATE staking_positions SET status = 'unstaked' WHERE id = $1 RETURNING *`, [positionId])
  return result.rows[0]
}
