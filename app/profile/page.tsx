"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { User, Mail, Shield, Wallet, Calendar, DollarSign, Award, Settings, Camera, Edit, Check, X, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface UserProfile {
  id: string
  email: string
  full_name: string
  username: string
  bio: string
  avatar_url: string
  kyc_level: number
  kyc_status: string
  wallet_address: string
  created_at: string
  last_active: string
  total_earned: number
  referral_count: number
  mining_level: number
  achievements: string[]
  two_factor_enabled: boolean
  email_verified: boolean
}

interface Balance {
  token_balance: number
  usdc_balance: number
  pending_rewards: number
  total_staked: number
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [balance, setBalance] = useState<Balance | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: "",
    username: "",
    bio: ""
  })
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    async function fetchProfileData() {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          window.location.href = "/login"
          return
        }

        // Mock profile data - replace with API call
        setProfile({
          id: "1",
          email: "user@example.com",
          full_name: "John Doe",
          username: "johndoe",
          bio: "Crypto enthusiast and miner. Love participating in DeFi protocols.",
          avatar_url: "",
          kyc_level: 2,
          kyc_status: "verified",
          wallet_address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
          created_at: "2024-01-15",
          last_active: "2024-11-18",
          total_earned: 2347.85,
          referral_count: 12,
          mining_level: 15,
          achievements: ["Early Adopter", "Power Miner", "Top Referrer", "Staking Pro"],
          two_factor_enabled: false,
          email_verified: true
        })

        setBalance({
          token_balance: 28473.91,
          usdc_balance: 1250.50,
          pending_rewards: 47.23,
          total_staked: 10000
        })

      } catch (err) {
        console.error("Failed to fetch profile:", err)
        setError("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [])

  const handleEditProfile = () => {
    if (!profile) return

    setEditForm({
      full_name: profile.full_name,
      username: profile.username,
      bio: profile.bio
    })
    setEditing(true)
    setSuccess("")
    setError("")
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess("")
    setError("")

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      if (profile) {
        setProfile({
          ...profile,
          full_name: editForm.full_name,
          username: editForm.username,
          bio: editForm.bio
        })
      }

      setSuccess("Profile updated successfully!")
      setEditing(false)
    } catch (err) {
      setError("Failed to update profile")
    }
  }

  const handleCancelEdit = () => {
    setEditing(false)
    setEditForm({ full_name: "", username: "", bio: "" })
    setSuccess("")
    setError("")
  }

  const getKYCStatusColor = (level: number) => {
    switch (level) {
      case 0: return "bg-warning/20 text-warning"
      case 1: return "bg-accent/20 text-accent"
      case 2: return "bg-success/20 text-success"
      default: return "bg-background text-muted-foreground"
    }
  }

  const getKYCStatusLabel = (level: number) => {
    switch (level) {
      case 0: return "Basic"
      case 1: return "Enhanced"
      case 2: return "Premium"
      default: return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile || !balance) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
          <p className="text-muted-foreground">Unable to load profile information.</p>
        </div>
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
            <Link href="/profile" className="text-primary font-semibold">
              Profile
            </Link>
            <Link href="/settings" className="hover:text-primary">
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-primary" />
                  )}
                </div>
                <button className="absolute bottom-0 right-0 bg-primary text-white p-1 rounded-full">
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              {/* Basic Info */}
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                  <Badge className={getKYCStatusColor(profile.kyc_level)}>
                    KYC {getKYCStatusLabel(profile.kyc_level)}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-3">@{profile.username}</p>
                <p className="text-sm max-w-md">{profile.bio}</p>
              </div>
            </div>

            {/* Edit Button */}
            {!editing && (
              <Button onClick={handleEditProfile} variant="outline" className="flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {editing && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <Input
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Username</label>
                  <Input
                    value={editForm.username}
                    onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                    placeholder="Enter your username"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Bio</label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell us about yourself"
                    className="w-full bg-background border border-border rounded-lg p-3 focus:outline-none focus:border-primary min-h-[100px]"
                  />
                </div>

                {success && (
                  <div className="bg-success/20 border border-success rounded-lg p-3 text-success text-sm flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {success}
                  </div>
                )}

                {error && (
                  <div className="bg-error/20 border border-error rounded-lg p-3 text-error text-sm flex items-center gap-2">
                    <X className="w-4 h-4" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" className="flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit} className="flex items-center gap-2">
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Account Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Account Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="flex items-center gap-2">
                    <span>{profile.email}</span>
                    {profile.email_verified && (
                      <Badge className="bg-success/20 text-success text-xs">Verified</Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Wallet Address</div>
                  <div className="font-mono text-sm">
                    {profile.wallet_address.slice(0, 6)}...{profile.wallet_address.slice(-4)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <div className="text-sm text-muted-foreground">Member Since</div>
                  <div>{new Date(profile.created_at).toLocaleDateString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Token Balance</div>
                <div className="text-2xl font-bold">{balance.token_balance.toLocaleString()} MINER</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">USDC Balance</div>
                <div className="text-xl font-bold">${balance.usdc_balance.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pending Rewards</div>
                <div className="text-lg font-semibold text-primary">{balance.pending_rewards.toFixed(2)} MINER</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Earned</div>
                <div className="text-lg font-semibold text-success">${profile.total_earned.toFixed(2)}</div>
              </div>
            </CardContent>
          </Card>

          {/* Stats & Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Stats & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">Mining Level</div>
                <div className="text-xl font-bold">Level {profile.mining_level}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Referrals</div>
                <div className="text-xl font-bold">{profile.referral_count}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Staked</div>
                <div className="text-lg font-semibold">{balance.total_staked.toLocaleString()} MINER</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-2">Achievements</div>
                <div className="flex flex-wrap gap-1">
                  {profile.achievements.map((achievement, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {achievement}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security Settings */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Settings
            </CardTitle>
            <CardDescription>Manage your account security and verification status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Email Verification</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.email_verified ? "Your email is verified" : "Verify your email address"}
                    </div>
                  </div>
                </div>
                {profile.email_verified ? (
                  <Badge className="bg-success/20 text-success">Verified</Badge>
                ) : (
                  <Button variant="outline" size="sm">Verify Email</Button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-sm text-muted-foreground">
                      {profile.two_factor_enabled ? "2FA is enabled" : "Add an extra layer of security"}
                    </div>
                  </div>
                </div>
                {profile.two_factor_enabled ? (
                  <Badge className="bg-success/20 text-success">Enabled</Badge>
                ) : (
                  <Button variant="outline" size="sm">Enable 2FA</Button>
                )}
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">KYC Verification</div>
                    <div className="text-sm text-muted-foreground">
                      Current level: {getKYCStatusLabel(profile.kyc_level)} - {profile.kyc_status}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getKYCStatusColor(profile.kyc_level)}>
                    Level {profile.kyc_level}
                  </Badge>
                  {profile.kyc_level < 2 && (
                    <Button variant="outline" size="sm">Upgrade</Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}