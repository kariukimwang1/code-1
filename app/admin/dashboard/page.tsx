"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { BarChart3, TrendingUp, Users, Coins, Activity, AlertCircle, CheckCircle2 } from "lucide-react"

interface MiningStats {
  date: string
  totalRevenue: number
  tokensMinted: number
  activeUsers: number
  tasksCompleted: number
}

interface SystemHealth {
  contractsDeployed: number
  paymentsProcessed: number
  usersActive24h: number
  systemUptime: number
  alertCount: number
}

const MINING_DATA: MiningStats[] = [
  { date: "Mon", totalRevenue: 45000, tokensMinted: 450000, activeUsers: 234, tasksCompleted: 1240 },
  { date: "Tue", totalRevenue: 52000, tokensMinted: 520000, activeUsers: 267, tasksCompleted: 1456 },
  { date: "Wed", totalRevenue: 48000, tokensMinted: 480000, activeUsers: 245, tasksCompleted: 1320 },
  { date: "Thu", totalRevenue: 55000, tokensMinted: 550000, activeUsers: 289, tasksCompleted: 1568 },
  { date: "Fri", totalRevenue: 58000, tokensMinted: 580000, activeUsers: 312, tasksCompleted: 1724 },
  { date: "Sat", totalRevenue: 62000, tokensMinted: 620000, activeUsers: 334, tasksCompleted: 1893 },
  { date: "Sun", totalRevenue: 50000, tokensMinted: 500000, activeUsers: 278, tasksCompleted: 1456 },
]

const REVENUE_BREAKDOWN = [
  { name: "Ads", value: 25000, color: "#10b981" },
  { name: "Surveys", value: 15000, color: "#6ee7b7" },
  { name: "Micro Jobs", value: 12000, color: "#14b8a6" },
  { name: "Referrals", value: 5000, color: "#5eead4" },
  { name: "Premiums", value: 3000, color: "#a7f3d0" },
]

const SYSTEM_HEALTH: SystemHealth = {
  contractsDeployed: 4,
  paymentsProcessed: 1247,
  usersActive24h: 312,
  systemUptime: 99.97,
  alertCount: 2,
}

export default function AdminDashboard() {
  const [refreshing, setRefreshing] = useState(false)
  const [selectedMetric, setSelectedMetric] = useState("revenue")

  const handleRefresh = async () => {
    setRefreshing(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setRefreshing(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-2">System monitoring and control center</p>
          </div>
          <Button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-gradient-to-r from-primary to-accent text-white font-semibold"
          >
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </Button>
        </div>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 hover:border-primary/50 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Contracts Deployed</p>
                <p className="text-3xl font-bold text-primary mt-2">{SYSTEM_HEALTH.contractsDeployed}</p>
              </div>
              <Coins className="h-12 w-12 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 hover:border-primary/50 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payments Processed</p>
                <p className="text-3xl font-bold text-accent mt-2">
                  {SYSTEM_HEALTH.paymentsProcessed.toLocaleString()}
                </p>
              </div>
              <Activity className="h-12 w-12 text-accent/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 hover:border-primary/50 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users (24h)</p>
                <p className="text-3xl font-bold text-secondary mt-2">
                  {SYSTEM_HEALTH.usersActive24h.toLocaleString()}
                </p>
              </div>
              <Users className="h-12 w-12 text-secondary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50 hover:border-primary/50 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">System Uptime</p>
                <p className="text-3xl font-bold text-green-500 mt-2">{SYSTEM_HEALTH.systemUptime}%</p>
              </div>
              <CheckCircle2 className="h-12 w-12 text-green-500/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-500/20 bg-gradient-to-br from-red-500/5 to-red-500/2">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Alerts</p>
                <p className="text-3xl font-bold text-red-500 mt-2">{SYSTEM_HEALTH.alertCount}</p>
              </div>
              <AlertCircle className="h-12 w-12 text-red-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics */}
      <Tabs defaultValue="mining" className="mb-8">
        <TabsList className="bg-transparent border-b border-primary/10 w-full justify-start">
          <TabsTrigger value="mining" className="data-[state=active]:text-primary">
            Mining Analytics
          </TabsTrigger>
          <TabsTrigger value="revenue" className="data-[state=active]:text-primary">
            Revenue Breakdown
          </TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:text-primary">
            User Trends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mining" className="space-y-4">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Daily Mining & User Activity
              </CardTitle>
              <CardDescription>Revenue, tokens minted, and user engagement over the past week</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={MINING_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#708090" />
                    <YAxis stroke="#708090" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalRevenue"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={{ fill: "#10b981", r: 5 }}
                      name="Revenue (KES)"
                    />
                    <Line
                      type="monotone"
                      dataKey="activeUsers"
                      stroke="#14b8a6"
                      strokeWidth={2}
                      dot={{ fill: "#14b8a6", r: 5 }}
                      name="Active Users"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Revenue Breakdown by Source
              </CardTitle>
              <CardDescription>Distribution of income across platform features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={REVENUE_BREAKDOWN}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value.toLocaleString()}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {REVENUE_BREAKDOWN.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  {REVENUE_BREAKDOWN.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="font-medium text-foreground">{item.name}</span>
                      </div>
                      <Badge variant="outline">{item.value.toLocaleString()} KES</Badge>
                    </div>
                  ))}
                  <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border-2 border-primary">
                    <span className="font-bold text-foreground">Total Daily Revenue</span>
                    <Badge className="bg-gradient-to-r from-primary to-accent text-white">
                      {REVENUE_BREAKDOWN.reduce((sum, item) => sum + item.value, 0).toLocaleString()} KES
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
            <CardHeader>
              <CardTitle>Task Completion & User Activity</CardTitle>
              <CardDescription>Tasks completed per day and user engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={MINING_DATA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="date" stroke="#708090" />
                    <YAxis stroke="#708090" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "0.5rem",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="tasksCompleted" fill="#10b981" name="Tasks Completed" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="activeUsers" fill="#14b8a6" name="Active Users" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* System Controls */}
      <Card className="border-primary/20 bg-gradient-to-br from-card to-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            System Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <Button className="bg-gradient-to-r from-primary to-accent text-white font-semibold py-3">
              Execute Daily Mining Reset
            </Button>
            <Button variant="outline" className="border-primary/30 text-foreground py-3 bg-transparent">
              Process Batch Rewards
            </Button>
            <Button variant="outline" className="border-primary/30 text-foreground py-3 bg-transparent">
              Generate Treasury Report
            </Button>
            <Button variant="outline" className="border-primary/30 text-foreground py-3 bg-transparent">
              View Contract Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
