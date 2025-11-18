import { EventEmitter } from 'events'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/redis-adapter'
import { Redis } from 'ioredis'
import { getDatabase } from '../database/mongodb/connection'
import { WebSocket } from 'ws'
import { ethers } from 'ethers'
import * as crypto from 'crypto'

// Real-time Analytics Configuration
interface AnalyticsConfig {
  redis: {
    host: string
    port: number
    password?: string
    db?: number
  }
  websocket: {
    port: number
    maxConnections: number
    heartbeatInterval: number
  }
  aggregation: {
    intervals: number[]
    retentionPeriods: number[]
    batchSizes: Record<string, number>
  }
  alerts: {
    priceChangeThreshold: number
    volumeSpikeThreshold: number
    errorRateThreshold: number
    latencyThreshold: number
  }
  metrics: {
    collectionInterval: number
    aggregationInterval: number
    retentionDays: number
  }
}

// Market Data Types
interface MarketData {
  symbol: string
  price: number
  volume24h: number
  change24h: number
  volatility: number
  liquidity: number
  marketCap: number
  timestamp: number
}

interface TradingMetrics {
  totalVolume: number
  openInterest: number
  activePositions: number
  profitLoss: {
    total: number
    winners: number
    losers: number
    averageProfit: number
    averageLoss: number
  }
  fees: {
    trading: number
    protocol: number
    flashLoan: number
  }
  timestamp: number
}

interface UserMetrics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  returningUsers: number
  retentionRate: number
  avgSessionDuration: number
  pagesPerSession: number
  conversionRate: number
  kycCompletionRate: number
  countries: Array<{
    country: string
    users: number
    newUsers: number
  }>
  devices: Array<{
    type: 'desktop' | 'mobile' | 'tablet'
    users: number
    newUsers: number
  }>
  timestamp: number
}

interface PerformanceMetrics {
  api: {
    responseTime: number
    errorRate: number
    throughput: number
    uptime: number
    activeConnections: number
  }
  database: {
    queryTime: number
    connections: number
    operations: {
      reads: number
      writes: number
      updates: number
      deletes: number
    }
    memory: {
      used: number
      total: number
    }
  }
  blockchain: {
    blockTime: number
    gasPrice: number
    transactionCount: number
    confirmationTime: number
    networkCongestion: number
  }
  timestamp: number
}

interface AlertData {
  id: string
  type: 'price_alert' | 'volume_spike' | 'error_spike' | 'performance_issue' | 'security_alert'
  severity: 'info' | 'warning' | 'critical' | 'emergency'
  title: string
  message: string
  data: any
  triggeredAt: number
  acknowledgedAt?: number
  resolvedAt?: number
  recipients: string[]
}

interface AggregatedData {
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1m'
  marketData: {
    prices: number[]
    volumes: number[]
    volatility: number[]
    high: number
    low: number
    open: number
    close: number
  }
  tradingMetrics: TradingMetrics
  userMetrics: UserMetrics
  performanceMetrics: PerformanceMetrics
  timestamp: number
}

interface RealTimeDashboard {
  currentMarketData: Map<string, MarketData>
  currentTradingMetrics: TradingMetrics
  currentUserMetrics: UserMetrics
  currentPerformanceMetrics: PerformanceMetrics
  historicalData: Map<string, Map<string, AggregatedData>>
  alerts: AlertData[]
  connections: Map<string, WebSocket>
  subscribers: Map<string, any>
}

export class RealTimeAnalyticsDashboard extends EventEmitter {
  private config: AnalyticsConfig
  private db: any
  private redis: Redis
  private io: Server
  private wss: Server
  private dashboard: RealTimeDashboard
  private provider: ethers.JsonRpcProvider
  private isInitialized: boolean = false

  constructor(config: AnalyticsConfig) {
    super()
    this.config = config
    this.db = getDatabase()
    this.dashboard = {
      currentMarketData: new Map(),
      currentTradingMetrics: {} as TradingMetrics,
      currentUserMetrics: {} as UserMetrics,
      currentPerformanceMetrics: {} as PerformanceMetrics,
      historicalData: new Map(),
      alerts: [],
      connections: new Map(),
      subscribers: new Map()
    }

    this.initialize()
  }

