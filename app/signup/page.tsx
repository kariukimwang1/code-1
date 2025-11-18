"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { NavigationBar } from "@/components/navigation-bar"
import { Mail, Lock, Loader2, Wallet, AlertCircle, CheckCircle, Chrome } from "lucide-react"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [walletAddress, setWalletAddress] = useState("")
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [walletConnecting, setWalletConnecting] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [walletConnected, setWalletConnected] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)

  const connectWallet = async () => {
    setWalletConnecting(true)
    setError("")

    try {
      // Check if MetaMask is installed
      if (typeof window !== "undefined" && typeof (window as any).ethereum !== "undefined") {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts"
        })

        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
          setWalletConnected(true)
        }
      } else {
        // Redirect to install MetaMask
        window.open("https://metamask.io/download/", "_blank")
        setError("Please install MetaMask to connect your wallet")
      }
    } catch (err) {
      setError("Failed to connect wallet. Please try again.")
    } finally {
      setWalletConnecting(false)
    }
  }

  const handleGoogleOAuth = async () => {
    setOauthLoading(true)
    setError("")

    try {
      // Redirect to Google OAuth
      window.location.href = "/api/auth/google"
    } catch (err) {
      setError("Failed to connect with Google. Please try again.")
      setOauthLoading(false)
    }
  }

  const sendEmailVerification = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (!res.ok) throw new Error("Failed to send verification email")

      setEmailVerified(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send verification email")
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError("")

    if (!agreeToTerms) {
      setError("You must agree to the Terms of Service")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          walletAddress: walletAddress || null
        }),
      })

      if (!res.ok) throw new Error("Signup failed")

      setSuccess(true)
      // Send verification email
      await sendEmailVerification()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <NavigationBar />
      <div className="pt-32 px-4 pb-20">
        <div className="max-w-md mx-auto">
          <div className="bg-card border border-border rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-2">Create Account</h1>
            <p className="text-foreground/60 mb-8">Join thousands earning MINER tokens</p>

            {success ? (
              <div className="bg-primary/20 border border-primary rounded-lg p-4 text-center">
                <p className="text-green-400">Account created! Redirecting to login...</p>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:border-primary"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-error/20 border border-error rounded-lg p-3 text-error text-sm">{error}</div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full py-2 flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </form>
            )}

            <p className="text-center text-foreground/60 mt-6">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
