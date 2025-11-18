import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth"
import { query } from "@/lib/database"
import { authenticator } from 'otplib'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuth(req)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { token } = await req.json()

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      )
    }

    // Get user's 2FA secret
    const userResult = await query(
      "SELECT two_factor_secret FROM users WHERE id = $1",
      [user.userId]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const twoFactorSecret = userResult.rows[0].two_factor_secret

    if (!twoFactorSecret) {
      return NextResponse.json(
        { error: "2FA not set up for this user" },
        { status: 400 }
      )
    }

    // Verify the token
    const isValid = authenticator.verify({
      token,
      secret: twoFactorSecret
    })

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid verification code" },
        { status: 400 }
      )
    }

    // Enable 2FA for the user
    await query(
      `UPDATE users SET
         two_factor_enabled = TRUE,
         updated_at = NOW()
         WHERE id = $1`,
      [user.userId]
    )

    return NextResponse.json({
      success: true,
      message: "2FA enabled successfully"
    })

  } catch (error) {
    console.error("Error verifying 2FA:", error)
    return NextResponse.json(
      { error: "Failed to verify 2FA" },
      { status: 500 }
    )
  }
}