import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { signJWT } from "@/lib/auth"

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    if (!token || !email) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=${encodeURIComponent("Invalid verification link")}`
      )
    }

    // Find verification token
    const verificationResult = await query(
      `SELECT v.user_id, v.expires_at, u.email_verified
       FROM email_verifications v
       JOIN users u ON v.user_id = u.id
       WHERE v.token = $1 AND v.email = $2`,
      [token, email]
    )

    if (verificationResult.rows.length === 0) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=${encodeURIComponent("Invalid or expired verification link")}`
      )
    }

    const verification = verificationResult.rows[0]

    // Check if token is expired
    if (new Date() > new Date(verification.expires_at)) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=${encodeURIComponent("Verification link has expired")}`
      )
    }

    // Mark email as verified
    await query(
      `UPDATE users SET email_verified = TRUE WHERE id = $1`,
      [verification.user_id]
    )

    // Delete verification token
    await query(
      `DELETE FROM email_verifications WHERE token = $1`,
      [token]
    )

    // Get user data for JWT
    const userResult = await query(
      `SELECT id, email, role FROM users WHERE id = $1`,
      [verification.user_id]
    )

    const user = userResult.rows[0]

    // Create JWT token
    const jwtToken = signJWT({
      userId: user.id,
      email: user.email,
      role: user.role || "user"
    })

    // Redirect to dashboard with success message
    const redirectUrl = `${process.env.NEXTAUTH_URL}/dashboard?verified=true&token=${jwtToken}`

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error("Error verifying email:", error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/login?error=${encodeURIComponent("Email verification failed. Please try again.")}`
    )
  }
}