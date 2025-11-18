import { type NextRequest, NextResponse } from "next/server"
import { createUser, initializeUserBalance, signJWT } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const user = await createUser(email, password)
    await initializeUserBalance(user.id)

    const token = signJWT({ userId: user.id, email: user.email })

    return NextResponse.json({ token, user }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Signup failed" }, { status: 500 })
  }
}
