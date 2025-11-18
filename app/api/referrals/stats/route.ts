import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { getReferralStats, generateReferralLink } from "@/lib/referrals"

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1]
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const stats = await getReferralStats(payload.userId)
    const referralLink = await generateReferralLink(payload.userId)

    return NextResponse.json({ stats, referralLink })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch referral stats" }, { status: 500 })
  }
}