  private async initialize(): Promise<void> {
    try {
      console.log('📊 Initializing Real-time Analytics Dashboard...')

      // Initialize Redis
      this.redis = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db || 0,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        maxRetriesPerRequest: 3
      })

      // Initialize WebSocket server
      this.wss = new WebSocket.Server({
        port: this.config.websocket.port,
        maxPayload: 1024 * 1024, // 1MB
        perMessageDeflate: false
      })

      // Initialize Socket.IO
      this.io = new Server({
        adapter: createAdapter(this.redis),
        cors: {
          origin: "*",
          methods: ["GET", "POST"]
        }
      })

      this.setupWebSocketHandlers()
      this.setupSocketIOHandlers()

      // Initialize blockchain provider
      this.provider = new ethers.JsonRpcProvider('https://mainnet.infura.io/v3/YOUR_PROJECT_ID')

      // Start data collection
      this.startDataCollection()

      // Start aggregation processes
      this.startAggregationProcesses()

      // Start alert monitoring
      this.startAlertMonitoring()

      this.isInitialized = true
      console.log('✅ Real-time Analytics Dashboard initialized')

      this.emit('initialized')

    } catch (error) {
      console.error('❌ Failed to initialize Real-time Analytics Dashboard:', error)
      throw error
    }
  }

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws, request) => {
      const connectionId = crypto.randomBytes(16).toString('hex')
      const clientIp = request.socket.remoteAddress

      console.log(`🔌 WebSocket client connected: ${connectionId} from ${clientIp}`)

      this.dashboard.connections.set(connectionId, ws)

      // Send initial data
      ws.send(JSON.stringify({
        type: 'initial_data',
        data: {
          marketData: Array.from(this.dashboard.currentMarketData.values()),
          tradingMetrics: this.dashboard.currentTradingMetrics,
          userMetrics: this.dashboard.currentUserMetrics,
          performanceMetrics: this.dashboard.currentPerformanceMetrics,
          alerts: this.dashboard.alerts.slice(0, 10)
        }
      }))

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString())
          await this.handleWebSocketMessage(connectionId, message)
        } catch (error) {
          console.error('Error handling WebSocket message:', error)
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }))
        }
      })

      ws.on('close', () => {
        this.dashboard.connections.delete(connectionId)
        console.log(`🔌 WebSocket client disconnected: ${connectionId}`)
      })

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${connectionId}:`, error)
      })
    })

    console.log(`🔌 WebSocket server listening on port ${this.config.websocket.port}`)
  }

  private setupSocketIOHandlers(): void {
    this.io.on('connection', (socket) => {
      console.log('🔌 Socket.IO client connected')

      // Join analytics room
      socket.join('analytics')

      // Handle subscriptions
      socket.on('subscribe', async (data) => {
        await this.handleSocketSubscription(socket, data)
      })

      socket.on('unsubscribe', (data) => {
        this.handleSocketUnsubscription(socket, data)
      })

      socket.on('disconnect', () => {
        console.log('🔌 Socket.IO client disconnected')
      })
    })

    console.log('🔌 Socket.IO server initialized')
  }

  private async handleWebSocketMessage(connectionId: string, message: any): Promise<void> {
    switch (message.type) {
      case 'subscribe':
        await this.handleWebSocketSubscription(connectionId, message.data)
        break
      case 'unsubscribe':
        await this.handleWebSocketUnsubscription(connectionId, message.data)
        break
      case 'request_historical':
        await this.sendHistoricalData(connectionId, message.data)
        break
      case 'request_custom_query':
        await this.handleCustomQuery(connectionId, message.data)
        break
      default:
        console.log(`Unknown message type: ${message.type}`)
    }
  }

  private async handleWebSocketSubscription(connectionId: string, data: any): Promise<void> {
    const ws = this.dashboard.connections.get(connectionId)
    if (!ws) return

    this.dashboard.subscribers.set(connectionId, {
      subscriptions: data.subscriptions || [],
      filters: data.filters || {},
      lastActivity: Date.now()
    })

    ws.send(JSON.stringify({
      type: 'subscription_confirmed',
      data: { connectionId, subscriptions: data.subscriptions }
    }))

    // Send historical data for requested subscriptions
    if (data.subscriptions) {
      for (const subscription of data.subscriptions) {
        await this.sendHistoricalData(connectionId, {
          subscription,
          timeframe: data.timeframe || '1h',
          limit: data.limit || 100
        })
      }
    }
  }

  private async handleSocketUnsubscription(connectionId: string, data: any): Promise<void> {
    this.dashboard.subscribers.delete(connectionId)

    const ws = this.dashboard.connections.get(connectionId)
    if (ws) {
      ws.send(JSON.stringify({
        type: 'unsubscription_confirmed',
        data: { connectionId }
      }))
    }
  }

  private async handleSocketSubscription(socket: any, data: any): Promise<void> {
    socket.join(data.subscription)
    socket.emit('subscription_confirmed', data)

    // Send initial data for the subscription
    const initialData = await this.getSubscriptionData(data.subscription)
    socket.emit('data_update', {
      subscription: data.subscription,
      data: initialData
    })
  }

  private handleSocketUnsubscription(socket: any, data: any): void {
    socket.leave(data.subscription)
    socket.emit('unsubscription_confirmed', data)
  }

  // Data Collection
  private startDataCollection(): void {
    // Collect market data every second
    setInterval(() => {
      this.collectMarketData()
    }, 1000)

    // Collect trading metrics every 5 seconds
    setInterval(() => {
      this.collectTradingMetrics()
    }, 5000)

    // Collect user metrics every 30 seconds
    setInterval(() => {
      this.collectUserMetrics()
    }, 30000)

    // Collect performance metrics every 10 seconds
    setInterval(() => {
      this.collectPerformanceMetrics()
    }, 10000)

    // Collect blockchain data every 3 seconds
    setInterval(() => {
      this.collectBlockchainData()
    }, 3000)
  }

  private async collectMarketData(): Promise<void> {
    try {
      // In a real implementation, this would connect to multiple exchanges
      const symbols = ['BTC/USD', 'ETH/USD', 'BNB/USD', 'SOL/USD', 'MATIC/USD']

      for (const symbol of symbols) {
        const marketData: MarketData = {
          symbol,
          price: 1000 + (Math.random() - 0.5) * 200,
          volume24h: Math.random() * 1000000000,
          change24h: (Math.random() - 0.5) * 20,
          volatility: Math.random() * 5,
          liquidity: Math.random() * 10000000,
          marketCap: Math.random() * 50000000000,
          timestamp: Date.now()
        }

        this.dashboard.currentMarketData.set(symbol, marketData)
        this.broadcastUpdate('market_data', { symbol, data: marketData })
      }

      // Check for price alerts
      this.checkPriceAlerts()

    } catch (error) {
      console.error('Error collecting market data:', error)
    }
  }

  private async collectTradingMetrics(): Promise<void> {
    try {
      const positions = await this.db.getDatabase()
        .collection('trading_positions')
        .find({ status: 'active' })
        .toArray()

      const totalVolume = positions.reduce((sum, pos) => sum + (pos.size * pos.entryPrice), 0)
      const openInterest = totalVolume
      const totalPnL = positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0)

      const winners = positions.filter(pos => (pos.pnl || 0) > 0)
      const losers = positions.filter(pos => (pos.pnl || 0) < 0)

      const tradingMetrics: TradingMetrics = {
        totalVolume,
        openInterest,
        activePositions: positions.length,
        profitLoss: {
          total: totalPnL,
          winners: winners.length,
          losers: losers.length,
          averageProfit: winners.length > 0 ? winners.reduce((sum, pos) => sum + (pos.pnl || 0), 0) / winners.length : 0,
          averageLoss: losers.length > 0 ? Math.abs(losers.reduce((sum, pos) => sum + (pos.pnl || 0), 0) / losers.length) : 0
        },
        fees: {
          trading: totalVolume * 0.001,
          protocol: totalVolume * 0.0005,
          flashLoan: 0
        },
        timestamp: Date.now()
      }

      this.dashboard.currentTradingMetrics = tradingMetrics
      this.broadcastUpdate('trading_metrics', tradingMetrics)

      // Check for volume alerts
      this.checkVolumeAlerts(tradingMetrics)

    } catch (error) {
      console.error('Error collecting trading metrics:', error)
    }
  }

  private async collectUserMetrics(): Promise<void> {
    try {
      const now = Date.now()
      const dayAgo = now - (24 * 60 * 60 * 1000)
      const weekAgo = now - (7 * 24 * 60 * 60 * 1000)

      const totalUsers = await this.db.getDatabase()
        .collection('users')
        .countDocuments()

      const activeUsers = await this.db.getDatabase()
        .collection('users')
        .countDocuments({ lastActiveAt: { $gte: dayAgo } })

      const newUsers = await this.db.getDatabase()
        .collection('users')
        .countDocuments({ createdAt: { $gte: dayAgo } })

      const returningUsers = activeUsers - newUsers
      const retentionRate = activeUsers > 0 ? returningUsers / activeUsers : 0

      // Collect country and device data
      const countryStats = await this.getUserCountryStats()
      const deviceStats = await this.getUserDeviceStats()

      const userMetrics: UserMetrics = {
        totalUsers,
        activeUsers,
        newUsers,
        returningUsers,
        retentionRate,
        avgSessionDuration: 1800, // 30 minutes average
        pagesPerSession: 12,
        conversionRate: 0.15,
        kycCompletionRate: 0.65,
        countries: countryStats,
        devices: deviceStats,
        timestamp: now
      }

      this.dashboard.currentUserMetrics = userMetrics
      this.broadcastUpdate('user_metrics', userMetrics)

    } catch (error) {
      console.error('Error collecting user metrics:', error)
    }
  }

  private async collectPerformanceMetrics(): Promise<void> {
    try {
      // API metrics
      const apiResponseTime = Math.random() * 100 + 50 // 50-150ms
      const apiErrorRate = Math.random() * 0.05 // 0-5%
      const apiThroughput = Math.random() * 1000 + 500 // 500-1500 req/sec

      // Database metrics
      const dbQueryTime = Math.random() * 50 + 10 // 10-60ms
      const dbConnections = this.dashboard.currentPerformanceMetrics.database.connections

      // Blockchain metrics
      const blockTime = 12 // Ethereum block time
      const gasPrice = 30 + Math.random() * 20 // 30-50 gwei
      const transactionCount = Math.floor(Math.random() * 300 + 200)
      const confirmationTime = blockTime * 2 // 2 confirmations

      const performanceMetrics: PerformanceMetrics = {
        api: {
          responseTime: apiResponseTime,
          errorRate: apiErrorRate,
          throughput: apiThroughput,
          uptime: 99.9,
          activeConnections: this.dashboard.connections.size + this.dashboard.subscribers.size
        },
        database: {
          queryTime: dbQueryTime,
          connections: dbConnections,
          operations: {
            reads: Math.floor(Math.random() * 1000 + 500),
            writes: Math.floor(Math.random() * 100 + 50),
            updates: Math.floor(Math.random() * 50 + 25),
            deletes: Math.floor(Math.random() * 10 + 5)
          },
          memory: {
            used: 0.7,
            total: 1.0
          }
        },
        blockchain: {
          blockTime,
          gasPrice,
          transactionCount,
          confirmationTime,
          networkCongestion: gasPrice > 50 ? 'high' : 'low'
        },
        timestamp: Date.now()
      }

      this.dashboard.currentPerformanceMetrics = performanceMetrics
      this.broadcastUpdate('performance_metrics', performanceMetrics)

      // Check for performance alerts
      this.checkPerformanceAlerts(performanceMetrics)

    } catch (error) {
      console.error('Error collecting performance metrics:', error)
    }
  }

  private async collectBlockchainData(): Promise<void> {
    try {
      const blockNumber = await this.provider.getBlockNumber()
      const block = await this.provider.getBlock(blockNumber)

      const blockchainData = {
        blockNumber,
        blockTime: 12,
        gasPrice: await this.provider.getFeeData().then(fees => parseFloat(ethers.formatUnits(fees.gasPrice || 0, 'gwei'))),
        transactionCount: block.transactions.length,
        confirmationTime: 24,
        networkCongestion: 'medium'
      }

      this.broadcastUpdate('blockchain_data', blockchainData)

    } catch (error) {
      console.error('Error collecting blockchain data:', error)
    }
  }

  // Data Aggregation
  private startAggregationProcesses(): void {
    for (const interval of this.config.aggregation.intervals) {
      setInterval(() => {
        this.aggregateData(interval)
      }, interval)
    }
  }

  private async aggregateData(timeframe: string): Promise<void> {
    try {
      const now = Date.now()
      let timeRange: number

      switch (timeframe) {
        case '1m': timeRange = 60 * 1000; break
        case '5m': timeRange = 5 * 60 * 1000; break
        case '15m': timeRange = 15 * 60 * 1000; break
        case '1h': timeRange = 60 * 60 * 1000; break
        case '4h': timeRange = 4 * 60 * 60 * 1000; break
        case '1d': timeRange = 24 * 60 * 60 * 1000; break
        case '1w': timeRange = 7 * 24 * 60 * 60 * 1000; break
        case '1m': timeRange = 30 * 24 * 60 * 60 * 1000; break
        default: timeRange = 60 * 60 * 1000;
      }

      const startTime = now - timeRange
      const endTime = now

      // Aggregate market data
      const marketDataAgg = await this.aggregateMarketData(startTime, endTime, timeframe)

      // Create aggregated data record
      const aggregatedData: AggregatedData = {
        timeframe: timeframe as any,
        marketData: marketDataAgg,
        tradingMetrics: this.dashboard.currentTradingMetrics,
        userMetrics: this.dashboard.currentUserMetrics,
        performanceMetrics: this.dashboard.currentPerformanceMetrics,
        timestamp: now
      }

      // Store in historical data
      if (!this.dashboard.historicalData.has(timeframe)) {
        this.dashboard.historicalData.set(timeframe, new Map())
      }

      this.dashboard.historicalData.get(timeframe)!.set(now.toString(), aggregatedData)

      // Store in Redis for persistence
      await this.redis.setex(
        `analytics:aggregated:${timeframe}:${now}`,
        this.config.aggregation.retentionDays[0] * 24 * 60 * 60,
        JSON.stringify(aggregatedData)
      )

      // Clean up old data
      await this.cleanupHistoricalData(timeframe)

      // Broadcast update
      this.broadcastUpdate('aggregated_data', { timeframe, data: aggregatedData })

    } catch (error) {
      console.error(`Error aggregating data for timeframe ${timeframe}:`, error)
    }
  }

  private async aggregateMarketData(startTime: number, endTime: number, timeframe: string): Promise<any> {
    const marketData = Array.from(this.dashboard.currentMarketData.values())

    // Calculate aggregated metrics
    const prices = marketData.map(d => d.price)
    const volumes = marketData.map(d => d.volume24h)
    const volatilities = marketData.map(d => d.volatility)

    return {
      prices,
      volumes,
      volatility: volatilities,
      high: Math.max(...prices),
      low: Math.min(...prices),
      open: prices[0] || 0,
      close: prices[prices.length - 1] || 0
    }
  }

  // Alert System
  private startAlertMonitoring(): void {
    setInterval(() => {
      this.checkAllAlerts()
    }, 5000) // Check every 5 seconds
  }

  private async checkAllAlerts(): Promise<void> {
    await this.checkPriceAlerts()
    await this.checkVolumeAlerts(this.dashboard.currentTradingMetrics)
    await this.checkPerformanceAlerts(this.dashboard.currentPerformanceMetrics)
    await this.checkErrorAlerts()
  }

  private checkPriceAlerts(): void {
    for (const [symbol, marketData] of this.dashboard.currentMarketData.entries()) {
      if (Math.abs(marketData.change24h) > this.config.alerts.priceChangeThreshold) {
        this.createAlert({
          type: 'price_alert',
          severity: Math.abs(marketData.change24h) > 10 ? 'critical' : 'warning',
          title: `Price Alert: ${symbol}`,
          message: `${symbol} has changed by ${marketData.change24Path > 0 ? '+' : ''}${marketData.change24h.toFixed(2)}%`,
          data: { symbol, price: marketData.price, change24h: marketData.change24h }
        })
      }
    }
  }

  private checkVolumeAlerts(tradingMetrics: TradingMetrics): void {
    if (tradingMetrics.totalVolume > this.config.alerts.volumeSpikeThreshold) {
      this.createAlert({
        type: 'volume_spike',
        severity: 'warning',
        title: 'Volume Spike Detected',
        message: `Trading volume has spiked to $${tradingMetrics.totalVolume.toLocaleString()}`,
        data: { totalVolume: tradingMetrics.totalVolume }
      })
    }
  }

  private checkPerformanceAlerts(metrics: PerformanceMetrics): void {
    if (metrics.api.responseTime > this.config.alerts.latencyThreshold) {
      this.createAlert({
        type: 'performance_issue',
        severity: metrics.api.responseTime > 500 ? 'critical' : 'warning',
        title: 'High API Response Time',
        message: `API response time is ${metrics.api.responseTime.toFixed(0)}ms`,
        data: { responseTime: metrics.api.responseTime, errorRate: metrics.api.errorRate }
      })
    }

    if (metrics.api.errorRate > this.config.alerts.errorRateThreshold) {
      this.createAlert({
        type: 'error_spike',
        severity: metrics.api.errorRate > 0.1 ? 'critical' : 'warning',
        title: 'High Error Rate Detected',
        message: `API error rate is ${(metrics.api.errorRate * 100).toFixed(2)}%`,
        data: { errorRate: metrics.api.errorRate, totalRequests: metrics.api.throughput }
      })
    }
  }

  private async checkErrorAlerts(): Promise<void> {
    // Check for system errors from logs
    const errorCount = await this.getRecentErrorCount()

    if (errorCount > 10) {
      this.createAlert({
        type: 'error_spike',
        severity: errorCount > 50 ? 'critical' : 'warning',
        title: 'System Error Spike',
        message: `Detected ${errorCount} errors in the last minute`,
        data: { errorCount }
      })
    }
  }

  private async getRecentErrorCount(): Promise<number> {
    // In a real implementation, this would query error logs
    // For now, return a random number for demonstration
    return Math.floor(Math.random() * 20)
  }

  // Alert Management
  private createAlert(alertData: Omit<AlertData, 'id'>): void {
    const alert: AlertData = {
      id: crypto.randomBytes(16).toString('hex'),
      ...alertData,
      triggeredAt: Date.now(),
      recipients: ['admin', 'ops_team']
    }

    this.dashboard.alerts.unshift(alert)

    // Keep only last 100 alerts
    if (this.dashboard.alerts.length > 100) {
      this.dashboard.alerts = this.dashboard.alerts.slice(0, 100)
    }

    // Broadcast alert
    this.broadcastUpdate('alert', alert)

    // Store in Redis
    this.redis.setex(`alert:${alert.id}`, 86400, JSON.stringify(alert))

    this.emit('alert_created', alert)
  }

  // Broadcasting
  private broadcastUpdate(type: string, data: any): void {
    // Broadcast to WebSocket clients
    for (const [connectionId, ws] of this.dashboard.connections.entries()) {
      const subscriber = this.dashboard.subscribers.get(connectionId)

      if (subscriber && subscriber.subscriptions.includes(type)) {
        try {
          ws.send(JSON.stringify({
            type,
            data,
            timestamp: Date.now()
          }))
        } catch (error) {
          console.error(`Error broadcasting to ${connectionId}:`, error)
        }
      }
    }

    // Broadcast to Socket.IO clients
    this.io.emit('data_update', {
      type,
      data,
      timestamp: Date.now()
    })

    // Store in Redis
    this.redis.setex(`broadcast:${type}`, 60, JSON.stringify({ type, data, timestamp: Date.now() }))
  }

  // Data Retrieval
  private async sendHistoricalData(connectionId: string, data: any): Promise<void> {
    const ws = this.dashboard.connections.get(connectionId)
    if (!ws) return

    const { subscription, timeframe = '1h', limit = 100 } = data

    const historicalData = this.dashboard.historicalData.get(timeframe)
    if (!historicalData) return

    const timeSeries = Array.from(historicalData.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)

    ws.send(JSON.stringify({
      type: 'historical_data',
      data: {
        subscription,
        timeframe,
        data: timeSeries
      }
    }))
  }

  private async handleCustomQuery(connectionId: string, data: any): Promise<void> {
    const ws = this.dashboard.connections.get(connectionId)
    if (!ws) return

    try {
      const result = await this.executeCustomQuery(data.query)

      ws.send(JSON.stringify({
        type: 'query_result',
        data: {
          queryId: data.queryId,
          result
        }
      }))
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'query_error',
        data: {
          queryId: data.queryId,
          error: error.message
        }
      }))
    }
  }

  private async executeCustomQuery(query: any): Promise<any> {
    // In a real implementation, this would parse and execute custom queries
    // For now, return mock data based on query type

    switch (query.type) {
      case 'top_performers':
        return await this.getTopPerformers(query.timeframe || '1h')
      case 'user_analytics':
        return await this.getUserAnalytics(query.userId)
      case 'market_overview':
        return this.getMarketOverview()
      case 'system_health':
        return await this.getSystemHealth()
      default:
        throw new Error(`Unknown query type: ${query.type}`)
    }
  }

  private async getSubscriptionData(subscription: string): Promise<any> {
    switch (subscription) {
      case 'market_data':
        return Array.from(this.dashboard.currentMarketData.values())
      case 'trading_metrics':
        return this.dashboard.currentTradingMetrics
      case 'user_metrics':
        return this.dashboard.currentUserMetrics
      case 'performance_metrics':
        return this.dashboard.currentPerformanceMetrics
      default:
        return null
    }
  }

  private async getTopPerformers(timeframe: string): Promise<any[]> {
    // In a real implementation, this would query trader performance data
    return [
      { userId: 'trader1', profit: 15000, winRate: 0.75 },
      { userId: 'trader2', profit: 12000, winRate: 0.68 },
      { userId: 'trader3', profit: 10000, winRate: 0.82 }
    ]
  }

  private async getUserAnalytics(userId: string): Promise<any> {
    // In a real implementation, this would query user-specific analytics
    const identity = await this.db.getDatabase()
      .collection('zk_identities')
      .findOne({ userId })

    return {
      userId,
      reputationScore: identity?.reputationScore || 0,
      verificationCount: identity?.reputation?.verificationCount || 0,
      sessions: identity?.social?.followers?.length || 0
    }
  }

  private getMarketOverview(): any {
    return {
      totalMarketCap: Array.from(this.dashboard.currentMarketData.values())
        .reduce((sum, data) => sum + data.marketCap, 0),
      totalVolume: this.dashboard.currentTradingMetrics.totalVolume,
      topGainers: this.getTopGainers(),
      topLosers: this.getTopLosers()
    }
  }

  private getTopGainers(): any[] {
    return Array.from(this.dashboard.currentMarketData.values())
      .filter(data => data.change24h > 0)
      .sort((a, b) => b.change24h - a.change24h)
      .slice(0, 5)
  }

  private getTopLosers(): any[] {
    return Array.from(this.dashboard.currentMarketData.values())
      .filter(data => data.change24h < 0)
      .sort((a, b) => a.change24h - b.change24h)
      .slice(0, 5)
  }

  private async getSystemHealth(): Promise<any> {
    const now = Date.now()

    return {
      status: 'healthy',
      timestamp: now,
      services: {
        database: this.dashboard.currentPerformanceMetrics.database.connections > 0,
        redis: true,
        websocket: this.dashboard.connections.size > 0,
        blockchain: true
      },
      metrics: this.dashboard.currentPerformanceMetrics,
      alerts: this.dashboard.alerts.filter(a => a.severity === 'critical').length
    }
  }

  // Utility Methods
  private async getUserCountryStats(): Promise<Array<{ country: string; users: number; newUsers: number }>> {
    // In a real implementation, this would aggregate user location data
    return [
      { country: 'US', users: 10000, newUsers: 150 },
      { country: 'CN', users: 5000, newUsers: 75 },
      { country: 'UK', users: 3000, newUsers: 45 },
      { country: 'JP', users: 2000, newUsers: 30 },
      { country: 'DE', users: 1500, newUsers: 22 }
    ]
  }

  private async getUserDeviceStats(): Promise<Array<{ type: string; users: number; newUsers: number }>> {
    // In a real implementation, this would aggregate user device data
    return [
      { type: 'desktop', users: 7000, newUsers: 105 },
      { type: 'mobile', users: 4000, newUsers: 60 },
      { type: 'tablet', users: 1000, newUsers: 15 }
    ]
  }

  private async cleanupHistoricalData(timeframe: string): Promise<void> {
    const retentionDays = this.config.aggregation.retentionDays[0] || 7
    const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000)

    const historicalData = this.dashboard.historicalData.get(timeframe)
    if (!historicalData) return

    for (const [timestamp, data] of historicalData.entries()) {
      if (parseInt(timestamp) < cutoffTime) {
        historicalData.delete(timestamp)
        await this.redis.del(`analytics:aggregated:${timeframe}:${timestamp}`)
      }
    }
  }

  // Public API Methods
  async getDashboardData(): Promise<RealTimeDashboard> {
    return this.dashboard
  }

  async getHistoricalData(timeframe: string, limit?: number): Promise<AggregatedData[]> {
    const historicalData = this.dashboard.historicalData.get(timeframe)
    if (!historicalData) return []

    const dataPoints = Array.from(historicalData.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit || 100)

    return dataPoints
  }

  async getActiveAlerts(severity?: string): Promise<AlertData[]> {
    let alerts = this.dashboard.alerts

    if (severity) {
      alerts = alerts.filter(alert => alert.severity === severity)
    }

    return alerts
  }

  async acknowledgeAlert(alertId: string, userId: string): Promise<boolean> {
    const alertIndex = this.dashboard.alerts.findIndex(a => a.id === alertId)
    if (alertIndex === -1) return false

    this.dashboard.alerts[alertIndex].acknowledgedAt = Date.now()
    this.dashboard.alerts[alertIndex].recipients.push(userId)

    await this.redis.setex(`alert:${alertId}`, 86400, JSON.stringify(this.dashboard.alerts[alertIndex]))

    this.emit('alert_acknowledged', alertId, userId)

    return true
  }

  async resolveAlert(alertId: string, userId: string): Promise<boolean> {
    const alertIndex = this.dashboard.alerts.findIndex(a => a.id === alertId)
    if (alertIndex === -1) return false

    this.dashboard.alerts[alertIndex].resolvedAt = Date.now()

    await this.redis.setex(`alert:${alertId}`, 86400, JSON.stringify(this.dashboard.alerts[alertIndex]))

    this.emit('alert_resolved', alertId, userId)

    return true
  }

  async subscribeToUpdates(callback: (data: any) => void): Promise<string> {
    const subscriptionId = crypto.randomBytes(16).toString('hex')

    this.on('data_update', callback)
    this.on('alert_created', callback)
    this.on('alert_acknowledged', callback)
    this.on('alert_resolved', callback)

    return subscriptionId
  }

  async unsubscribeFromUpdates(subscriptionId: string): Promise<void> {
    this.removeAllListeners()
  }
}

export default RealTimeAnalyticsDashboard