import { Schema, model, Document } from 'mongoose'
import { z } from 'zod'

// Zod schemas for validation
export const UserSchemaZod = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  email: z.string().email().optional(),
  username: z.string().min(3).max(30),
  profile: z.object({
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    twitter: z.string().optional(),
    discord: z.string().optional(),
    telegram: z.string().optional(),
  }),
  kyc: z.object({
    status: z.enum(['pending', 'verified', 'rejected', 'expired']),
    level: z.enum(['basic', 'advanced', 'enterprise']),
    documents: z.array(z.object({
      type: z.enum(['passport', 'id_card', 'driving_license', 'proof_of_address']),
      url: z.string().url(),
      hash: z.string(),
      verifiedAt: z.date().optional(),
    })),
    verifiedAt: z.date().optional(),
    expiresAt: z.date().optional(),
  }),
  security: z.object({
    twoFactorEnabled: z.boolean(),
    twoFactorSecret: z.string().optional(),
    biometricEnabled: z.boolean(),
    trustedDevices: z.array(z.object({
      deviceId: z.string(),
      name: z.string(),
      addedAt: z.date(),
      lastUsedAt: z.date(),
    })),
    loginAttempts: z.number(),
    lockedUntil: z.date().optional(),
  }),
  subscription: z.object({
    tier: z.enum(['free', 'pro', 'enterprise']),
    features: z.array(z.string()),
    expiresAt: z.date().optional(),
    autoRenew: z.boolean(),
  }),
  preferences: z.object({
    theme: z.enum(['light', 'dark', 'auto']),
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
      sms: z.boolean(),
    }),
    privacy: z.object({
      showBalance: z.boolean(),
      showTransactions: z.boolean(),
      allowAnalytics: z.boolean(),
    }),
  }),
  stats: z.object({
    totalProfit: z.number(),
    totalVolume: z.number(),
    successfulTrades: z.number(),
    successRate: z.number(),
    riskScore: z.number(),
    reputationScore: z.number(),
    joinDate: z.date(),
    lastActiveAt: z.date(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export interface IUser extends Document {
  walletAddress: string
  email?: string
  username: string
  profile: {
    avatar?: string
    bio?: string
    twitter?: string
    discord?: string
    telegram?: string
  }
  kyc: {
    status: 'pending' | 'verified' | 'rejected' | 'expired'
    level: 'basic' | 'advanced' | 'enterprise'
    documents: Array<{
      type: 'passport' | 'id_card' | 'driving_license' | 'proof_of_address'
      url: string
      hash: string
      verifiedAt?: Date
    }>
    verifiedAt?: Date
    expiresAt?: Date
  }
  security: {
    twoFactorEnabled: boolean
    twoFactorSecret?: string
    biometricEnabled: boolean
    trustedDevices: Array<{
      deviceId: string
      name: string
      addedAt: Date
      lastUsedAt: Date
    }>
    loginAttempts: number
    lockedUntil?: Date
  }
  subscription: {
    tier: 'free' | 'pro' | 'enterprise'
    features: string[]
    expiresAt?: Date
    autoRenew: boolean
  }
  preferences: {
    theme: 'light' | 'dark' | 'auto'
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
    privacy: {
      showBalance: boolean
      showTransactions: boolean
      allowAnalytics: boolean
    }
  }
  stats: {
    totalProfit: number
    totalVolume: number
    successfulTrades: number
    successRate: number
    riskScore: number
    reputationScore: number
    joinDate: Date
    lastActiveAt: Date
  }
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>({
  walletAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
    validate: {
      validator: function(v: string) {
        return /^0x[a-fA-F0-9]{40}$/.test(v)
      },
      message: 'Invalid wallet address format'
    }
  },
  email: {
    type: String,
    sparse: true,
    index: true,
    validate: {
      validator: function(v: string) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
      },
      message: 'Invalid email format'
    }
  },
  username: {
    type: String,
    required: true,
    unique: true,
    index: true,
    minlength: 3,
    maxlength: 30,
    validate: {
      validator: function(v: string) {
        return /^[a-zA-Z0-9_]+$/.test(v)
      },
      message: 'Username can only contain letters, numbers, and underscores'
    }
  },
  profile: {
    avatar: String,
    bio: { type: String, maxlength: 500 },
    twitter: String,
    discord: String,
    telegram: String,
  },
  kyc: {
    status: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'expired'],
      default: 'pending'
    },
    level: {
      type: String,
      enum: ['basic', 'advanced', 'enterprise'],
      default: 'basic'
    },
    documents: [{
      type: {
        type: String,
        enum: ['passport', 'id_card', 'driving_license', 'proof_of_address'],
        required: true
      },
      url: {
        type: String,
        required: true
      },
      hash: {
        type: String,
        required: true
      },
      verifiedAt: Date
    }],
    verifiedAt: Date,
    expiresAt: Date,
  },
  security: {
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorSecret: String,
    biometricEnabled: {
      type: Boolean,
      default: false
    },
    trustedDevices: [{
      deviceId: { type: String, required: true },
      name: { type: String, required: true },
      addedAt: { type: Date, default: Date.now },
      lastUsedAt: { type: Date, default: Date.now }
    }],
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: Date
  },
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    features: [String],
    expiresAt: Date,
    autoRenew: { type: Boolean, default: false }
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    },
    privacy: {
      showBalance: { type: Boolean, default: true },
      showTransactions: { type: Boolean, default: false },
      allowAnalytics: { type: Boolean, default: true }
    }
  },
  stats: {
    totalProfit: { type: Number, default: 0 },
    totalVolume: { type: Number, default: 0 },
    successfulTrades: { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    riskScore: { type: Number, default: 0 },
    reputationScore: { type: Number, default: 50 },
    joinDate: { type: Date, default: Date.now },
    lastActiveAt: { type: Date, default: Date.now }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Compound indexes for performance
UserSchema.index({ walletAddress: 1, 'kyc.status': 1 })
UserSchema.index({ username: 1, 'subscription.tier': 1 })
UserSchema.index({ 'stats.joinDate': -1 })
UserSchema.index({ 'stats.reputationScore': -1 })
UserSchema.index({ 'subscription.tier': 1, 'stats.totalProfit': -1 })

// Virtual fields
UserSchema.virtual('isVerified').get(function() {
  return this.kyc.status === 'verified' && this.kyc.expiresAt && this.kyc.expiresAt > new Date()
})

UserSchema.virtual('isPremium').get(function() {
  return this.subscription.tier !== 'free' &&
         (!this.subscription.expiresAt || this.subscription.expiresAt > new Date())
})

UserSchema.virtual('trustLevel').get(function() {
  const baseScore = this.stats.reputationScore
  const kycBonus = this.kyc.status === 'verified' ? 20 : 0
  const volumeBonus = Math.min(this.stats.totalVolume / 1000000, 30)
  const tradeBonus = Math.min(this.stats.successfulTrades / 100, 25)

  return Math.min(baseScore + kycBonus + volumeBonus + tradeBonus, 100)
})

// Pre-save middleware
UserSchema.pre('save', function(next) {
  if (this.isModified('stats')) {
    this.stats.lastActiveAt = new Date()
  }
  next()
})

export const User = model<IUser>('User', UserSchema)

// Trading Schema
export interface ITradingPosition extends Document {
  user: Schema.Types.ObjectId
  symbol: string
  type: 'long' | 'short' | 'neutral'
  strategy: 'spot' | 'futures' | 'options' | 'defi'
  entryPrice: number
  currentPrice: number
  size: number
  leverage: number
  margin: number
  pnl: number
  pnlPercentage: number
  fees: number
  fundingRate?: number
  liquidationPrice?: number
  stopLoss?: number
  takeProfit?: number
  status: 'active' | 'closed' | 'liquidated' | 'partial'
  network: 'ethereum' | 'polygon' | 'bsc' | 'arbitrum' | 'solana'
  protocol: string
  poolAddress?: string
  tokenId?: string
  metadata: Record<string, any>
  tags: string[]
  isCopyTrading: boolean
  copiedFrom?: Schema.Types.ObjectId
  copiedBy: Schema.Types.ObjectId[]
  aiGenerated: boolean
  aiConfidence: number
  riskLevel: 'low' | 'medium' | 'high' | 'extreme'
  openedAt: Date
  closedAt?: Date
  lastUpdated: Date
}

const TradingPositionSchema = new Schema<ITradingPosition>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  symbol: { type: String, required: true, index: true },
  type: { type: String, enum: ['long', 'short', 'neutral'], required: true },
  strategy: { type: String, enum: ['spot', 'futures', 'options', 'defi'], required: true },
  entryPrice: { type: Number, required: true },
  currentPrice: { type: Number, required: true },
  size: { type: Number, required: true },
  leverage: { type: Number, default: 1, min: 1, max: 100 },
  margin: { type: Number, required: true },
  pnl: { type: Number, default: 0 },
  pnlPercentage: { type: Number, default: 0 },
  fees: { type: Number, default: 0 },
  fundingRate: Number,
  liquidationPrice: Number,
  stopLoss: Number,
  takeProfit: Number,
  status: {
    type: String,
    enum: ['active', 'closed', 'liquidated', 'partial'],
    default: 'active',
    index: true
  },
  network: {
    type: String,
    enum: ['ethereum', 'polygon', 'bsc', 'arbitrum', 'solana'],
    required: true,
    index: true
  },
  protocol: { type: String, required: true },
  poolAddress: String,
  tokenId: String,
  metadata: { type: Schema.Types.Mixed, default: {} },
  tags: [String],
  isCopyTrading: { type: Boolean, default: false },
  copiedFrom: { type: Schema.Types.ObjectId, ref: 'User' },
  copiedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  aiGenerated: { type: Boolean, default: false },
  aiConfidence: { type: Number, min: 0, max: 100 },
  riskLevel: { type: String, enum: ['low', 'medium', 'high', 'extreme'], required: true },
  openedAt: { type: Date, default: Date.now, index: true },
  closedAt: Date,
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for trading performance
TradingPositionSchema.index({ user: 1, status: 1, openedAt: -1 })
TradingPositionSchema.index({ symbol: 1, strategy: 1, network: 1 })
TradingPositionSchema.index({ 'aiGenerated': 1, 'aiConfidence': -1 })
TradingPositionSchema.index({ isCopyTrading: 1, copiedFrom: 1 })
TradingPositionSchema.index({ riskLevel: 1, leverage: -1 })

export const TradingPosition = model<ITradingPosition>('TradingPosition', TradingPositionSchema)

// Liquidity Pool Schema
export interface ILiquidityPool extends Document {
  name: string
  symbol: string
  tokens: Array<{
    address: string
    symbol: string
    decimals: number
    weight: number
  }>
  protocol: string
  network: string
  fee: number
  totalLiquidity: number
  volume24h: number
  apr: number
  apy: number
  tvl: number
  isActive: boolean
  isStable: boolean
  metadata: {
    description?: string
    category?: string
    tags?: string[]
    riskLevel?: 'low' | 'medium' | 'high'
  }
  positions: Array<{
    user: Schema.Types.ObjectId
    amount: number
    shares: number
    entryTimestamp: Date
    rewards: number
    claimedRewards: number
  }>
  rewards: Array<{
    token: string
    symbol: string
    rate: number
    period: number
  }>
  createdAt: Date
  updatedAt: Date
}

const LiquidityPoolSchema = new Schema<ILiquidityPool>({
  name: { type: String, required: true },
  symbol: { type: String, required: true, unique: true },
  tokens: [{
    address: { type: String, required: true },
    symbol: { type: String, required: true },
    decimals: { type: Number, required: true },
    weight: { type: Number, required: true, min: 0, max: 1 }
  }],
  protocol: { type: String, required: true, index: true },
  network: { type: String, required: true, index: true },
  fee: { type: Number, required: true, min: 0, max: 1 },
  totalLiquidity: { type: Number, default: 0 },
  volume24h: { type: Number, default: 0 },
  apr: { type: Number, default: 0 },
  apy: { type: Number, default: 0 },
  tvl: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  isStable: { type: Boolean, default: false },
  metadata: {
    description: String,
    category: String,
    tags: [String],
    riskLevel: { type: String, enum: ['low', 'medium', 'high'] }
  },
  positions: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    shares: { type: Number, required: true },
    entryTimestamp: { type: Date, default: Date.now },
    rewards: { type: Number, default: 0 },
    claimedRewards: { type: Number, default: 0 }
  }],
  rewards: [{
    token: { type: String, required: true },
    symbol: { type: String, required: true },
    rate: { type: Number, required: true },
    period: { type: Number, required: true }
  }]
}, {
  timestamps: true
})

