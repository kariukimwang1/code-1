"use client"

import { useEffect, useState } from "react"
import { Copy, Users, Gift, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"

interface ReferralStats {
  referral_count: number
  total_rewards: number
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [referralLink, setReferralLink] = useState("")
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchData() {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          window.location.href = "/login"
          return
        }

        const res = await fetch("/api/referrals/stats", {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!res.ok) throw new Error("Failed to fetch stats")
        const data = await res.json()
        setStats(data.stats)
        setReferralLink(data.referralLink)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  function copyToClipboard() {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <Link href="/staking" className="hover:text-primary">
              Staking
            </Link>
            <Link href="/referrals" className="text-primary font-semibold">
              Referrals
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-2">Referral Program</h1>
        <p className="text-lg text-foreground/60 mb-12">Earn MINER tokens by inviting friends</p>

        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground/60 text-sm">Total Referrals</h3>
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div className="text-3xl font-bold">{stats?.referral_count || 0}</div>
            <p className="text-sm text-foreground/60 mt-2">Friends who joined</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-foreground/60 text-sm">Rewards Earned</h3>
              <Gift className="w-5 h-5 text-accent" />
            </div>
            <div className="text-3xl font-bold text-primary">{stats?.total_rewards.toLocaleString() || 0}</div>
            <p className="text-sm text-foreground/60 mt-2">MINER tokens from referrals</p>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-card border border-border rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Your Referral Link</h2>

          <div className="space-y-4">
            <p className="text-foreground/60">
              Share this link with friends. When they sign up and complete their first task, you both earn bonuses!
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-sm font-mono focus:outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="bg-primary hover:bg-primary-dark text-black font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                href={`https://twitter.com/intent/tweet?text=Join me on MINER and earn tokens! ${encodeURIComponent(referralLink)}`}
                target="_blank"
                className="flex-1 bg-background hover:bg-background/80 border border-border rounded-lg py-2 px-4 text-center text-sm font-semibold transition-colors"
              >
                Share on Twitter
              </Link>
              <Link
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`}
                target="_blank"
                className="flex-1 bg-background hover:bg-background/80 border border-border rounded-lg py-2 px-4 text-center text-sm font-semibold transition-colors"
              >
                Share on Facebook
              </Link>
            </div>
          </div>
        </div>

        {/* Commission Structure */}
        <div className="bg-card border border-border rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Commission Structure</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-background border border-border rounded-lg p-4">
              <div className="text-sm text-foreground/60 mb-2">Tier 1 (Direct)</div>
              <div className="text-2xl font-bold text-primary">10%</div>
              <p className="text-xs text-foreground/60 mt-2">From direct referrals earnings</p>
            </div>

            <div className="bg-background border border-border rounded-lg p-4">
              <div className="text-sm text-foreground/60 mb-2">Tier 2 (Indirect)</div>
              <div className="text-2xl font-bold text-accent">5%</div>
              <p className="text-xs text-foreground/60 mt-2">From their referrals earnings</p>
            </div>

            <div className="bg-background border border-border rounded-lg p-4">
              <div className="text-sm text-foreground/60 mb-2">Bonus</div>
              <div className="text-2xl font-bold">+50</div>
              <p className="text-xs text-foreground/60 mt-2">MINER per active referral</p>
            </div>
          </div>

          <div className="mt-6 p-4 bg-primary/10 border border-primary rounded-lg">
            <p className="text-sm text-foreground/80">
              💡 <strong>Tip:</strong> Referrals are paid when they complete their first task. Both you and your
              referral earn bonuses!
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
