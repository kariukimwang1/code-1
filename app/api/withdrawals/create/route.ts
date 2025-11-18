import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT, getUserById } from "@/lib/auth"
import { createWithdrawal } from "@/lib/withdrawals"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const user = await getUserById(payload.userId)
    if (!user || user.kyc_level === 0) {
      return NextResponse.json({ error: "KYC verification required" }, { status: 403 })
    }

    const { amount_usd, payout_method } = await request.json()

    if (!amount_usd || amount_usd <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const withdrawal = await createWithdrawal(payload.userId, amount_usd, payout_method || "paypal")

    return NextResponse.json({ withdrawal }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Withdrawal failed" }, { status: 500 })
  }
}
