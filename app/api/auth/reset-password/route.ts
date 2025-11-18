import { NextRequest, NextResponse } from "next/server"
import { query } from "@/lib/database"
import { randomBytes } from "crypto"
import bcrypt from "bcrypt"

export async function POST(req: NextRequest) {
  try {
    const { email, token, newPassword } = await req.json()

    // Handle password reset request (send email)
    if (email && !token && !newPassword) {
      // Check if user exists
      const userResult = await query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      )

      if (userResult.rows.length === 0) {
        // Don't reveal if email exists for security
        return NextResponse.json({
          success: true,
          message: "If an account exists with this email, a password reset link has been sent."
        })
      }

      const user = userResult.rows[0]

      // Generate reset token
      const resetToken = randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour

      // Store reset token
      await query(
        `INSERT INTO password_resets (user_id, email, token, expires_at, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           token = EXCLUDED.token,
           expires_at = EXCLUDED.expires_at,
           created_at = NOW()`,
        [user.id, email, resetToken, expiresAt]
      )

      // In production, send actual email
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`

      console.log("Password reset email would be sent with URL:", resetUrl)

      // TODO: Implement actual email sending
      /*
      const sgMail = require('@sendgrid/mail')
      sgMail.setApiKey(process.env.SENDGRID_API_KEY)

      const msg = {
        to: email,
        from: 'noreply@miner.com',
        subject: 'Reset your MINER password',
        html: `
          <h2>Reset Your Password</h2>
          <p>You requested to reset your password for your MINER account.</p>
          <p>Click the link below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Reset Password
          </a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        `
      }

      await sgMail.send(msg)
      */

      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
        // For development/testing only
        resetUrl: process.env.NODE_ENV === 'development' ? resetUrl : undefined
      })
    }

    // Handle password reset confirmation (update password)
    if (token && newPassword && email) {
      // Validate reset token
      const resetResult = await query(
        `SELECT r.user_id, r.expires_at, u.email
         FROM password_resets r
         JOIN users u ON r.user_id = u.id
         WHERE r.token = $1 AND r.email = $2`,
        [token, email]
      )

      if (resetResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Invalid or expired reset token" },
          { status: 400 }
        )
      }

      const reset = resetResult.rows[0]

      // Check if token is expired
      if (new Date() > new Date(reset.expires_at)) {
        return NextResponse.json(
          { error: "Reset token has expired" },
          { status: 400 }
        )
      }

      // Validate new password
      if (newPassword.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters long" },
          { status: 400 }
        )
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10)

      // Update user password
      await query(
        `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
        [passwordHash, reset.user_id]
      )

      // Delete reset token
      await query(
        `DELETE FROM password_resets WHERE token = $1`,
        [token]
      )

      return NextResponse.json({
        success: true,
        message: "Password reset successfully. You can now login with your new password."
      })
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Error in password reset:", error)
    return NextResponse.json(
      { error: "Password reset failed. Please try again." },
      { status: 500 }
    )
  }
}