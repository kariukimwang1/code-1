import { type NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { recordMiningSubmission } from "@/lib/mining-engine"
import { getAuth } from "@/lib/auth"

/**
 * POST /api/mining/submit
 * Submit a mining task for reward calculation
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getAuth(req)
    if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { taskType, taskId, submissionProof } = body

    if (!taskType || !taskId || !submissionProof) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate task exists
    const taskResult = await query(`SELECT id FROM tasks WHERE id = $1 LIMIT 1`, [taskId])
    if (taskResult.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Record submission and calculate reward
    const submission = await recordMiningSubmission(payload.userId, taskType, taskId, submissionProof)

    return NextResponse.json(
      {
        success: true,
        submissionId: submission.submissionId,
        calculatedReward: submission.calculatedReward,
        status: submission.status,
        message: "Mining submission recorded and pending verification",
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Mining submission error:", error)
    return NextResponse.json({ error: "Failed to submit mining task" }, { status: 500 })
  }
}
