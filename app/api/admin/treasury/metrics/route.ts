import { type NextRequest, NextResponse } from "next/server"
import { getTreasuryMetrics } from "@/lib/treasury-manager"

/**
 * GET /api/admin/treasury/metrics
 * Get comprehensive treasury metrics (admin only)
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-admin-key")
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const metrics = await getTreasuryMetrics()

    return NextResponse.json({
      success: true,
      metrics,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Treasury metrics error:", error)
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 })
  }
}
