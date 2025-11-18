import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { createStakingPosition } from "@/lib/staking"

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

    const { amount, lockDays } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    const apy = [5, 15, 25][lockDays === 0 ? 0 : lockDays === 30 ? 1 : 2]
    const position = await createStakingPosition(payload.userId, amount, lockDays, apy)

    return NextResponse.json({ position }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Staking failed" }, { status: 500 })
  }
}
