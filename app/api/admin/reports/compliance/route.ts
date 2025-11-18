import { type NextRequest, NextResponse } from "next/server"
import { generateComplianceReport } from "@/lib/audit-logger"

/**
 * GET /api/admin/reports/compliance
 * Generate compliance report for auditors/regulators
 */
export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-admin-key")
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const days = Number.parseInt(searchParams.get("days") || "30")

    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const report = await generateComplianceReport(startDate, endDate)

    return NextResponse.json({
      success: true,
      reportPeriod: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days,
      },
      summary: {
        totalTransactions: report.totalTransactions,
        totalRewardsDistributed: report.totalRewardsDistributed,
        totalWithdrawals: report.totalWithdrawals,
        totalUsers: report.totalUsers,
      },
      alerts: {
        highValueTransactionCount: report.highValueTransactions.length,
        suspiciousActivityCount: report.suspiciousActivities.length,
        flaggedUsers: report.suspiciousActivities.map((a) => ({
          userId: a.user_id,
          rejectionCount: a.rejection_count,
        })),
      },
      highValueTransactions: report.highValueTransactions.slice(0, 10),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Compliance report error:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
