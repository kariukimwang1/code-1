import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { getAuth } from "@/lib/auth"

/**
 * POST /api/staking/claim-rewards
 * Claim earned staking rewards
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getAuth(req)
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { positionId } = body

    if (!positionId) {
      return NextResponse.json({ error: "Position ID required" }, { status: 400 })
    }

    // Get position and calculate rewards
    const posResult = await query(
      `SELECT sp.*, st.apy_bps
       FROM staking_positions sp
       JOIN staking_tiers st ON sp.tier_id = st.id
       WHERE sp.id = $1 AND sp.user_id = $2`,
      [positionId, payload.userId],
    )

    if (posResult.rows.length === 0) {
      return NextResponse.json({ error: "Position not found" }, { status: 404 })
    }

    const position = posResult.rows[0]

    // Calculate accrued rewards since last claim
    const now = Date.now()
    const lastClaim = new Date(position.last_claim_time).getTime()
    const timeDiff = (now - lastClaim) / (1000 * 60 * 60 * 24) // days
    const yearlyRewards = (position.amount * position.apy_bps) / 10000
    const accruedRewards = (yearlyRewards * timeDiff) / 365

    // Record reward in ledger
    await query(
      `INSERT INTO reward_ledger (user_id, task_id, amount, status)
       VALUES ($1, $2, $3, 'pending_onchain')`,
      [payload.userId, `staking-${positionId}`, accruedRewards],
    )

    // Update last claim time
    await query(`UPDATE staking_positions SET last_claim_time = NOW() WHERE id = $1`, [positionId])

    return NextResponse.json(
      {
        success: true,
        rewardClaimed: accruedRewards,
        message: "Staking rewards claimed and pending blockchain confirmation",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Staking reward error:", error)
    return NextResponse.json({ error: "Failed to claim staking rewards" }, { status: 500 })
  }
}
