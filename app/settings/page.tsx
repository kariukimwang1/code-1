"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Settings, Bell, Shield, Palette, Globe, CreditCard, Key, Trash2, Save, Moon, Sun, Smartphone, Mail, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"

interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    mining: boolean
    staking: boolean
    marketing: boolean
  }
  privacy: {
    profile_public: boolean
    show_earnings: boolean
    show_activity: boolean
    allow_analytics: boolean
  }
  security: {
    two_factor_enabled: boolean
    session_timeout: number
    login_notifications: boolean
  }
  preferences: {
    theme: "light" | "dark" | "system"
    language: string
    currency: string
    timezone: string
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<UserSettings>({
    notifications: {
      email: true,
      push: true,
      mining: true,
      staking: true,
      marketing: false
    },
    privacy: {
      profile_public: false,
      show_earnings: false,
      show_activity: true,
      allow_analytics: true
    },
    security: {
      two_factor_enabled: false,
      session_timeout: 24,
      login_notifications: true
    },
    preferences: {
      theme: "system",
      language: "en",
      currency: "USD",
      timezone: "UTC"
    }
  })

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    // Load settings from API
    const token = localStorage.getItem("token")
    if (!token) {
      window.location.href = "/login"
      return
    }
  }, [])

  const handleSaveSettings = async (section: string) => {
    setLoading(true)
    setSuccess("")
    setError("")

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccess(`${section} settings saved successfully!`)
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to save settings")
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setSuccess("")
    setError("")

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setSuccess("Password changed successfully!")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSuccess(""), 3000)
    } catch (err) {
      setError("Failed to change password")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Clear localStorage and redirect
      localStorage.clear()
      window.location.href = "/"
    } catch (err) {
      setError("Failed to delete account")
      setLoading(false)
    }
  }

  const updateNotificationSetting = (key: keyof UserSettings["notifications"], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const updatePrivacySetting = (key: keyof UserSettings["privacy"], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }))
  }

  const updateSecuritySetting = (key: keyof UserSettings["security"], value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      security: {
        ...prev.security,
        [key]: value
      }
    }))
  }

  const updatePreference = (key: keyof UserSettings["preferences"], value: string) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }))
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
            <Link href="/profile" className="hover:text-primary">
              Profile
            </Link>
            <Link href="/settings" className="text-primary font-semibold">
              Settings
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Settings</h1>

        {success && (
          <div className="bg-success/20 border border-success rounded-lg p-4 text-success mb-6 flex items-center gap-2">
            <Check className="w-5 h-5" />
            {success}
          </div>
        )}

        {error && (
          <div className="bg-error/20 border border-error rounded-lg p-4 text-error mb-6">
            {error}
          </div>
        )}

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="privacy">Privacy</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>Choose how you want to be notified about important events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive important updates via email</div>
                  </div>
                  <Switch
                    checked={settings.notifications.email}
                    onCheckedChange={(checked) => updateNotificationSetting("email", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive browser push notifications</div>
                  </div>
                  <Switch
                    checked={settings.notifications.push}
                    onCheckedChange={(checked) => updateNotificationSetting("push", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Mining Updates</div>
                    <div className="text-sm text-muted-foreground">Get notified about mining rewards and bonuses</div>
                  </div>
                  <Switch
                    checked={settings.notifications.mining}
                    onCheckedChange={(checked) => updateNotificationSetting("mining", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Staking Notifications</div>
                    <div className="text-sm text-muted-foreground">Updates about your staking positions and rewards</div>
                  </div>
                  <Switch
                    checked={settings.notifications.staking}
                    onCheckedChange={(checked) => updateNotificationSetting("staking", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Marketing Emails</div>
                    <div className="text-sm text-muted-foreground">Receive promotional offers and updates</div>
                  </div>
                  <Switch
                    checked={settings.notifications.marketing}
                    onCheckedChange={(checked) => updateNotificationSetting("marketing", checked)}
                  />
                </div>

                <Button onClick={() => handleSaveSettings("Notifications")} disabled={loading} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Notification Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Settings */}
          <TabsContent value="privacy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>Control your privacy and data sharing preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Public Profile</div>
                    <div className="text-sm text-muted-foreground">Make your profile visible to other users</div>
                  </div>
                  <Switch
                    checked={settings.privacy.profile_public}
                    onCheckedChange={(checked) => updatePrivacySetting("profile_public", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Show Earnings</div>
                    <div className="text-sm text-muted-foreground">Display your earnings on public profile</div>
                  </div>
                  <Switch
                    checked={settings.privacy.show_earnings}
                    onCheckedChange={(checked) => updatePrivacySetting("show_earnings", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Show Activity</div>
                    <div className="text-sm text-muted-foreground">Display your recent activity on profile</div>
                  </div>
                  <Switch
                    checked={settings.privacy.show_activity}
                    onCheckedChange={(checked) => updatePrivacySetting("show_activity", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Analytics Data</div>
                    <div className="text-sm text-muted-foreground">Help us improve by sharing anonymous usage data</div>
                  </div>
                  <Switch
                    checked={settings.privacy.allow_analytics}
                    onCheckedChange={(checked) => updatePrivacySetting("allow_analytics", checked)}
                  />
                </div>

                <Button onClick={() => handleSaveSettings("Privacy")} disabled={loading} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Privacy Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Security Options
                  </CardTitle>
                  <CardDescription>Manage your account security and authentication</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Two-Factor Authentication</div>
                      <div className="text-sm text-muted-foreground">Add an extra layer of security to your account</div>
                    </div>
                    <Switch
                      checked={settings.security.two_factor_enabled}
                      onCheckedChange={(checked) => updateSecuritySetting("two_factor_enabled", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Login Notifications</div>
                      <div className="text-sm text-muted-foreground">Get notified when someone logs into your account</div>
                    </div>
                    <Switch
                      checked={settings.security.login_notifications}
                      onCheckedChange={(checked) => updateSecuritySetting("login_notifications", checked)}
                    />
                  </div>

                  <div>
                    <div className="font-medium mb-2">Session Timeout (hours)</div>
                    <select
                      value={settings.security.session_timeout}
                      onChange={(e) => updateSecuritySetting("session_timeout", parseInt(e.target.value))}
                      className="bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                    >
                      <option value={1}>1 hour</option>
                      <option value={6}>6 hours</option>
                      <option value={24}>24 hours</option>
                      <option value={168}>1 week</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <CardDescription>Update your account password</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Current Password</label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">New Password</label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        required
                      />
                    </div>
                    <Button type="submit" disabled={loading} className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Preferences Settings */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  User Preferences
                </CardTitle>
                <CardDescription>Customize your application experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="font-medium mb-2">Theme</div>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => updatePreference("theme", "light")}
                      className={`p-3 rounded-lg border transition-colors flex items-center gap-2 ${
                        settings.preferences.theme === "light" ? "bg-primary border-primary text-black" : "bg-background border-border"
                      }`}
                    >
                      <Sun className="w-4 h-4" />
                      Light
                    </button>
                    <button
                      onClick={() => updatePreference("theme", "dark")}
                      className={`p-3 rounded-lg border transition-colors flex items-center gap-2 ${
                        settings.preferences.theme === "dark" ? "bg-primary border-primary text-black" : "bg-background border-border"
                      }`}
                    >
                      <Moon className="w-4 h-4" />
                      Dark
                    </button>
                    <button
                      onClick={() => updatePreference("theme", "system")}
                      className={`p-3 rounded-lg border transition-colors flex items-center gap-2 ${
                        settings.preferences.theme === "system" ? "bg-primary border-primary text-black" : "bg-background border-border"
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      System
                    </button>
                  </div>
                </div>

                <div>
                  <div className="font-medium mb-2">Language</div>
                  <select
                    value={settings.preferences.language}
                    onChange={(e) => updatePreference("language", e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary w-full"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>

                <div>
                  <div className="font-medium mb-2">Currency</div>
                  <select
                    value={settings.preferences.currency}
                    onChange={(e) => updatePreference("currency", e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary w-full"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="KES">KES - Kenyan Shilling</option>
                  </select>
                </div>

                <div>
                  <div className="font-medium mb-2">Timezone</div>
                  <select
                    value={settings.preferences.timezone}
                    onChange={(e) => updatePreference("timezone", e.target.value)}
                    className="bg-background border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary w-full"
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Africa/Nairobi">Nairobi</option>
                  </select>
                </div>

                <Button onClick={() => handleSaveSettings("Preferences")} disabled={loading} className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save Preferences"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings */}
          <TabsContent value="account">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Account Management
                </CardTitle>
                <CardDescription>Manage your account data and deletion</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Export Your Data</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download all your personal data including transactions, earnings, and account information.
                  </p>
                  <Button variant="outline" className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Request Data Export
                  </Button>
                </div>

                <div className="p-4 border border-border rounded-lg">
                  <h4 className="font-medium mb-2">Connected Services</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage third-party services connected to your account.
                  </p>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Manage Connected Services
                  </Button>
                </div>

                <div className="p-4 border border-error/20 bg-error/5 rounded-lg">
                  <h4 className="font-medium mb-2 text-error">Delete Account</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  {!showDeleteConfirm ? (
                    <Button variant="destructive" onClick={handleDeleteAccount} className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-error font-medium">
                        Are you sure? This will permanently delete all your data.
                      </p>
                      <div className="flex gap-3">
                        <Button variant="destructive" onClick={handleDeleteAccount} disabled={loading}>
                          {loading ? "Deleting..." : "Yes, Delete My Account"}
                        </Button>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}