LiquidityPoolSchema.index({ protocol: 1, network: 1 })
LiquidityPoolSchema.index({ 'tokens.address': 1 })
LiquidityPoolSchema.index({ isActive: 1, tvl: -1 })
LiquidityPoolSchema.index({ apy: -1 })

export const LiquidityPool = model<ILiquidityPool>('LiquidityPool', LiquidityPoolSchema)

// NFT Schema
export interface INFT extends Document {
  name: string
  description: string
  image: string
  animationUrl?: string
  contractAddress: string
  tokenId: string
  network: string
  collection: {
    name: string
    address: string
    verified: boolean
  }
  attributes: Array<{
    trait_type: string
    value: string | number
    rarity: number
  }>
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'
  floorPrice: number
  currentPrice?: number
  owner: Schema.Types.ObjectId
  creator: Schema.Types.ObjectId
  royalties: number
  isListed: boolean
  listing?: {
    price: number
    currency: string
    startTime: Date
    endTime?: Date
    auction: boolean
    highestBid?: number
    bidder?: Schema.Types.ObjectId
  }
  history: Array<{
    event: 'minted' | 'listed' | 'sold' | 'transferred' | 'delisted'
    from?: Schema.Types.ObjectId
    to?: Schema.Types.ObjectId
    price?: number
    currency?: string
    timestamp: Date
    transactionHash: string
  }>
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

const NFTSchema = new Schema<INFT>({
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  animationUrl: String,
  contractAddress: { type: String, required: true, index: true },
  tokenId: { type: String, required: true },
  network: { type: String, required: true, index: true },
  collection: {
    name: { type: String, required: true },
    address: { type: String, required: true },
    verified: { type: Boolean, default: false }
  },
  attributes: [{
    trait_type: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    rarity: { type: Number, min: 0, max: 100 }
  }],
  rarity: {
    type: String,
    enum: ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'],
    required: true
  },
  floorPrice: { type: Number, default: 0 },
  currentPrice: Number,
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  creator: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  royalties: { type: Number, min: 0, max: 15, default: 0 },
  isListed: { type: Boolean, default: false },
  listing: {
    price: Number,
    currency: String,
    startTime: Date,
    endTime: Date,
    auction: { type: Boolean, default: false },
    highestBid: Number,
    bidder: { type: Schema.Types.ObjectId, ref: 'User' }
  },
  history: [{
    event: {
      type: String,
      enum: ['minted', 'listed', 'sold', 'transferred', 'delisted'],
      required: true
    },
    from: { type: Schema.Types.ObjectId, ref: 'User' },
    to: { type: Schema.Types.ObjectId, ref: 'User' },
    price: Number,
    currency: String,
    timestamp: { type: Date, default: Date.now },
    transactionHash: { type: String, required: true }
  }],
  metadata: { type: Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
})

NFTSchema.index({ contractAddress: 1, tokenId: 1 })
NFTSchema.index({ owner: 1, isListed: 1 })
NFTSchema.index({ 'collection.address': 1 })
NFTSchema.index({ rarity: 1, floorPrice: -1 })

export const NFT = model<INFT>('NFT', NFTSchema)