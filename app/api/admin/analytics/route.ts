import { type NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth"
import { Pool } from "pg"

const pool = new Pool({
  connectionString: process.env.NEON_POSTGRES_URL,
})

export async function GET(request: NextRequest) {
  try {
    const auth = getAuth(request)
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminCheck = await pool.query(`SELECT role FROM users WHERE id = $1`, [auth.userId])

    if (!adminCheck.rows[0] || adminCheck.rows[0].role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const miningStats = await pool.query(
      `SELECT date, total_revenue, total_tokens_minted, active_users, total_tasks_completed
       FROM daily_mining_records
       WHERE date >= CURRENT_DATE - INTERVAL '7 days'
       ORDER BY date DESC`,
    )

    const revenueBreakdown = await pool.query(
      `SELECT source, SUM(amount) as total_amount, COUNT(*) as transaction_count
       FROM revenue_streams
       WHERE DATE(timestamp) = CURRENT_DATE
       GROUP BY source`,
    )

    const userStats = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as active_users_24h
       FROM task_submissions
       WHERE submitted_at >= NOW() - INTERVAL '24 hours'`,
    )

    const paymentStats = await pool.query(
      `SELECT COUNT(*) as total_payments
       FROM payment_transactions
       WHERE DATE(created_at) = CURRENT_DATE`,
    )

    return NextResponse.json({
      miningStats: miningStats.rows,
      revenueBreakdown: revenueBreakdown.rows,
      activeUsers24h: userStats.rows[0]?.active_users_24h || 0,
      paymentsProcessedToday: paymentStats.rows[0]?.total_payments || 0,
      timestamp: new Date(),
    })
  } catch (error) {
    console.error("[v0] Analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
