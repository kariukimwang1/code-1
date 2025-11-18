import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import { query } from "./database"
import type { NextRequest } from "next/server"

export interface JWTPayload {
  userId: string
  email: string
  role?: string
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getAuth(req: NextRequest): Promise<JWTPayload | null> {
  const authHeader = req.headers.get("authorization")
  if (!authHeader) return null

  const token = authHeader.replace("Bearer ", "")
  return verifyJWT(token)
}

export async function createUser(email: string, password: string, walletAddress?: string) {
  const passwordHash = await hashPassword(password)
  const result = await query(
    `INSERT INTO users (email, password_hash, wallet_address) 
     VALUES ($1, $2, $3) RETURNING id, email`,
    [email, passwordHash, walletAddress || null],
  )
  return result.rows[0]
}

export async function getUserByEmail(email: string) {
  const result = await query("SELECT * FROM users WHERE email = $1", [email])
  return result.rows[0] || null
}

export async function getUserById(userId: string) {
  const result = await query("SELECT * FROM users WHERE id = $1", [userId])
  return result.rows[0] || null
}

export async function getUserBalance(userId: string) {
  const result = await query("SELECT * FROM user_balances WHERE user_id = $1", [userId])
  return result.rows[0] || null
}

export async function initializeUserBalance(userId: string) {
  await query(
    `INSERT INTO user_balances (user_id, token_balance, usdc_balance, pending_rewards) 
     VALUES ($1, 0, 0, 0) ON CONFLICT (user_id) DO NOTHING`,
    [userId],
  )
}
