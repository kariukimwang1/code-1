import { type NextRequest, NextResponse } from "next/server"
import { createRewardBatch } from "@/lib/batch-distributor"
import { query } from "@/lib/database"

/**
 * POST /api/rewards/batch-process
 * Admin endpoint to create and submit reward batch
 * Called by cron job every hour
 */
export async function POST(req: NextRequest) {
  try {
    // Verify admin API key
    const apiKey = req.headers.get("x-admin-key")
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { batchSize = 100 } = body

    // Get pending reward count
    const countResult = await query(
      `SELECT COUNT(*) as pending_count FROM reward_ledger WHERE status = 'pending_onchain'`,
    )

    const pendingCount = Number.parseInt(countResult.rows[0].pending_count)

    if (pendingCount === 0) {
      return NextResponse.json({ message: "No pending rewards to process", batchesCreated: 0 }, { status: 200 })
    }

    const batchCount = Math.ceil(pendingCount / batchSize)
    const batches = []

    for (let i = 0; i < batchCount; i++) {
      try {
        const batch = await createRewardBatch(batchSize)
        batches.push({
          batchId: batch.batchId,
          rewardCount: batch.rewardCount,
          totalAmount: batch.totalAmount,
        })
      } catch (error) {
        console.error(`Error creating batch ${i + 1}:`, error)
      }
    }

    return NextResponse.json(
      {
        success: true,
        batchesCreated: batches.length,
        totalRewardsPending: pendingCount,
        batches,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Batch processing error:", error)
    return NextResponse.json({ error: "Failed to process reward batch" }, { status: 500 })
  }
}
