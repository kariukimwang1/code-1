import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getAuth } from "@/lib/auth"

/**
 * GET /api/mining/status
 * Get user's mining stats and pending rewards
 */
export async function GET(req: NextRequest) {
  try {
    const payload = await getAuth(req)
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // Get today's mining stats
    const statsResult = await query(
      `SELECT 
        COUNT(*) as total_submissions,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'pending_verification' THEN 1 ELSE 0 END) as pending_count,
        COALESCE(SUM(CASE WHEN status = 'approved' THEN calculated_reward ELSE 0 END), 0) as earned_today,
        (SELECT COALESCE(SUM(amount), 0) FROM reward_ledger WHERE user_id = $1 AND status = 'pending_onchain') as pending_onchain
       FROM task_submissions 
       WHERE user_id = $1 AND DATE(created_at) = CURRENT_DATE`,
      [payload.userId],
    )

    // Get user balance
    const balanceResult = await query(
      `SELECT available_balance, pending_balance FROM user_balances WHERE user_id = $1`,
      [payload.userId],
    )

    const stats = statsResult.rows[0]
    const balance = balanceResult.rows[0] || { available_balance: 0, pending_balance: 0 }

    return NextResponse.json({
      mining: {
        totalSubmissions: Number.parseInt(stats.total_submissions),
        approvedCount: Number.parseInt(stats.approved_count),
        pendingCount: Number.parseInt(stats.pending_count),
        earnedToday: Number.parseFloat(stats.earned_today),
        pendingOnchain: Number.parseFloat(stats.pending_onchain),
      },
      balance: {
        available: Number.parseFloat(balance.available_balance),
        pending: Number.parseFloat(balance.pending_balance),
      },
    })
  } catch (error) {
    console.error("Mining status error:", error)
    return NextResponse.json({ error: "Failed to fetch mining status" }, { status: 500 })
  }
}
