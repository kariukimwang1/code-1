import { ethers } from 'ethers'
import { EventEmitter } from 'events'
import { getDatabase } from '../database/mongodb/connection'
import { ITradingPosition, IUser } from '../database/mongodb/schemas'
import * as crypto from 'crypto'

// Copy Trading Configuration
interface CopyTradingConfig {
  minFollowers: number
  maxFollowers: number
  minReputationScore: number
  copyFeePercentage: number
  minCopyAmount: number
  maxCopyAmount: number
  maxCopiersPerTrader: number
  allowPartialCopying: boolean
  autoStopLoss: boolean
  stopLossPercentage: number
  takeProfitMultiplier: number
  riskAdjustment: boolean
  enableSocialFeatures: boolean
}

// Trader Profile
interface TraderProfile {
  userId: string
  username: string
  avatar?: string
  bio?: string
  verified: boolean
  reputationScore: number
  followerCount: number
  followingCount: number
  totalTrades: number
  winRate: number
  averageProfit: number
  totalProfit: number
  profitPercentage: number
  riskScore: number
  sharpeRatio: number
  maxDrawdown: number
  averageHoldTime: number
  preferredMarkets: string[]
  tradingStyle: 'scalping' | 'day_trading' | 'swing_trading' | 'position_trading'
  riskTolerance: 'conservative' | 'moderate' | 'aggressive' | 'extreme'
  stats: {
    dailyProfit: number
    weeklyProfit: number
    monthlyProfit: number
    yearlyProfit: number
    bestDay: number
    worstDay: number
    consecutiveWins: number
    consecutiveLosses: number
    profitFactor: number
    recoveryTime: number
  }
  copySettings: {
    isCopyable: boolean
    minCopyAmount: number
    maxCopyAmount: number
    copyFeePercentage: number
    allowPartialCopying: boolean
    autoApproveFollowers: boolean
    blacklist: string[]
    whitelist?: string[]
  }
  social: {
    twitter?: string
    discord?: string
    telegram?: string
    website?: string
    achievements: Array<{
      id: string
      name: string
      description: string
      icon: string
      earnedAt: Date
    }>
    badges: Array<{
      type: 'verified' | 'top_trader' | 'profit_master' | 'risk_manager' | 'social_influencer'
      level: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
      earnedAt: Date
    }>
    followers: Array<{
      userId: string
      followDate: Date
      copyAmount: number
      copyActive: boolean
      profitShared: number
    }>
  }
  createdAt: Date
  updatedAt: Date
}

// Copy Trading Relationship
interface CopyRelationship {
  id: string
  traderId: string
  copierId: string
  copyAmount: number
  copyPercentage: number
  maxDrawdown: number
  stopLossEnabled: boolean
  stopLossPercentage: number
  takeProfitEnabled: boolean
  takeProfitMultiplier: number
  reverseTrading: boolean
  status: 'active' | 'paused' | 'stopped' | 'pending'
  autoAdjustRisk: boolean
  riskAdjustmentFactor: number
  followedMarkets: string[]
  excludedMarkets: string[]
  maxPositions: number
  minTradeSize: number
  fees: {
    copyFee: number
    performanceFee: number
    totalFees: number
  }
  performance: {
    totalInvested: number
    totalProfit: number
    profitPercentage: number
    winRate: number
    sharpeRatio: number
    maxDrawdown: number
    tradesCopied: number
    profitableTrades: number
    lastUpdate: Date
  }
  history: Array<{
    tradeId: string
    action: 'copied' | 'skipped' | 'reversed'
    originalAmount: number
    copiedAmount: number
    profit: number
    fee: number
    timestamp: Date
    reason?: string
  }>
  createdAt: Date
  updatedAt: Date
}

// Social Features
interface SocialPost {
  id: string
  userId: string
  type: 'trade_analysis' | 'market_insight' | 'prediction' | 'achievement' | 'general'
  content: string
  attachments: Array<{
    type: 'image' | 'chart' | 'trade_screenshot'
    url: string
    thumbnail?: string
  }>
  tags: string[]
  mentions: string[]
  visibility: 'public' | 'followers' | 'private'
  likes: number
  dislikes: number
  comments: number
  shares: number
  views: number
  engagement: {
    likes: string[]
    dislikes: string[]
    bookmarks: string[]
  }
  metadata: {
    tradeId?: string
    marketData?: any
    sentiment: number
    confidence?: number
  }
  createdAt: Date
  updatedAt: Date
}

