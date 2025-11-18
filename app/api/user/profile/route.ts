import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT, getUserById, getUserBalance } from "@/lib/auth"

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

    const user = await getUserById(payload.userId)
    const balance = await getUserBalance(payload.userId)

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      user: { id: user.id, email: user.email, wallet_address: user.wallet_address },
      balance,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}
