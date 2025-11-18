"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AlertCircle, TrendingUp, Users, Zap, Search, Ban, CheckCircle, AlertTriangle, Settings, Shield, DollarSign } from "lucide-react"

interface User {
  id: string
  email: string
  kyc_level: number
  status: string
  created_at: string
  total_earned: number
  last_active: string
}

interface TreasuryMetrics {
  totalSupply: number
  circulatingSupply: number
  treasuryBalance: number
  backingRatio: number
}

interface SystemHealth {
  uptime: number
  responseTime: number
  errorRate: number
  activeConnections: number
}

export default function AdminPage() {
  const [dailySummary, setDailySummary] = useState<any>(null)
  const [complianceReport, setComplianceReport] = useState<any>(null)
  const [users, setUsers] = useState<User[]>([])
  const [treasuryMetrics, setTreasuryMetrics] = useState<TreasuryMetrics | null>(null)
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [userSearch, setUserSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        const token = localStorage.getItem("token")
        const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY

        // Fetch all admin data in parallel
        const [
          dailyRes,
          compRes,
          treasuryRes,
          healthRes
        ] = await Promise.all([
          fetch("/api/admin/reports/daily-summary", {
            headers: { "x-admin-key": adminKey || "", Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/reports/compliance?days=30", {
            headers: { "x-admin-key": adminKey || "", Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/treasury/metrics", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/admin/system-health", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ])

        if (dailyRes.ok) setDailySummary(await dailyRes.json())
        if (compRes.ok) setComplianceReport(await compRes.json())
        if (treasuryRes.ok) setTreasuryMetrics(await treasuryRes.json())
        if (healthRes.ok) setSystemHealth(await healthRes.json())

        // Mock user data for now - should come from API
        setUsers([
          {
            id: "1",
            email: "user1@example.com",
            kyc_level: 2,
            status: "active",
            created_at: "2024-01-15",
            total_earned: 1500.50,
            last_active: "2024-11-18"
          },
          {
            id: "2",
            email: "user2@example.com",
            kyc_level: 0,
            status: "pending",
            created_at: "2024-11-10",
            total_earned: 45.25,
            last_active: "2024-11-17"
          }
        ])

      } catch (error) {
        console.error("Failed to fetch admin data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAdminData()
  }, [])

  const handleUserAction = async (userId: string, action: string) => {
    setActionLoading(action + userId)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/admin/users/${userId}/${action}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error(`Failed to ${action} user`)

      // Refresh users list
      setUsers(users.map(u =>
        u.id === userId ? { ...u, status: action === 'ban' ? 'banned' : action === 'approve' ? 'active' : u.status } : u
      ))
    } catch (error) {
      console.error(`Failed to ${action} user:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleTreasuryAction = async (action: string, amount?: number) => {
    setActionLoading(action)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/admin/treasury/execute-buyback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, amount }),
      })
      if (!res.ok) throw new Error(`Failed to execute ${action}`)
    } catch (error) {
      console.error(`Failed to execute ${action}:`, error)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(userSearch.toLowerCase())
  )

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>

        <Tabs defaultValue="daily" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily">Daily Summary</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Miners</p>
                      <p className="text-2xl font-bold">{dailySummary?.mining.activeminers}</p>
                    </div>
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                      <p className="text-2xl font-bold">{dailySummary?.mining.totalEarned.toFixed(0)}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-success" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Withdrawals</p>
                      <p className="text-2xl font-bold">{dailySummary?.withdrawals.pendingCount}</p>
                    </div>
                    <Zap className="h-8 w-8 text-accent" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">New Users</p>
                      <p className="text-2xl font-bold">{dailySummary?.users.newUsers}</p>
                    </div>
                    <Users className="h-8 w-8 text-accent" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Task Submissions</p>
                    <p className="text-xl font-bold">{dailySummary?.mining.totalSubmissions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Approved Tasks</p>
                    <p className="text-xl font-bold">{dailySummary?.mining.approvedSubmissions}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Staked</p>
                    <p className="text-xl font-bold">{dailySummary?.staking.totalStaked.toFixed(0)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Withdrawn</p>
                    <p className="text-xl font-bold">${dailySummary?.withdrawals.totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Compliance Summary (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold">{complianceReport?.summary.totalTransactions}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{complianceReport?.summary.totalUsers}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Suspicious Activities</p>
                    <p className="text-2xl font-bold text-destructive">
                      {complianceReport?.alerts.suspiciousActivityCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">High Value Tx</p>
                    <p className="text-2xl font-bold">{complianceReport?.alerts.highValueTransactionCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>Immutable log of all critical operations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Audit trail data displayed here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
