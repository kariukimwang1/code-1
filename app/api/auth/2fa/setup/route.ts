import { NextRequest, NextResponse } from "next/server"
import { getAuth } from "@/lib/auth"
import { query } from "@/lib/database"
import { authenticator } from 'otplib'
import QRCode from 'qrcode'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuth(req)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { enable } = await req.json()

    if (enable) {
      // Generate secret for 2FA
      const secret = authenticator.generateSecret()
      const issuer = 'MINER'
      const accountName = user.email

      const otpauthUrl = authenticator.keyuri(accountName, issuer, secret)

      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl)

      // Store secret temporarily (not enabled yet)
      await query(
        `UPDATE users SET
         two_factor_secret = $1,
         two_factor_enabled = FALSE,
         updated_at = NOW()
         WHERE id = $2`,
        [secret, user.userId]
      )

      return NextResponse.json({
        success: true,
        secret,
        qrCode: qrCodeDataURL,
        manualEntryKey: secret
      })

    } else {
      // Disable 2FA
      await query(
        `UPDATE users SET
         two_factor_secret = NULL,
         two_factor_enabled = FALSE,
         updated_at = NOW()
         WHERE id = $1`,
        [user.userId]
      )

      return NextResponse.json({
        success: true,
        message: "2FA disabled successfully"
      })
    }

  } catch (error) {
    console.error("Error setting up 2FA:", error)
    return NextResponse.json(
      { error: "Failed to setup 2FA" },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getAuth(req)
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user's 2FA status
    const userResult = await query(
      "SELECT two_factor_enabled FROM users WHERE id = $1",
      [user.userId]
    )

    const twoFactorEnabled = userResult.rows[0]?.two_factor_enabled || false

    return NextResponse.json({
      twoFactorEnabled
    })

  } catch (error) {
    console.error("Error getting 2FA status:", error)
    return NextResponse.json(
      { error: "Failed to get 2FA status" },
      { status: 500 }
    )
  }
}