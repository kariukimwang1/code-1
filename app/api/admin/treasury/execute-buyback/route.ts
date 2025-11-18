import { type NextRequest, NextResponse } from "next/server"
import { executeBuyback, calculateOptimalBuybackPrice } from "@/lib/treasury-manager"

/**
 * POST /api/admin/treasury/execute-buyback
 * Execute token buyback operation
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-admin-key")
    if (apiKey !== process.env.ADMIN_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { usdcAmount, pricePerToken } = body

    if (!usdcAmount) {
      return NextResponse.json({ error: "USDC amount required" }, { status: 400 })
    }

    const price = pricePerToken || (await calculateOptimalBuybackPrice())

    const result = await executeBuyback(usdcAmount, price)

    return NextResponse.json(
      {
        success: true,
        buyback: result,
        message: "Buyback executed successfully",
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("Buyback execution error:", error)
    return NextResponse.json({ error: "Failed to execute buyback" }, { status: 500 })
  }
}
