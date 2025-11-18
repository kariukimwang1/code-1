import { NextRequest, NextResponse } from "next/server"
import { signJWT } from "@/lib/auth"
import { createUser, getUserByEmail } from "@/lib/auth"
import { query } from "@/lib/database"

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET
const REDIRECT_URI = process.env.NEXTAUTH_URL + "/api/auth/google/callback"

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  // Handle OAuth errors
  if (error) {
    console.error("Google OAuth error:", error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/login?error=${encodeURIComponent("Google authentication failed")}`
    )
  }

  // If no code, redirect to Google OAuth
  if (!code) {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=openid email profile&` +
      `access_type=offline&` +
      `prompt=consent`

    return NextResponse.redirect(authUrl)
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID!,
        client_secret: GOOGLE_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error("Token exchange error:", tokenData.error)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=${encodeURIComponent("Failed to exchange authorization code")}`
      )
    }

    // Get user info
    const userResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
    )

    const userData = await userResponse.json()

    if (userData.error) {
      console.error("User info error:", userData.error)
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/login?error=${encodeURIComponent("Failed to get user information")}`
      )
    }

    // Check if user exists
    let user = await getUserByEmail(userData.email)

    if (!user) {
      // Create new user with Google data
      user = await createUser(
        userData.email,
        null, // No password for OAuth users
        userData.email // Use email as temporary wallet address
      )

      // Update user with Google profile data
      await query(
        `UPDATE users SET
         google_id = $1,
         avatar_url = $2,
         full_name = $3,
         email_verified = TRUE,
         oauth_provider = 'google'
         WHERE id = $4`,
        [
          userData.id,
          userData.picture,
          userData.name,
          user.id
        ]
      )
    } else {
      // Update existing user's OAuth info if needed
      await query(
        `UPDATE users SET
         google_id = COALESCE(google_id, $1),
         avatar_url = COALESCE(avatar_url, $2),
         full_name = COALESCE(full_name, $3),
         email_verified = TRUE,
         last_login = NOW(),
         oauth_provider = COALESCE(oauth_provider, 'google')
         WHERE id = $4`,
        [
          userData.id,
          userData.picture,
          userData.name,
          user.id
        ]
      )
    }

    // Initialize user balance if needed
    await query(
      `INSERT INTO user_balances (user_id, token_balance, usdc_balance, pending_rewards)
       VALUES ($1, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING`,
      [user.id]
    )

    // Create JWT token
    const token = signJWT({
      userId: user.id,
      email: user.email,
      role: user.role || "user"
    })

    // Redirect to frontend with token
    const redirectUrl = `${process.env.NEXTAUTH_URL}/dashboard?token=${token}&provider=google`

    return NextResponse.redirect(redirectUrl)

  } catch (error) {
    console.error("Google OAuth error:", error)
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/login?error=${encodeURIComponent("Authentication failed. Please try again.")}`
    )
  }
}