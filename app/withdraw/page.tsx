"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { LinkIcon, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface WithdrawalHistory {
  id: string
  amount_usd: number
  fee_usd: number
  status: string
  created_at: string
  processed_at?: string
}

interface Balance {
  usdc_balance: number
  token_balance: number
}

export default function WithdrawPage() {
  const [amount, setAmount] = useState("")
  const [balance, setBalance] = useState<Balance | null>(null)
  const [payeeEmail, setPayeeEmail] = useState("")
  const [kycLevel, setKycLevel] = useState(0)
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [history, setHistory] = useState<WithdrawalHistory[]>([])

  const WITHDRAWAL_LIMITS = {
    0: 50, // Level 0: $50/day
    1: 200, // Level 1: $200/day
    2: 1000, // Level 2: $1000/day
  }

  const WITHDRAWAL_FEE_PERCENT = 2

  useEffect(() => {
    async function fetchUserData() {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          window.location.href = "/login"
          return
        }

        const profileRes = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (!profileRes.ok) throw new Error("Failed to fetch profile")
        const profileData = await profileRes.json()

        setBalance(profileData.balance)
        setPayeeEmail(profileData.user.payee_email || "")
        setKycLevel(profileData.user.kyc_level || 0)

        // Fetch withdrawal history
        const historyRes = await fetch("/api/withdrawals/history", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (historyRes.ok) {
          const historyData = await historyRes.json()
          setHistory(historyData.withdrawals)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [])

  const maxWithdrawal = WITHDRAWAL_LIMITS[kycLevel as keyof typeof WITHDRAWAL_LIMITS] || 50
  const withdrawalAmount = Number.parseFloat(amount) || 0
  const fee = (withdrawalAmount * WITHDRAWAL_FEE_PERCENT) / 100
  const total = withdrawalAmount + fee
  const canWithdraw = withdrawalAmount > 0 && total <= (balance?.usdc_balance || 0) && withdrawalAmount <= maxWithdrawal

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!payeeEmail) {
      setError("PayPal email is required")
      return
    }

    if (withdrawalAmount > maxWithdrawal) {
      setError(`Withdrawal limit: $${maxWithdrawal}/day (Current KYC Level: ${kycLevel})`)
      return
    }

    setWithdrawing(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/withdrawals/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount_usd: withdrawalAmount,
          payout_method: "paypal",
          payee_email: payeeEmail,
        }),
      })

      if (!res.ok) throw new Error("Withdrawal request failed")
      setSuccess(true)
      setAmount("")
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed")
    } finally {
      setWithdrawing(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            MINER
          </Link>
          <div className="flex gap-4">
            <Link href="/dashboard" className="hover:text-primary">
              Dashboard
            </Link>
            <Link href="/tasks" className="hover:text-primary">
              Tasks
            </Link>
            <Link href="/staking" className="hover:text-primary">
              Staking
            </Link>
            <Link href="/withdraw" className="text-primary font-semibold">
              Withdraw
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Withdraw to PayPal</h1>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Current Balance */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-foreground/60 text-sm mb-2">Available Balance</h3>
            <div className="text-3xl font-bold">${balance?.usdc_balance.toFixed(2)}</div>
            <p className="text-sm text-foreground/60 mt-2">USDC ready to withdraw</p>
          </div>

          {/* KYC Level */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-foreground/60 text-sm mb-2">KYC Level</h3>
            <div className="text-3xl font-bold">{kycLevel}</div>
            <p className="text-sm text-foreground/60 mt-2">Daily limit: ${maxWithdrawal}</p>
          </div>

          {/* Token Balance */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-foreground/60 text-sm mb-2">Token Balance</h3>
            <div className="text-3xl font-bold">{balance?.token_balance.toLocaleString()}</div>
            <p className="text-sm text-foreground/60 mt-2">MINER tokens earned</p>
          </div>
        </div>

        {/* KYC Info */}
        <div className="bg-accent/10 border border-accent rounded-lg p-6 mb-8">
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold mb-2">Improve Your KYC Level</h3>
              <p className="text-sm text-foreground/80 mb-3">
                {kycLevel === 0 && "Complete basic KYC verification to unlock higher withdrawal limits ($200/day)."}
                {kycLevel === 1 && "Complete enhanced KYC to unlock maximum withdrawal limits ($1,000/day)."}
                {kycLevel === 2 && "You have the highest KYC level with $1,000/day withdrawal limit."}
              </p>
              <Link href="/kyc" className="text-accent hover:underline text-sm font-semibold">
                Update KYC Status →
              </Link>
            </div>
          </div>
        </div>

        {/* Withdrawal Form */}
        <div className="bg-card border border-border rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Request Withdrawal</h2>

          <form onSubmit={handleWithdraw} className="space-y-6">
            {/* PayPal Email */}
            <div>
              <label className="block text-sm font-medium mb-2">PayPal Email Address</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                <input
                  type="email"
                  value={payeeEmail}
                  onChange={(e) => setPayeeEmail(e.target.value)}
                  placeholder="your-paypal@email.com"
                  className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <p className="text-xs text-foreground/60 mt-1">We'll send your funds to this PayPal account</p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">Withdrawal Amount (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-foreground/60">$</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  min="1"
                  max={maxWithdrawal}
                  step="0.01"
                  className="w-full bg-background border border-border rounded-lg pl-8 pr-4 py-2 focus:outline-none focus:border-primary"
                  required
                />
              </div>
              <p className="text-xs text-foreground/60 mt-1">
                Daily limit: ${maxWithdrawal} (You can make up to 3 withdrawals per week)
              </p>
            </div>

            {/* Fee Breakdown */}
            {withdrawalAmount > 0 && (
              <div className="bg-background border border-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Amount</span>
                  <span>${withdrawalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Platform Fee ({WITHDRAWAL_FEE_PERCENT}%)</span>
                  <span>${fee.toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-bold">
                  <span>You'll Receive</span>
                  <span className="text-primary">${withdrawalAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="bg-success/20 border border-success rounded-lg p-4 flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-success">Withdrawal Request Submitted</h4>
                  <p className="text-sm text-foreground/60">We'll process your payout within 24 hours.</p>
                </div>
              </div>
            )}

            {error && <div className="bg-error/20 border border-error rounded-lg p-4 text-error text-sm">{error}</div>}

            <button
              type="submit"
              disabled={!canWithdraw || withdrawing}
              className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {withdrawing && <Loader2 className="w-4 h-4 animate-spin" />}
              {withdrawing ? "Processing..." : "Request Withdrawal"}
            </button>
          </form>
        </div>

        {/* Withdrawal History */}
        {history.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Withdrawal History</h2>

            <div className="space-y-3">
              {history.map((w) => (
                <div
                  key={w.id}
                  className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                >
                  <div>
                    <div className="font-semibold">${w.amount_usd.toFixed(2)}</div>
                    <p className="text-sm text-foreground/60">{new Date(w.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${
                        w.status === "paid"
                          ? "text-success"
                          : w.status === "pending"
                            ? "text-warning"
                            : "text-foreground/60"
                      }`}
                    >
                      {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </div>
                    <p className="text-xs text-foreground/60">Fee: ${w.fee_usd.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
