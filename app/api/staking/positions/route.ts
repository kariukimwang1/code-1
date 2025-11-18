import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { getUserStakingPositions } from "@/lib/staking"

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

    const positions = await getUserStakingPositions(payload.userId)
    return NextResponse.json({ positions })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch positions" }, { status: 500 })
  }
}
