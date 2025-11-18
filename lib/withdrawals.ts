import { query } from "./database"

export async function createWithdrawal(userId: string, amountUsd: number, method = "paypal") {
  const feeUsd = amountUsd * 0.02 // 2% fee
  const result = await query(
    `INSERT INTO withdrawals (user_id, amount_usd, fee_usd, payout_method, status) 
     VALUES ($1, $2, $3, $4, 'initiated') RETURNING *`,
    [userId, amountUsd, feeUsd, method],
  )
  return result.rows[0]
}

export async function getPendingWithdrawals(limit = 50) {
  const result = await query(
    `SELECT w.*, u.email, u.payee_email, u.kyc_level 
     FROM withdrawals w JOIN users u ON w.user_id = u.id 
     WHERE w.status = 'initiated' 
     ORDER BY w.created_at ASC LIMIT $1`,
    [limit],
  )
  return result.rows
}

export async function processWithdrawal(withdrawalId: string, adminId: string, txRef: string) {
  const result = await query(
    `UPDATE withdrawals SET status = 'pending', admin_id = $1, tx_ref = $2, processed_at = NOW() 
     WHERE id = $3 RETURNING *`,
    [adminId, txRef, withdrawalId],
  )
  return result.rows[0]
}

export async function completeWithdrawal(withdrawalId: string) {
  const result = await query(`UPDATE withdrawals SET status = 'paid' WHERE id = $1 RETURNING *`, [withdrawalId])
  return result.rows[0]
}

export async function getUserWithdrawals(userId: string) {
  const result = await query("SELECT * FROM withdrawals WHERE user_id = $1 ORDER BY created_at DESC", [userId])
  return result.rows
}
