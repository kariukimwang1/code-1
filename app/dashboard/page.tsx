"use client"

import { useEffect, useState } from "react"
import { Wallet, TrendingUp, Gift, LogOut, Menu, X } from "lucide-react"
import Link from "next/link"

interface User {
  id: string
  email: string
}

interface Balance {
  token_balance: number
  usdc_balance: number
  pending_rewards: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          window.location.href = "/login"
          return
        }

        const res = await fetch("/api/user/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error("Failed to fetch user")
        const data = await res.json()
        setUser(data.user)
        setBalance(data.balance)
      } catch (error) {
        console.error(error)
        localStorage.removeItem("token")
        window.location.href = "/login"
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            MINER
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/tasks" className="hover:text-primary">
              Tasks
            </Link>
            <Link href="/staking" className="hover:text-primary">
              Staking
            </Link>
            <Link href="/referrals" className="hover:text-primary">
              Referrals
            </Link>
            <Link href="/withdraw" className="hover:text-primary">
              Withdraw
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("token")
                window.location.href = "/"
              }}
              className="flex items-center gap-2 text-foreground/60 hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>

          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-card border-t border-border p-4 space-y-3">
            <Link href="/tasks" className="block hover:text-primary">
              Tasks
            </Link>
            <Link href="/staking" className="block hover:text-primary">
              Staking
            </Link>
            <Link href="/referrals" className="block hover:text-primary">
              Referrals
            </Link>
            <Link href="/withdraw" className="block hover:text-primary">
              Withdraw
            </Link>
            <button
              onClick={() => {
                localStorage.removeItem("token")
                window.location.href = "/"
              }}
              className="w-full text-left text-foreground/60 hover:text-foreground"
            >
              Logout
            </button>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Welcome back, {user?.email}</h1>
          <p className="text-foreground/60">Track your earnings and manage your account</p>
        </div>

        {/* Balance Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground/60">MINER Balance</h3>
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{balance?.token_balance.toLocaleString()}</div>
            <p className="text-sm text-foreground/60 mt-2">Spendable tokens</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground/60">USDC Balance</h3>
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div className="text-3xl font-bold">${balance?.usdc_balance.toFixed(2)}</div>
            <p className="text-sm text-foreground/60 mt-2">Ready to withdraw</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground/60">Pending Rewards</h3>
              <Gift className="w-5 h-5 text-success" />
            </div>
            <div className="text-3xl font-bold">{balance?.pending_rewards.toLocaleString()}</div>
            <p className="text-sm text-foreground/60 mt-2">To be claimed</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-4 gap-4">
          <Link
            href="/tasks"
            className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
          >
            <h3 className="font-bold mb-2">Browse Tasks</h3>
            <p className="text-sm text-foreground/60">Earn tokens by completing work</p>
          </Link>

          <Link
            href="/staking"
            className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
          >
            <h3 className="font-bold mb-2">Stake Tokens</h3>
            <p className="text-sm text-foreground/60">Earn up to 25% APY</p>
          </Link>

          <Link
            href="/referrals"
            className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
          >
            <h3 className="font-bold mb-2">Referrals</h3>
            <p className="text-sm text-foreground/60">Earn from invitations</p>
          </Link>

          <Link
            href="/withdraw"
            className="bg-card border border-border rounded-lg p-6 hover:border-primary transition-colors"
          >
            <h3 className="font-bold mb-2">Withdraw</h3>
            <p className="text-sm text-foreground/60">Convert to fiat</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
