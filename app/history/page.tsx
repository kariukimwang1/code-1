"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, Download, Filter, Calendar, TrendingUp, ArrowUpRight, ArrowDownRight, Award, Lock, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Transaction {
  id: string
  type: "mining" | "staking" | "withdrawal" | "deposit" | "referral" | "bonus"
  amount: number
  amount_usd?: number
  status: "completed" | "pending" | "failed"
  description: string
  created_at: string
  block_number?: string
  tx_hash?: string
  fee?: number
}

interface StakingPosition {
  id: string
  amount: number
  apy: number
  start_at: string
  lock_until?: string
  status: "active" | "completed" | "liquidated"
  rewards_earned: number
  tx_hash?: string
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stakingHistory, setStakingHistory] = useState<StakingPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [dateRange, setDateRange] = useState<string>("30")

  useEffect(() => {
    async function fetchHistoryData() {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          window.location.href = "/login"
          return
        }

        // Mock transaction data - replace with API call
        setTransactions([
          {
            id: "1",
            type: "mining",
            amount: 125.50,
            status: "completed",
            description: "Mining reward - Task #2847 completed",
            created_at: "2024-11-18T10:30:00Z",
            tx_hash: "0x1234...5678"
          },
          {
            id: "2",
            type: "staking",
            amount: 5000,
            status: "completed",
            description: "Staking deposit - 90 day lock period",
            created_at: "2024-11-15T14:20:00Z",
            tx_hash: "0x5678...9abc"
          },
          {
            id: "3",
            type: "withdrawal",
            amount: -250,
            amount_usd: -250,
            status: "completed",
            description: "PayPal withdrawal to user@example.com",
            created_at: "2024-11-10T09:15:00Z",
            fee: 5
          },
          {
            id: "4",
            type: "referral",
            amount: 50,
            status: "completed",
            description: "Referral bonus - new user signup",
            created_at: "2024-11-08T16:45:00Z"
          },
          {
            id: "5",
            type: "staking",
            amount: 75.25,
            status: "completed",
            description: "Staking rewards claimed",
            created_at: "2024-11-05T11:30:00Z",
            tx_hash: "0xdef0...1234"
          }
        ])

        // Mock staking history
        setStakingHistory([
          {
            id: "1",
            amount: 5000,
            apy: 25,
            start_at: "2024-11-15T14:20:00Z",
            lock_until: "2025-02-13T14:20:00Z",
            status: "active",
            rewards_earned: 85.50,
            tx_hash: "0x5678...9abc"
          },
          {
            id: "2",
            amount: 2000,
            apy: 15,
            start_at: "2024-09-20T10:00:00Z",
            lock_until: "2024-10-20T10:00:00Z",
            status: "completed",
            rewards_earned: 25.75,
            tx_hash: "0xabcd...ef01"
          }
        ])

      } catch (err) {
        console.error("Failed to fetch history:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchHistoryData()
  }, [])

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "mining": return <TrendingUp className="w-4 h-4" />
      case "staking": return <Lock className="w-4 h-4" />
      case "withdrawal": return <ArrowDownRight className="w-4 h-4" />
      case "deposit": return <ArrowUpRight className="w-4 h-4" />
      case "referral": return <Award className="w-4 h-4" />
      case "bonus": return <Award className="w-4 h-4" />
      default: return <Wallet className="w-4 h-4" />
    }
  }

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "mining": return "text-success"
      case "staking": return "text-primary"
      case "withdrawal": return "text-error"
      case "deposit": return "text-success"
      case "referral": return "text-accent"
      case "bonus": return "text-warning"
      default: return "text-muted-foreground"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-success/20 text-success"
      case "pending": return "bg-warning/20 text-warning"
      case "failed": return "bg-error/20 text-error"
      default: return "bg-background text-muted-foreground"
    }
  }

  const filterTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.id.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || tx.type === filterType
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus

    return matchesSearch && matchesType && matchesStatus
  })

  const exportToCSV = () => {
    // Create CSV content
    const headers = ["Date", "Type", "Amount", "Status", "Description", "Transaction Hash"]
    const rows = filterTransactions.map(tx => [
      new Date(tx.created_at).toLocaleDateString(),
      tx.type,
      tx.amount.toString(),
      tx.status,
      tx.description,
      tx.tx_hash || ""
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n")

    // Download CSV file
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transaction_history_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const totalEarnings = transactions
    .filter(tx => tx.amount > 0 && tx.status === "completed")
    .reduce((sum, tx) => sum + tx.amount, 0)

  const totalWithdrawals = Math.abs(
    transactions
      .filter(tx => tx.amount < 0 && tx.status === "completed")
      .reduce((sum, tx) => sum + tx.amount, 0)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
            <Link href="/history" className="text-primary font-semibold">
              History
            </Link>
            <Link href="/analytics" className="hover:text-primary">
              Analytics
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Transaction History</h1>
            <p className="text-muted-foreground">View your complete transaction and activity history</p>
          </div>
          <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earnings</p>
                  <p className="text-2xl font-bold text-success">{totalEarnings.toLocaleString()} MINER</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Withdrawn</p>
                  <p className="text-2xl font-bold text-error">${totalWithdrawals.toFixed(2)}</p>
                </div>
                <ArrowDownRight className="w-8 h-8 text-error" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Stakes</p>
                  <p className="text-2xl font-bold text-primary">
                    {stakingHistory.filter(s => s.status === "active").length}
                  </p>
                </div>
                <Lock className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Transactions</p>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                </div>
                <Wallet className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="transactions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="staking">Staking History</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>All Transactions</CardTitle>
                <CardDescription>Complete history of your transactions and rewards</CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="mining">Mining</SelectItem>
                      <SelectItem value="staking">Staking</SelectItem>
                      <SelectItem value="withdrawal">Withdrawal</SelectItem>
                      <SelectItem value="deposit">Deposit</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-full md:w-40">
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Transactions List */}
                <div className="space-y-3">
                  {filterTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-background/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${getTransactionColor(transaction.type)} bg-opacity-10`}>
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {new Date(transaction.created_at).toLocaleDateString()}
                            {transaction.tx_hash && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-xs">
                                  {transaction.tx_hash.slice(0, 6)}...{transaction.tx_hash.slice(-4)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${getTransactionColor(transaction.type)}`}>
                          {transaction.amount > 0 ? "+" : ""}{transaction.amount.toLocaleString()} MINER
                        </div>
                        {transaction.amount_usd && (
                          <div className="text-sm text-muted-foreground">
                            ${Math.abs(transaction.amount_usd).toFixed(2)}
                          </div>
                        )}
                        <div className="mt-1">
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {filterTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No transactions found</p>
                    <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Staking History Tab */}
          <TabsContent value="staking">
            <Card>
              <CardHeader>
                <CardTitle>Staking History</CardTitle>
                <CardDescription>Your complete staking positions and rewards history</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stakingHistory.map((position) => (
                    <div key={position.id} className="p-4 border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-medium text-lg">{position.amount.toLocaleString()} MINER</div>
                          <div className="text-sm text-muted-foreground">
                            Started: {new Date(position.start_at).toLocaleDateString()}
                            {position.lock_until && ` • Lock until: ${new Date(position.lock_until).toLocaleDateString()}`}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            position.status === "active" ? "bg-success/20 text-success" :
                            position.status === "completed" ? "bg-primary/20 text-primary" :
                            "bg-error/20 text-error"
                          }>
                            {position.status.charAt(0).toUpperCase() + position.status.slice(1)}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">APY</div>
                          <div className="font-medium">{position.apy}%</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Rewards Earned</div>
                          <div className="font-medium text-success">{position.rewards_earned.toFixed(2)} MINER</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Duration</div>
                          <div className="font-medium">
                            {position.lock_until
                              ? Math.ceil((new Date(position.lock_until).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) + " days"
                              : "Flexible"
                            }
                          </div>
                        </div>
                        {position.tx_hash && (
                          <div>
                            <div className="text-muted-foreground">Transaction</div>
                            <div className="font-mono text-xs">
                              {position.tx_hash.slice(0, 6)}...{position.tx_hash.slice(-4)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {stakingHistory.length === 0 && (
                    <div className="text-center py-12">
                      <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No staking history found</p>
                      <Link href="/staking" className="text-primary hover:underline">
                        Start staking tokens
                      </Link>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Earnings Breakdown</CardTitle>
                  <CardDescription>Your earnings by category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-success rounded-full"></div>
                        Mining Rewards
                      </span>
                      <span className="font-medium">
                        {transactions
                          .filter(tx => tx.type === "mining" && tx.status === "completed")
                          .reduce((sum, tx) => sum + tx.amount, 0)
                          .toFixed(2)} MINER
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-primary rounded-full"></div>
                        Staking Rewards
                      </span>
                      <span className="font-medium">
                        {transactions
                          .filter(tx => tx.type === "staking" && tx.amount > 0 && tx.status === "completed")
                          .reduce((sum, tx) => sum + tx.amount, 0)
                          .toFixed(2)} MINER
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-accent rounded-full"></div>
                        Referral Bonuses
                      </span>
                      <span className="font-medium">
                        {transactions
                          .filter(tx => tx.type === "referral" && tx.status === "completed")
                          .reduce((sum, tx) => sum + tx.amount, 0)
                          .toFixed(2)} MINER
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-warning rounded-full"></div>
                        Other Bonuses
                      </span>
                      <span className="font-medium">
                        {transactions
                          .filter(tx => tx.type === "bonus" && tx.status === "completed")
                          .reduce((sum, tx) => sum + tx.amount, 0)
                          .toFixed(2)} MINER
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Summary</CardTitle>
                  <CardDescription>Your activity over the last 6 months</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>November 2024</span>
                      <span className="font-medium text-success">+125.50 MINER</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>October 2024</span>
                      <span className="font-medium text-success">+287.25 MINER</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>September 2024</span>
                      <span className="font-medium text-success">+195.75 MINER</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>August 2024</span>
                      <span className="font-medium text-success">+342.10 MINER</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>July 2024</span>
                      <span className="font-medium text-success">+278.90 MINER</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>June 2024</span>
                      <span className="font-medium text-success">+156.30 MINER</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}