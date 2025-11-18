import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"

/**
 * GET /api/admin/reports/daily-summary
 * Daily summary report of platform activity
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-admin-key")
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Mining activity
    const miningResult = await query(
      `SELECT 
        COUNT(DISTINCT user_id) as active_miners,
        COUNT(*) as total_submissions,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'approved' THEN calculated_reward ELSE 0 END) as total_earned
       FROM task_submissions
       WHERE created_at >= $1`,
      [today],
    )

    // Withdrawal activity
    const withdrawalResult = await query(
      `SELECT 
        COUNT(*) as total_withdrawals,
        SUM(amount) as total_amount,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count
       FROM withdrawals
       WHERE created_at >= $1`,
      [today],
    )

    // Staking activity
    const stakingResult = await query(
      `SELECT 
        COUNT(*) as total_stakes,
        SUM(amount) as total_staked,
        COUNT(DISTINCT user_id) as staking_users
       FROM staking_positions
       WHERE created_at >= $1`,
      [today],
    )

    // New users
    const usersResult = await query(
      `SELECT 
        COUNT(*) as new_users,
        COUNT(CASE WHEN kyc_level >= 1 THEN 1 END) as kyc_verified
       FROM users
       WHERE created_at >= $1`,
      [today],
    )

    // Daily metrics
    const metricsResult = await query(`SELECT * FROM daily_metrics WHERE reset_date = CURRENT_DATE`)

    return NextResponse.json({
      success: true,
      date: today.toISOString(),
      mining: {
        activeminers: Number.parseInt(miningResult.rows[0]?.active_miners) || 0,
        totalSubmissions: Number.parseInt(miningResult.rows[0]?.total_submissions) || 0,
        approvedSubmissions: Number.parseInt(miningResult.rows[0]?.approved) || 0,
        totalEarned: Number.parseFloat(miningResult.rows[0]?.total_earned) || 0,
      },
      withdrawals: {
        totalCount: Number.parseInt(withdrawalResult.rows[0]?.total_withdrawals) || 0,
        totalAmount: Number.parseFloat(withdrawalResult.rows[0]?.total_amount) || 0,
        pendingCount: Number.parseInt(withdrawalResult.rows[0]?.pending_count) || 0,
      },
      staking: {
        totalStakes: Number.parseInt(stakingResult.rows[0]?.total_stakes) || 0,
        totalStaked: Number.parseFloat(stakingResult.rows[0]?.total_staked) || 0,
        stakingUsers: Number.parseInt(stakingResult.rows[0]?.staking_users) || 0,
      },
      users: {
        newUsers: Number.parseInt(usersResult.rows[0]?.new_users) || 0,
        kycVerified: Number.parseInt(usersResult.rows[0]?.kyc_verified) || 0,
      },
      emissions: metricsResult.rows[0] || {
        daily_cap: 500000,
        daily_emitted: 0,
      },
    })
  } catch (error) {
    console.error("Daily summary error:", error)
    return NextResponse.json({ error: "Failed to generate summary" }, { status: 500 })
  }
}
