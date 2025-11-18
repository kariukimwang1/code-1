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
          <p className="text-foreground/60 mb-6">Join thousands earning MINER tokens</p>

          {/* OAuth Options */}
          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={handleGoogleOAuth}
              disabled={oauthLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border border-border rounded-lg p-3 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {oauthLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Chrome className="w-5 h-5" />
              )}
              <span className="text-foreground">
                {oauthLoading ? "Connecting..." : "Continue with Google"}
              </span>
            </button>

            <button
              type="button"
              onClick={connectWallet}
              disabled={walletConnecting || walletConnected}
              className="w-full flex items-center justify-center gap-3 bg-background border border-border rounded-lg p-3 hover:bg-accent/10 transition-colors disabled:opacity-50"
            >
              {walletConnecting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Wallet className="w-5 h-5" />
              )}
              <span className="text-foreground">
                {walletConnected
                  ? `Connected: ${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : walletConnecting
                  ? "Connecting..."
                  : "Connect Wallet"}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-foreground/40 text-sm">OR</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="bg-success/20 border border-success rounded-lg p-4 text-center">
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-success font-medium">Account created successfully!</p>
                <p className="text-foreground/60 text-sm mt-2">
                  {emailVerified
                    ? "Please check your email to verify your account."
                    : "A verification email has been sent to your email address."}
                </p>
              </div>
              <div className="text-center">
                <Link href="/login" className="text-primary hover:underline">
                  Go to Login
                </Link>
              </div>
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

                {/* Terms and Conditions */}
                <div className="space-y-2">
                  <label className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary"
                      required
                    />
                    <span className="text-sm text-foreground/80">
                      I agree to the{" "}
                      <Link href="/terms" className="text-primary hover:underline" target="_blank">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-primary hover:underline" target="_blank">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                {error && (
                  <div className="bg-error/20 border border-error rounded-lg p-3 text-error text-sm flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !agreeToTerms}
                  className="w-full bg-primary hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>
            )}

            {!success && (
              <>
                <p className="text-center text-foreground/60 mt-6">
                  Already have an account?{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    Login
                  </Link>
                </p>

                {/* Security Notice */}
                <div className="mt-6 p-3 bg-accent/10 border border-accent/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-foreground/70">
                      <p className="font-medium mb-1">Secure signup:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Your data is encrypted and secure</li>
                        <li>• We'll never sell your information</li>
                        <li>• Email verification required for account security</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
