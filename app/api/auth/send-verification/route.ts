import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { randomBytes } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Check if user exists
    const userResult = await query(
      "SELECT id, email_verified FROM users WHERE email = $1",
      [email]
    )

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    const user = userResult.rows[0]

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Store verification token
    await query(
      `INSERT INTO email_verifications (user_id, email, token, expires_at, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (user_id)
       DO UPDATE SET
         token = EXCLUDED.token,
         expires_at = EXCLUDED.expires_at,
         created_at = NOW()`,
      [user.id, email, verificationToken, expiresAt]
    )

    // In production, send actual email
    // For now, we'll just return the verification URL for testing
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}&email=${encodeURIComponent(email)}`

    console.log("Verification email would be sent with URL:", verificationUrl)

    // TODO: Implement actual email sending
    // Example with nodemailer or SendGrid:
    /*
    const sgMail = require('@sendgrid/mail')
    sgMail.setApiKey(process.env.SENDGRID_API_KEY)

    const msg = {
      to: email,
      from: 'noreply@miner.com',
      subject: 'Verify your MINER account',
      html: `
        <h2>Welcome to MINER!</h2>
        <p>Thank you for signing up. Please verify your email address by clicking the link below:</p>
        <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
          Verify Email Address
        </a>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't create an account, please ignore this email.</p>
      `
    }

    await sgMail.send(msg)
    */

    return NextResponse.json({
      success: true,
      message: "Verification email sent successfully",
      // For development/testing only
      verificationUrl: process.env.NODE_ENV === 'development' ? verificationUrl : undefined
    })

  } catch (error) {
    console.error("Error sending verification email:", error)
    return NextResponse.json(
      { error: "Failed to send verification email" },
      { status: 500 }
    )
  }
}