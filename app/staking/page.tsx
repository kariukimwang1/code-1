"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Lock, Unlock, Loader2 } from "lucide-react"
import Link from "next/link"

interface StakingPosition {
  id: string
  amount: number
  start_at: string
  lock_until?: string
  apy: number
  status: string
}

interface Balance {
  token_balance: number
}

const STAKING_TIERS = [
  { days: 0, apy: 5, label: "Flexible" },
  { days: 30, apy: 15, label: "30 Days" },
  { days: 90, apy: 25, label: "90 Days" },
]

export default function StakingPage() {
  const [balance, setBalance] = useState<Balance | null>(null)
  const [positions, setPositions] = useState<StakingPosition[]>([])
  const [stakeAmount, setStakeAmount] = useState("")
  const [selectedTier, setSelectedTier] = useState(0)
  const [loading, setLoading] = useState(true)
  const [staking, setStaking] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function fetchData() {
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

        const stakingRes = await fetch("/api/staking/positions", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (stakingRes.ok) {
          const stakingData = await stakingRes.json()
          setPositions(stakingData.positions)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const totalStaked = positions.reduce((sum, p) => sum + p.amount, 0)
  const selectedAPY = STAKING_TIERS[selectedTier].apy

  async function handleStake(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    const amount = Number.parseInt(stakeAmount)
    if (!amount || amount <= 0) {
      setError("Invalid amount")
      return
    }

    if (amount > (balance?.token_balance || 0)) {
      setError("Insufficient balance")
      return
    }

    setStaking(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/staking/stake", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          lockDays: STAKING_TIERS[selectedTier].days,
        }),
      })

      if (!res.ok) throw new Error("Staking failed")
      const data = await res.json()
      setPositions([...positions, data.position])
      setStakeAmount("")
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Staking failed")
    } finally {
      setStaking(false)
    }
  }

  async function handleUnstake(positionId: string) {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/staking/${positionId}/unstake`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) throw new Error("Unstake failed")
      setPositions(positions.filter((p) => p.id !== positionId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unstake failed")
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
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
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
            <Link href="/staking" className="text-primary font-semibold">
              Staking
            </Link>
            <Link href="/referrals" className="hover:text-primary">
              Referrals
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Stake & Earn</h1>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-foreground/60 text-sm mb-2">Available Balance</h3>
            <div className="text-3xl font-bold">{balance?.token_balance.toLocaleString()}</div>
            <p className="text-sm text-foreground/60 mt-2">MINER tokens available to stake</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-foreground/60 text-sm mb-2">Total Staked</h3>
            <div className="text-3xl font-bold">{totalStaked.toLocaleString()}</div>
            <p className="text-sm text-foreground/60 mt-2">Earning rewards</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-foreground/60 text-sm mb-2">Est. Annual Returns</h3>
            <div className="text-3xl font-bold text-primary">
              {((totalStaked * selectedAPY) / 100).toLocaleString()}
            </div>
            <p className="text-sm text-foreground/60 mt-2">At {selectedAPY}% APY</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Staking Form */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Stake Tokens</h2>

            {/* Tier Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-4">Choose Lock Period</label>
              <div className="grid grid-cols-3 gap-3">
                {STAKING_TIERS.map((tier, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTier(idx)}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedTier === idx
                        ? "bg-primary border-primary text-black"
                        : "bg-background border-border hover:border-primary"
                    }`}
                  >
                    <div className="font-bold">{tier.label}</div>
                    <div className="text-sm">{tier.apy}% APY</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleStake} className="space-y-6">
              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">Amount to Stake</label>
                <div className="relative">
                  <input
                    type="number"
                    value={stakeAmount}
                    onChange={(e) => setStakeAmount(e.target.value)}
                    placeholder="0"
                    min="1"
                    max={balance?.token_balance}
                    className="w-full bg-background border border-border rounded-lg pl-4 pr-16 py-2 focus:outline-none focus:border-primary"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setStakeAmount((balance?.token_balance || 0).toString())}
                    className="absolute right-3 top-2 text-sm text-primary hover:underline"
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-background border border-border rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Amount</span>
                  <span>{Number.parseInt(stakeAmount) || 0} MINER</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">Lock Period</span>
                  <span>
                    {STAKING_TIERS[selectedTier].days === 0 ? "Flexible" : `${STAKING_TIERS[selectedTier].days} Days`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-foreground/60">APY</span>
                  <span className="text-primary font-bold">{selectedAPY}%</span>
                </div>
                {Number.parseInt(stakeAmount) > 0 && (
                  <div className="border-t border-border pt-2 flex justify-between text-sm font-bold">
                    <span>Est. Annual Return</span>
                    <span className="text-primary">
                      {((Number.parseInt(stakeAmount) * selectedAPY) / 100).toLocaleString()} MINER
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-error/20 border border-error rounded-lg p-3 text-error text-sm">{error}</div>
              )}

              {success && (
                <div className="bg-success/20 border border-success rounded-lg p-3 text-success text-sm">
                  Tokens staked successfully!
                </div>
              )}

              <button
                type="submit"
                disabled={staking || !stakeAmount}
                className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 text-black font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {staking && <Loader2 className="w-4 h-4 animate-spin" />}
                {staking ? "Staking..." : "Stake Tokens"}
              </button>
            </form>
          </div>

          {/* Active Positions */}
          <div className="bg-card border border-border rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-6">Your Positions</h2>

            {positions.length === 0 ? (
              <div className="text-center py-12">
                <Lock className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                <p className="text-foreground/60">No active stakes yet.</p>
                <p className="text-sm text-foreground/40">Start staking to earn rewards!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {positions.map((position) => {
                  const daysLocked = position.lock_until
                    ? Math.ceil((new Date(position.lock_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                    : 0
                  const isLocked = daysLocked > 0

                  return (
                    <div key={position.id} className="bg-background border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold">{position.amount.toLocaleString()} MINER</div>
                          <div className="text-sm text-foreground/60">{position.apy}% APY</div>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-lg text-sm font-medium ${
                            isLocked ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"
                          }`}
                        >
                          {isLocked ? `${daysLocked}d locked` : "Flexible"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleUnstake(position.id)}
                        disabled={isLocked}
                        className="w-full text-sm py-2 px-3 rounded-lg border border-border hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                      >
                        <Unlock className="w-4 h-4" />
                        {isLocked ? `Unlock in ${daysLocked} days` : "Unstake"}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
