import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmail, comparePassword, signJWT } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const user = await getUserByEmail(email)
    if (!user || !user.password_hash) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const passwordValid = await comparePassword(password, user.password_hash)
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = signJWT({ userId: user.id, email: user.email })

    return NextResponse.json({ token, user: { id: user.id, email: user.email } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Login failed" }, { status: 500 })
  }
}