interface TradingChallenge {
  id: string
  creatorId: string
  title: string
  description: string
  type: 'profit' | 'win_rate' | 'risk_management' | 'volume' | 'custom'
  category: 'daily' | 'weekly' | 'monthly' | 'custom'
  rules: Record<string, any>
  prize: {
    type: 'tokens' | 'nft' | 'badge' | 'recognition'
    value: any
    description: string
  }
  participants: Array<{
    userId: string
    joinDate: Date
    currentScore: number
    status: 'active' | 'completed' | 'disqualified'
    progress: Record<string, number>
  }>
  startDate: Date
  endDate: Date
  status: 'upcoming' | 'active' | 'completed' | 'cancelled'
  leaderboard: Array<{
    rank: number
    userId: string
    username: string
    score: number
    profit?: number
    winRate?: number
  }>
  metadata: {
    difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
    participants: number
    maxParticipants?: number
    entryFee?: number
  }
  createdAt: Date
  updatedAt: Date
}

export class CopyTradingPlatform extends EventEmitter {
  private config: CopyTradingConfig
  private db: any
  private provider: ethers.JsonRpcProvider
  private traderProfiles: Map<string, TraderProfile> = new Map()
  private copyRelationships: Map<string, CopyRelationship> = new Map()
  private socialPosts: Map<string, SocialPost> = new Map()
  private tradingChallenges: Map<string, TradingChallenge> = new Map()
  private isInitialized: boolean = false

  constructor(config: CopyTradingConfig, provider: ethers.JsonRpcProvider) {
    super()
    this.config = config
    this.db = getDatabase()
    this.provider = provider

    this.loadExistingData()
    this.startBackgroundProcesses()
  }

  private async loadExistingData(): Promise<void> {
    try {
      // Load trader profiles
      const profiles = await this.db.getDatabase()
        .collection('trader_profiles')
        .find({})
        .toArray()

      profiles.forEach((profile: TraderProfile) => {
        this.traderProfiles.set(profile.userId, profile)
      })

      // Load copy relationships
      const relationships = await this.db.getDatabase()
        .collection('copy_relationships')
        .find({ status: 'active' })
        .toArray()

      relationships.forEach((relationship: CopyRelationship) => {
        this.copyRelationships.set(relationship.id, relationship)
      })

      // Load social posts
      const posts = await this.db.getDatabase()
        .collection('social_posts')
        .find({})
        .sort({ createdAt: -1 })
        .limit(1000)
        .toArray()

      posts.forEach((post: SocialPost) => {
        this.socialPosts.set(post.id, post)
      })

      // Load trading challenges
      const challenges = await this.db.getDatabase()
        .collection('trading_challenges')
        .find({ status: { $in: ['upcoming', 'active'] } })
        .toArray()

      challenges.forEach((challenge: TradingChallenge) => {
        this.tradingChallenges.set(challenge.id, challenge)
      })

      this.isInitialized = true
      console.log(`Loaded ${profiles.length} trader profiles, ${relationships.length} copy relationships`)

    } catch (error) {
      console.error('Error loading existing data:', error)
    }
  }

  private startBackgroundProcesses(): void {
    // Update trader statistics every 5 minutes
    setInterval(() => {
      this.updateTraderStatistics()
    }, 300000)

    // Process copy trades every 30 seconds
    setInterval(() => {
      this.processCopyTrades()
    }, 30000)

    // Update social engagement every 10 minutes
    setInterval(() => {
      this.updateSocialEngagement()
    }, 600000)

    // Process trading challenges every hour
    setInterval(() => {
      this.processTradingChallenges()
    }, 3600000)

    // Calculate leaderboards every hour
    setInterval(() => {
      this.updateLeaderboards()
    }, 3600000)
  }

