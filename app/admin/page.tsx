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

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="monitoring">System Health</TabsTrigger>
            <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Miners</p>
                      <p className="text-2xl font-bold">{dailySummary?.mining.activeminers || 0}</p>
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
                      <p className="text-2xl font-bold">{dailySummary?.mining.totalEarned?.toFixed(0) || 0}</p>
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
                      <p className="text-2xl font-bold">{dailySummary?.withdrawals.pendingCount || 0}</p>
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
                      <p className="text-2xl font-bold">{dailySummary?.users.newUsers || 0}</p>
                    </div>
                    <Users className="h-8 w-8 text-accent" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Treasury Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Supply</span>
                      <span className="font-bold">{treasuryMetrics?.totalSupply?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Circulating</span>
                      <span className="font-bold">{treasuryMetrics?.circulatingSupply?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Backing Ratio</span>
                      <span className="font-bold">{treasuryMetrics?.backingRatio?.toFixed(2) || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Uptime</span>
                      <span className="font-bold text-success">{systemHealth?.uptime || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Response Time</span>
                      <span className="font-bold">{systemHealth?.responseTime || 0}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Error Rate</span>
                      <span className="font-bold text-error">{systemHealth?.errorRate || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  User Management
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.email}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.status === 'active' ? 'bg-success/20 text-success' :
                            user.status === 'banned' ? 'bg-error/20 text-error' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {user.status}
                          </span>
                          <span className="px-2 py-1 bg-background text-muted-foreground rounded text-xs">
                            KYC L{user.kyc_level}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Joined: {new Date(user.created_at).toLocaleDateString()} •
                          Earned: ${user.total_earned.toFixed(2)} •
                          Last active: {new Date(user.last_active).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {user.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleUserAction(user.id, 'approve')}
                            disabled={actionLoading === 'approve' + user.id}
                            className="flex items-center gap-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </Button>
                        )}
                        {user.status === 'active' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUserAction(user.id, 'ban')}
                            disabled={actionLoading === 'ban' + user.id}
                            className="flex items-center gap-1"
                          >
                            <Ban className="w-4 h-4" />
                            Ban
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="treasury" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Treasury Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{treasuryMetrics?.totalSupply?.toLocaleString() || 0}</div>
                    <div className="text-sm text-muted-foreground">Total Supply</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{treasuryMetrics?.circulatingSupply?.toLocaleString() || 0}</div>
                    <div className="text-sm text-muted-foreground">Circulating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{treasuryMetrics?.treasuryBalance?.toFixed(0) || 0}</div>
                    <div className="text-sm text-muted-foreground">Treasury Balance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{treasuryMetrics?.backingRatio?.toFixed(2) || 0}%</div>
                    <div className="text-sm text-muted-foreground">Backing Ratio</div>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">Treasury Operations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button
                      onClick={() => handleTreasuryAction('buyback')}
                      disabled={actionLoading === 'buyback'}
                      className="flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Execute Buyback
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleTreasuryAction('burn')}
                      disabled={actionLoading === 'burn'}
                      className="flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      Burn Tokens
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleTreasuryAction('distribute')}
                      disabled={actionLoading === 'distribute'}
                      className="flex items-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      Distribute Rewards
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance" className="space-y-4">
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