  // Trader Profile Management
  async createTraderProfile(userId: string, profileData: Partial<TraderProfile>): Promise<TraderProfile> {
    const user = await this.db.getDatabase()
      .collection('users')
      .findOne({ walletAddress: userId })

    if (!user) {
      throw new Error('User not found')
    }

    // Check if user meets minimum requirements
    if (user.stats.reputationScore < this.config.minReputationScore) {
      throw new Error(`Insufficient reputation score. Minimum: ${this.config.minReputationScore}`)
    }

    const profile: TraderProfile = {
      userId,
      username: profileData.username!,
      avatar: profileData.avatar,
      bio: profileData.bio,
      verified: false,
      reputationScore: user.stats.reputationScore,
      followerCount: 0,
      followingCount: 0,
      totalTrades: user.stats.successfulTrades,
      winRate: user.stats.successRate,
      averageProfit: user.stats.totalProfit / Math.max(user.stats.successfulTrades, 1),
      totalProfit: user.stats.totalProfit,
      profitPercentage: (user.stats.totalProfit / Math.max(user.stats.totalVolume, 1)) * 100,
      riskScore: user.stats.riskScore,
      sharpeRatio: user.stats.successRate > 0 ? 1.5 : 0, // Simplified
      maxDrawdown: 0, // Would calculate from trade history
      averageHoldTime: 86400000, // 24 hours average
      preferredMarkets: profileData.preferredMarkets || ['BTC/USD', 'ETH/USD'],
      tradingStyle: profileData.tradingStyle || 'day_trading',
      riskTolerance: profileData.riskTolerance || 'moderate',
      stats: {
        dailyProfit: 0,
        weeklyProfit: 0,
        monthlyProfit: 0,
        yearlyProfit: user.stats.totalProfit,
        bestDay: 0,
        worstDay: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        profitFactor: user.stats.successRate > 0.6 ? 1.8 : 1.2,
        recoveryTime: 0
      },
      copySettings: {
        isCopyable: true,
        minCopyAmount: this.config.minCopyAmount,
        maxCopyAmount: this.config.maxCopyAmount,
        copyFeePercentage: this.config.copyFeePercentage,
        allowPartialCopying: this.config.allowPartialCopying,
        autoApproveFollowers: true,
        blacklist: []
      },
      social: {
        achievements: [],
        badges: [],
        followers: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save to database
    await this.db.getDatabase()
      .collection('trader_profiles')
      .insertOne(profile)

    this.traderProfiles.set(userId, profile)
    this.emit('traderProfileCreated', profile)

    return profile
  }

  async followTrader(traderId: string, copierId: string, copySettings: {
    copyAmount: number
    copyPercentage: number
    maxDrawdown?: number
    stopLossEnabled?: boolean
    stopLossPercentage?: number
    reverseTrading?: boolean
    autoAdjustRisk?: boolean
  }): Promise<CopyRelationship> {
    const trader = this.traderProfiles.get(traderId)
    if (!trader) {
      throw new Error('Trader not found')
    }

    if (!trader.copySettings.isCopyable) {
      throw new Error('Trader is not accepting copiers')
    }

    if (trader.followerCount >= this.config.maxCopiersPerTrader) {
      throw new Error('Trader has reached maximum number of copiers')
    }

    const copier = this.traderProfiles.get(copierId)
    if (!copier) {
      throw new Error('Copier profile not found')
    }

    // Validate copy settings
    if (copySettings.copyAmount < trader.copySettings.minCopyAmount) {
      throw new Error(`Copy amount below minimum: ${trader.copySettings.minCopyAmount}`)
    }

    if (copySettings.copyAmount > trader.copySettings.maxCopyAmount) {
      throw new Error(`Copy amount exceeds maximum: ${trader.copySettings.maxCopyAmount}`)
    }

    // Check if already following
    const existingRelationship = Array.from(this.copyRelationships.values())
      .find(rel => rel.traderId === traderId && rel.copierId === copierId)

    if (existingRelationship) {
      throw new Error('Already following this trader')
    }

    const relationship: CopyRelationship = {
      id: `copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      traderId,
      copierId,
      copyAmount: copySettings.copyAmount,
      copyPercentage: copySettings.copyPercentage,
      maxDrawdown: copySettings.maxDrawdown || this.config.stopLossPercentage,
      stopLossEnabled: copySettings.stopLossEnabled ?? this.config.autoStopLoss,
      stopLossPercentage: copySettings.stopLossPercentage ?? this.config.stopLossPercentage,
      takeProfitEnabled: false,
      takeProfitMultiplier: this.config.takeProfitMultiplier,
      reverseTrading: copySettings.reverseTrading ?? false,
      status: 'active',
      autoAdjustRisk: copySettings.autoAdjustRisk ?? this.config.riskAdjustment,
      riskAdjustmentFactor: 0.8,
      followedMarkets: trader.preferredMarkets,
      excludedMarkets: [],
      maxPositions: 10,
      minTradeSize: 10,
      fees: {
        copyFee: 0,
        performanceFee: 0,
        totalFees: 0
      },
      performance: {
        totalInvested: 0,
        totalProfit: 0,
        profitPercentage: 0,
        winRate: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        tradesCopied: 0,
        profitableTrades: 0,
        lastUpdate: new Date()
      },
      history: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save relationship
    await this.db.getDatabase()
      .collection('copy_relationships')
      .insertOne(relationship)

    this.copyRelationships.set(relationship.id, relationship)

    // Update trader follower count
    trader.followerCount++
    trader.social.followers.push({
      userId: copierId,
      followDate: new Date(),
      copyAmount: copySettings.copyAmount,
      copyActive: true,
      profitShared: 0
    })

    await this.db.getDatabase()
      .collection('trader_profiles')
      .updateOne(
        { userId: traderId },
        { $set: { followerCount: trader.followerCount, social: trader.social } }
      )

    // Update copier following count
    copier.followingCount++
    await this.db.getDatabase()
      .collection('trader_profiles')
      .updateOne(
        { userId: copierId },
        { $set: { followingCount: copier.followingCount } }
      )

    this.traderProfiles.set(traderId, trader)
    this.traderProfiles.set(copierId, copier)

    this.emit('traderFollowed', traderId, copierId, relationship)

    return relationship
  }

  async unfollowTrader(traderId: string, copierId: string): Promise<void> {
    const relationship = Array.from(this.copyRelationships.values())
      .find(rel => rel.traderId === traderId && rel.copierId === copierId)

    if (!relationship) {
      throw new Error('Copy relationship not found')
    }

    // Update relationship status
    relationship.status = 'stopped'
    relationship.updatedAt = new Date()

    await this.db.getDatabase()
      .collection('copy_relationships')
      .updateOne({ _id: relationship.id }, { $set: { status: 'stopped', updatedAt: relationship.updatedAt } })

    // Update trader follower count
    const trader = this.traderProfiles.get(traderId)
    if (trader) {
      trader.followerCount = Math.max(0, trader.followerCount - 1)
      trader.social.followers = trader.social.followers.filter(f => f.userId !== copierId)

      await this.db.getDatabase()
        .collection('trader_profiles')
        .updateOne(
          { userId: traderId },
          { $set: { followerCount: trader.followerCount, social: trader.social } }
        )

      this.traderProfiles.set(traderId, trader)
    }

    // Update copier following count
    const copier = this.traderProfiles.get(copierId)
    if (copier) {
      copier.followingCount = Math.max(0, copier.followingCount - 1)

      await this.db.getDatabase()
        .collection('trader_profiles')
        .updateOne(
          { userId: copierId },
          { $set: { followingCount: copier.followingCount } }
        )

      this.traderProfiles.set(copierId, copier)
    }

    this.emit('traderUnfollowed', traderId, copierId)
  }

  // Social Features
  async createPost(userId: string, postData: {
    type: SocialPost['type']
    content: string
    attachments?: Array<{
      type: 'image' | 'chart' | 'trade_screenshot'
      url: string
      thumbnail?: string
    }>
    tags?: string[]
    mentions?: string[]
    visibility?: SocialPost['visibility']
    metadata?: any
  }): Promise<SocialPost> {
    const profile = this.traderProfiles.get(userId)
    if (!profile) {
      throw new Error('Trader profile not found')
    }

    const post: SocialPost = {
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: postData.type,
      content: postData.content,
      attachments: postData.attachments || [],
      tags: postData.tags || [],
      mentions: postData.mentions || [],
      visibility: postData.visibility || 'public',
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      views: 0,
      engagement: {
        likes: [],
        dislikes: [],
        bookmarks: []
      },
      metadata: {
        sentiment: 0,
        ...postData.metadata
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save post
    await this.db.getDatabase()
      .collection('social_posts')
      .insertOne(post)

    this.socialPosts.set(post.id, post)

    // Update profile activity
    profile.updatedAt = new Date()
    await this.db.getDatabase()
      .collection('trader_profiles')
      .updateOne({ userId }, { $set: { updatedAt: profile.updatedAt } })

    this.emit('postCreated', post)

    return post
  }

  async createChallenge(creatorId: string, challengeData: {
    title: string
    description: string
    type: TradingChallenge['type']
    category: TradingChallenge['category']
    rules: Record<string, any>
    prize: {
      type: string
      value: any
      description: string
    }
    startDate: Date
    endDate: Date
    maxParticipants?: number
    entryFee?: number
    difficulty?: 'easy' | 'medium' | 'hard' | 'extreme'
  }): Promise<TradingChallenge> {
    const profile = this.traderProfiles.get(creatorId)
    if (!profile) {
      throw new Error('Trader profile not found')
    }

    const challenge: TradingChallenge = {
      id: `challenge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      creatorId,
      title: challengeData.title,
      description: challengeData.description,
      type: challengeData.type,
      category: challengeData.category,
      rules: challengeData.rules,
      prize: challengeData.prize,
      participants: [],
      startDate: challengeData.startDate,
      endDate: challengeData.endDate,
      status: 'upcoming',
      leaderboard: [],
      metadata: {
        difficulty: challengeData.difficulty || 'medium',
        participants: 0,
        maxParticipants: challengeData.maxParticipants,
        entryFee: challengeData.entryFee
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Save challenge
    await this.db.getDatabase()
      .collection('trading_challenges')
      .insertOne(challenge)

    this.tradingChallenges.set(challenge.id, challenge)

    this.emit('challengeCreated', challenge)

    return challenge
  }

  async joinChallenge(challengeId: string, userId: string): Promise<void> {
    const challenge = this.tradingChallenges.get(challengeId)
    if (!challenge) {
      throw new Error('Challenge not found')
    }

    if (challenge.status !== 'upcoming' && challenge.status !== 'active') {
      throw new Error('Challenge is not accepting participants')
    }

    if (challenge.metadata.maxParticipants && challenge.participants.length >= challenge.metadata.maxParticipants) {
      throw new Error('Challenge has reached maximum participants')
    }

    const profile = this.traderProfiles.get(userId)
    if (!profile) {
      throw new Error('Trader profile not found')
    }

    // Check if already participating
    if (challenge.participants.some(p => p.userId === userId)) {
      throw new Error('Already participating in this challenge')
    }

    // Add participant
    challenge.participants.push({
      userId,
      joinDate: new Date(),
      currentScore: 0,
      status: 'active',
      progress: {}
    })

    challenge.metadata.participants = challenge.participants.length

    // Save challenge
    await this.db.getDatabase()
      .collection('trading_challenges')
      .updateOne(
        { _id: challengeId },
        { $set: { participants: challenge.participants, metadata: challenge.metadata } }
      )

    this.tradingChallenges.set(challengeId, challenge)

    this.emit('challengeJoined', challengeId, userId)
  }

  // Core Copy Trading Logic
  private async processCopyTrades(): Promise<void> {
    // Get active copy relationships
    const activeRelationships = Array.from(this.copyRelationships.values())
      .filter(rel => rel.status === 'active')

    for (const relationship of activeRelationships) {
      try {
        await this.processTraderTrades(relationship)
      } catch (error) {
        console.error(`Error processing copy trades for relationship ${relationship.id}:`, error)
      }
    }
  }

  private async processTraderTrades(relationship: CopyRelationship): Promise<void> {
    const trader = this.traderProfiles.get(relationship.traderId)
    if (!trader) return

    // Get recent trades from trader
    const recentTrades = await this.db.getDatabase()
      .collection('trading_positions')
      .find({
        user: relationship.traderId,
        status: 'active',
        openedAt: { $gte: new Date(Date.now() - 300000) } // Last 5 minutes
      })
      .toArray()

    for (const trade of recentTrades) {
      // Check if trade should be copied
      if (this.shouldCopyTrade(trade, relationship)) {
        await this.copyTrade(trade, relationship)
      }
    }
  }

  private shouldCopyTrade(trade: any, relationship: CopyRelationship): boolean {
    // Check if market is in preferred markets
    if (relationship.followedMarkets.length > 0 &&
        !relationship.followedMarkets.includes(trade.symbol)) {
      return false
    }

    // Check if market is in excluded markets
    if (relationship.excludedMarkets.includes(trade.symbol)) {
      return false
    }

    // Check trade size
    const tradeValue = trade.size * trade.entryPrice
    if (tradeValue < relationship.minTradeSize) {
      return false
    }

    // Check max positions
    const currentPositionCount = Array.from(this.copyRelationships.values())
      .filter(rel => rel.copierId === relationship.copierId && rel.status === 'active')
      .length

    if (currentPositionCount >= relationship.maxPositions) {
      return false
    }

    return true
  }

  private async copyTrade(originalTrade: any, relationship: CopyRelationship): Promise<void> {
    const copier = this.traderProfiles.get(relationship.copierId)
    if (!copier) return

    // Calculate copy amount
    const originalValue = originalTrade.size * originalTrade.entryPrice
    let copyAmount = Math.min(originalValue * relationship.copyPercentage, relationship.copyAmount)

    // Apply risk adjustment if enabled
    if (relationship.autoAdjustRisk) {
      copyAmount *= relationship.riskAdjustmentFactor
    }

    // Check copier's balance
    const copierBalance = await this.getUserBalance(relationship.copierId)
    if (copierBalance < copyAmount) {
      console.log(`Insufficient balance for copier ${relationship.copierId}`)
      return
    }

    // Calculate fees
    const copyFee = copyAmount * this.config.copyFeePercentage
    const performanceFee = 0 // Would calculate based on profit

    // Execute copy trade
    try {
      // In a real implementation, this would execute the actual trade
      const tradeCopy = {
        user: relationship.copierId,
        symbol: originalTrade.symbol,
        type: relationship.reverseTrading ?
          (originalTrade.type === 'long' ? 'short' : 'long') :
          originalTrade.type,
        strategy: 'copy_trading',
        entryPrice: originalTrade.entryPrice,
        currentPrice: originalTrade.entryPrice,
        size: copyAmount / originalTrade.entryPrice,
        leverage: originalTrade.leverage,
        margin: copyAmount / originalTrade.leverage,
        pnl: 0,
        pnlPercentage: 0,
        fees: originalTrade.fees + copyFee,
        copiedFrom: originalTrade._id,
        isCopyTrading: true,
        status: 'active' as const,
        network: originalTrade.network,
        protocol: originalTrade.protocol,
        metadata: {
          originalTradeId: originalTrade._id,
          relationshipId: relationship.id,
          copyPercentage: relationship.copyPercentage,
          riskAdjusted: relationship.autoAdjustRisk
        },
        tags: ['copy_trading'],
        aiGenerated: false,
        aiConfidence: originalTrade.aiConfidence,
        riskLevel: originalTrade.riskLevel,
        openedAt: new Date(),
        lastUpdated: new Date()
      }

      // Save copied trade
      const result = await this.db.getDatabase()
        .collection('trading_positions')
        .insertOne(tradeCopy)

      // Update relationship performance
      relationship.performance.totalInvested += copyAmount
      relationship.performance.tradesCopied += 1
      relationship.performance.lastUpdate = new Date()
      relationship.fees.copyFee += copyFee
      relationship.fees.totalFees += copyFee + performanceFee

      // Add to history
      relationship.history.push({
        tradeId: result.insertedId.toString(),
        action: 'copied',
        originalAmount: originalValue,
        copiedAmount: copyAmount,
        profit: 0,
        fee: copyFee,
        timestamp: new Date()
      })

      await this.db.getDatabase()
        .collection('copy_relationships')
        .updateOne({ _id: relationship.id }, { $set: relationship })

      this.emit('tradeCopied', relationship, tradeCopy)

    } catch (error) {
      console.error('Error executing copy trade:', error)
    }
  }

  // Private helper methods
  private async updateTraderStatistics(): Promise<void> {
    for (const [userId, profile] of this.traderProfiles.entries()) {
      try {
        // Calculate recent statistics
        const recentTrades = await this.db.getDatabase()
          .collection('trading_positions')
          .find({
            user: userId,
            openedAt: { $gte: new Date(Date.now() - 86400000) } // Last 24 hours
          })
          .toArray()

        const totalProfit = recentTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
        const winningTrades = recentTrades.filter(trade => (trade.pnl || 0) > 0)
        const winRate = recentTrades.length > 0 ? winningTrades.length / recentTrades.length : 0

        profile.stats.dailyProfit = totalProfit
        profile.stats.consecutiveWins = this.calculateConsecutiveWins(recentTrades, true)
        profile.stats.consecutiveLosses = this.calculateConsecutiveWins(recentTrades, false)

        // Update reputation score based on performance
        const newReputation = this.calculateReputationScore(profile)
        if (Math.abs(newReputation - profile.reputationScore) > 0.1) {
          profile.reputationScore = newReputation

          await this.db.getDatabase()
            .collection('trader_profiles')
            .updateOne({ userId }, { $set: { reputationScore: profile.reputationScore } })
        }

        // Check for achievements
        await this.checkAchievements(userId, profile)

        profile.updatedAt = new Date()
        this.traderProfiles.set(userId, profile)

      } catch (error) {
        console.error(`Error updating statistics for trader ${userId}:`, error)
      }
    }
  }

  private async updateSocialEngagement(): Promise<void> {
    // Update post engagement metrics
    for (const [postId, post] of this.socialPosts.entries()) {
      try {
        const engagements = await this.db.getDatabase()
          .collection('post_engagements')
          .find({ postId })
          .toArray()

        const likes = engagements.filter(e => e.type === 'like').length
        const dislikes = engagements.filter(e => e.type === 'dislike').length
        const comments = engagements.filter(e => e.type === 'comment').length

        post.likes = likes
        post.dislikes = dislikes
        post.comments = comments

        post.engagement.likes = engagements
          .filter(e => e.type === 'like')
          .map(e => e.userId)

        await this.db.getDatabase()
          .collection('social_posts')
          .updateOne({ _id: postId }, { $set: post })

      } catch (error) {
        console.error(`Error updating engagement for post ${postId}:`, error)
      }
    }
  }

  private async processTradingChallenges(): Promise<void> {
    const now = new Date()

    for (const [challengeId, challenge] of this.tradingChallenges.entries()) {
      try {
        // Update challenge status
        if (now >= challenge.startDate && challenge.status === 'upcoming') {
          challenge.status = 'active'
          await this.db.getDatabase()
            .collection('trading_challenges')
            .updateOne({ _id: challengeId }, { $set: { status: 'active' } })
        }

        if (now >= challenge.endDate && challenge.status === 'active') {
          challenge.status = 'completed'
          await this.finalizeChallenge(challenge)
        }

        // Update participant scores
        if (challenge.status === 'active') {
          await this.updateChallengeScores(challenge)
        }

      } catch (error) {
        console.error(`Error processing challenge ${challengeId}:`, error)
      }
    }
  }

  private async updateLeaderboards(): Promise<void> {
    // Update various leaderboards
    await this.updateTopTradersLeaderboard()
    await this.updateCopiersLeaderboard()
    await this.updateChallengeLeaderboard()
  }

  private async updateTopTradersLeaderboard(): Promise<void> {
    const topTraders = Array.from(this.traderProfiles.values())
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 100)

    // Save leaderboard
    await this.db.getDatabase()
      .collection('leaderboards')
      .updateOne(
        { type: 'top_traders' },
        {
          $set: {
            type: 'top_traders',
            traders: topTraders.map((trader, index) => ({
              rank: index + 1,
              userId: trader.userId,
              username: trader.username,
              avatar: trader.avatar,
              totalProfit: trader.totalProfit,
              winRate: trader.winRate,
              reputationScore: trader.reputationScore,
              followerCount: trader.followerCount
            })),
            updatedAt: new Date()
          }
        },
        { upsert: true }
      )

    this.emit('leaderboardUpdated', 'top_traders', topTraders)
  }

  private async getUserBalance(userId: string): Promise<number> {
    // Get user balance from database or blockchain
    const user = await this.db.getDatabase()
      .collection('users')
      .findOne({ walletAddress: userId })

    return user?.stats.totalProfit || 0
  }

  private calculateReputationScore(profile: TraderProfile): number {
    let score = profile.reputationScore

    // Performance factors
    score += profile.stats.yearlyProfit * 0.1
    score += profile.winRate * 20
    score += profile.sharpeRatio * 5

    // Social factors
    score += Math.min(profile.followerCount * 0.01, 10)
    score += profile.social.badges.length * 5

    // Risk management
    score -= profile.maxDrawdown * 10
    score += (10 - profile.riskScore) * 2

    return Math.max(0, Math.min(100, score))
  }

  private calculateConsecutiveWins(trades: any[], wins: boolean): number {
    let consecutive = 0
    let maxConsecutive = 0

    for (const trade of trades.sort((a, b) => a.openedAt.getTime() - b.openedAt.getTime())) {
      const isWin = (trade.pnl || 0) > 0
      if (isWin === wins) {
        consecutive++
        maxConsecutive = Math.max(maxConsecutive, consecutive)
      } else {
        consecutive = 0
      }
    }

    return maxConsecutive
  }

  private async checkAchievements(userId: string, profile: TraderProfile): Promise<void> {
    const achievements = []

    // Check for various achievements
    if (profile.followerCount >= 100) {
      achievements.push({
        id: 'influencer',
        name: 'Social Influencer',
        description: 'Reached 100 followers',
        icon: '👥',
        earnedAt: new Date()
      })
    }

    if (profile.stats.profitFactor >= 2.0) {
      achievements.push({
        id: 'profit_master',
        name: 'Profit Master',
        description: 'Achieved profit factor of 2.0',
        icon: '💰',
        earnedAt: new Date()
      })
    }

    if (profile.stats.consecutiveWins >= 10) {
      achievements.push({
        id: 'hot_streak',
        name: 'Hot Streak',
        description: '10 consecutive winning trades',
        icon: '🔥',
        earnedAt: new Date()
      })
    }

    // Add new achievements to profile
    for (const achievement of achievements) {
      if (!profile.social.achievements.some(a => a.id === achievement.id)) {
        profile.social.achievements.push(achievement)
      }
    }
  }

  private async finalizeChallenge(challenge: TradingChallenge): Promise<void> {
    // Calculate final scores and determine winners
    challenge.participants.forEach(participant => {
      // Calculate final score based on challenge type
      if (challenge.type === 'profit') {
        const user = this.traderProfiles.get(participant.userId)
        if (user) {
          participant.currentScore = user.stats.yearlyProfit || 0
        }
      } else if (challenge.type === 'win_rate') {
        const user = this.traderProfiles.get(participant.userId)
        if (user) {
          participant.currentScore = user.winRate * 100
        }
      }
    })

    // Sort and create leaderboard
    challenge.leaderboard = challenge.participants
      .sort((a, b) => b.currentScore - a.currentScore)
      .slice(0, 100)
      .map((participant, index) => ({
        rank: index + 1,
        userId: participant.userId,
        username: this.traderProfiles.get(participant.userId)?.username || 'Unknown',
        score: participant.currentScore
      }))

    await this.db.getDatabase()
      .collection('trading_challenges')
      .updateOne({ _id: challenge.id }, { $set: challenge })

    this.emit('challengeCompleted', challenge)
  }

  private async updateChallengeScores(challenge: TradingChallenge): Promise<void> {
    // Update participant scores based on challenge type
    for (const participant of challenge.participants) {
      if (participant.status !== 'active') continue

      const user = this.traderProfiles.get(participant.userId)
      if (!user) continue

      let score = 0
      switch (challenge.type) {
        case 'profit':
          score = user.stats.dailyProfit || 0
          break
        case 'win_rate':
          score = user.winRate * 100
          break
        case 'volume':
          score = user.stats.totalVolume || 0
          break
        default:
          score = Math.random() * 100 // Placeholder
      }

      participant.currentScore = score
      participant.progress = {
        currentScore: score,
        targetScore: challenge.rules.targetScore || 100
      }
    }

    await this.db.getDatabase()
      .collection('trading_challenges')
      .updateOne({ _id: challenge.id }, { $set: challenge })
  }

  private async updateCopiersLeaderboard(): Promise<void> {
    const copierStats = new Map<string, any>()

    // Calculate statistics for copiers
    for (const relationship of this.copyRelationships.values()) {
      const existing = copierStats.get(relationship.copierId) || {
        totalProfit: 0,
        tradesCopied: 0,
        winRate: 0
      }

      existing.totalProfit += relationship.performance.totalProfit
      existing.tradesCopied += relationship.performance.tradesCopied

      copierStats.set(relationship.copierId, existing)
    }

    const topCopiers = Array.from(copierStats.entries())
      .map(([userId, stats]) => ({
        userId,
        username: this.traderProfiles.get(userId)?.username || 'Unknown',
        totalProfit: stats.totalProfit,
        tradesCopied: stats.tradesCopied,
        winRate: stats.winRate
      }))
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 50)

    await this.db.getDatabase()
      .collection('leaderboards')
      .updateOne(
        { type: 'top_copiers' },
        {
          $set: {
            type: 'top_copiers',
            copiers: topCopiers.map((copier, index) => ({
              rank: index + 1,
              ...copier
            })),
            updatedAt: new Date()
          }
        },
        { upsert: true }
      )
  }

  private async updateChallengeLeaderboard(): Promise<void> {
    const activeChallenges = Array.from(this.tradingChallenges.values())
      .filter(challenge => challenge.status === 'active')

    for (const challenge of activeChallenges) {
      await this.db.getDatabase()
        .collection('leaderboards')
        .updateOne(
          { type: 'challenge', challengeId: challenge.id },
          {
            $set: {
              type: 'challenge',
              challengeId: challenge.id,
              title: challenge.title,
              leaderboard: challenge.leaderboard.slice(0, 50),
              updatedAt: new Date()
            }
          },
          { upsert: true }
        )
    }
  }

  // Public API Methods
  async getTraderProfile(userId: string): Promise<TraderProfile | null> {
    return this.traderProfiles.get(userId) || null
  }

  async getTopTraders(limit: number = 50): Promise<TraderProfile[]> {
    return Array.from(this.traderProfiles.values())
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, limit)
  }

  async getFollowers(traderId: string): Promise<TraderProfile[]> {
    const relationship = Array.from(this.copyRelationships.values())
      .find(rel => rel.traderId === traderId)

    if (!relationship) return []

    const followerIds = Array.from(this.copyRelationships.values())
      .filter(rel => rel.traderId === traderId)
      .map(rel => rel.copierId)

    return followerIds
      .map(userId => this.traderProfiles.get(userId))
      .filter(profile => profile !== undefined) as TraderProfile[]
  }

  async getSocialFeed(userId: string, filters: {
    type?: string
    limit?: number
    offset?: number
  } = {}): Promise<SocialPost[]> {
    let posts = Array.from(this.socialPosts.values())

    // Filter by visibility
    const userProfile = this.traderProfiles.get(userId)
    const followingIds = userProfile ?
      Array.from(this.copyRelationships.values())
        .filter(rel => rel.copierId === userId)
        .map(rel => rel.traderId) : []

    posts = posts.filter(post => {
      if (post.visibility === 'public') return true
      if (post.visibility === 'followers' && followingIds.includes(post.userId)) return true
      if (post.visibility === 'private' && post.userId === userId) return true
      return false
    })

    // Apply other filters
    if (filters.type) {
      posts = posts.filter(post => post.type === filters.type)
    }

    // Sort by creation date
    posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    // Apply pagination
    const offset = filters.offset || 0
    const limit = filters.limit || 20

    return posts.slice(offset, offset + limit)
  }

  async getLeaderboard(type: 'top_traders' | 'top_copiers'): Promise<any[]> {
    const leaderboard = await this.db.getDatabase()
      .collection('leaderboards')
      .findOne({ type })

    return leaderboard ? (type === 'top_traders' ? leaderboard.traders : leaderboard.copiers) : []
  }

  async getActiveChallenges(): Promise<TradingChallenge[]> {
    return Array.from(this.tradingChallenges.values())
      .filter(challenge => challenge.status === 'active' || challenge.status === 'upcoming')
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
  }
}

export default CopyTradingPlatform