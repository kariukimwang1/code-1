/**
 * GraphQL Schema Definition
 * Efficient data fetching API for the multi-billion dollar crypto platform
 */

import { gql } from 'apollo-server-express';
import { GraphQLScalarType } from 'graphql';
import { Kind } from 'graphql/language';

// Custom Scalars
const DateTime = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date time custom scalar type',
  serialize(value: any) {
    return value.toISOString();
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const Currency = new GraphQLScalarType({
  name: 'Currency',
  description: 'Currency custom scalar type',
  serialize(value: number) {
    return value.toFixed(2);
  },
  parseValue(value: string | number) {
    return parseFloat(value.toString());
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT || ast.kind === Kind.FLOAT) {
      return parseFloat(ast.value);
    }
    return null;
  },
});

// Core Types
const User = gql`
  type User {
    id: ID!
    email: String!
    username: String!
    firstName: String!
    lastName: String!
    country: String!
    timezone: String!
    language: String!
    avatar: String
    bio: String
    reputation: Float!
    level: Int!
    xp: Int!
    createdAt: DateTime!
    lastLogin: DateTime!
    status: UserStatus!
    subscription: Subscription
    profile: SkillProfile!
    wallet: Wallet!
    achievements: [Achievement!]!
    statistics: UserStatistics!
  }
`;

const Wallet = gql`
  type Wallet {
    id: ID!
    userId: ID!
    address: String!
    network: String!
    balance: Currency!
    tokens: TokenBalances!
    transactions: [Transaction!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

const TokenBalances = gql`
  type TokenBalances {
    workToken: TokenBalance!
    governanceToken: TokenBalance!
    stablecoins: [StablecoinBalance!]!
    otherTokens: [TokenBalance!]!
  }
`;

const TokenBalance = gql`
  type TokenBalance {
    tokenAddress: String!
    symbol: String!
    name: String!
    decimals: Int!
    balance: String!
    value: Currency!
  }
`;

const StablecoinBalance = gql`
  type StablecoinBalance {
    tokenAddress: String!
    symbol: String!
    name: String!
    decimals: Int!
    balance: String!
  }
`;

const Subscription = gql`
  type Subscription {
    id: ID!
    userId: ID!
    planId: ID!
    status: SubscriptionStatus!
    billing: BillingInfo!
    usage: UsageStats!
    features: SubscriptionFeatures!
    renewsAt: DateTime!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

const BillingInfo = gql`
  type BillingInfo {
    nextBillingDate: DateTime!
    amount: Currency!
    currency: String!
    paymentMethod: String!
    billingCycle: BillingCycle!
    autoRenew: Boolean!
    lastPayment: Payment!
  }
`;

const Payment = gql`
  type Payment {
    id: ID!
    userId: ID!
    amount: Currency!
    currency: String!
    method: String!
    status: PaymentStatus!
    transactionHash: String!
    createdAt: DateTime!
    processedAt: DateTime!
  }
`;

const UsageStats = gql`
  type UsageStats {
    tasksCompleted: Int!
    tasksRemaining: Int!
    earningsMultiplier: Float!
    bonusesUsed: Int!
    benefitsRedeemed: [String!]!
  }
`;

const SubscriptionFeatures = gql`
  type SubscriptionFeatures {
    taskGuarantee: TaskGuarantee!
    earnings: EarningsFeatures!
    support: SupportFeatures!
    benefits: [Benefit!]!
  }
`;

const TaskGuarantee = gql`
  type TaskGuarantee {
    minimumTasks: Int!
    maximumTasks: Int!
    premiumTasks: Int!
    priorityAccess: Boolean!
  }
`;

const EarningsFeatures = gql`
  type EarningsFeatures {
    baseMultiplier: Float!
    bonusMultiplier: Float!
    cashbackRate: Float!
    referralBonus: Currency!
  }
`;

const SupportFeatures = gql`
  type SupportFeatures {
    responseTime: Int!
    dedicatedSupport: Boolean!
    prioritySupport: Boolean!
  }
`;

const Benefit = gql`
  type Benefit {
    id: ID!
    name: String!
    description: String!
    value: String!
    category: BenefitCategory!
    active: Boolean!
  }
`;

const SkillProfile = gql`
  type SkillProfile {
    id: ID!
    userId: ID!
    category: SkillCategory!
    experience: Experience!
    expertise: Expertise!
    availability: Availability!
    pricing: Pricing!
    verification: Verification!
    metrics: Metrics!
    portfolio: [PortfolioItem!]!
    certifications: [Certification!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

const SkillCategory = gql`
  type SkillCategory {
    primary: String!
    secondary: [String!]!
    specializations: [String!]!
  }
`;

const Experience = gql`
  type Experience {
    years: Int!
    projects: Int!
    hours: Int!
    reputation: Float!
  }
`;

const Expertise = gql`
  type Expertise {
    level: ExpertiseLevel!
    certifications: [Certification!]!
    portfolio: [PortfolioItem!]!
  }
`;

const PortfolioItem = gql`
  type PortfolioItem {
    id: ID!
    title: String!
    description: String!
    completedAt: DateTime!
    clientRating: Float!
    earnings: Currency!
    tools: [String!]!
    files: [String!]!
  }
`;

const Certification = gql`
  type Certification {
    id: ID!
    name: String!
    issuer: String!
    date: DateTime!
    credentialId: String
    verified: Boolean!
  }
`;

const Availability = gql`
  type Availability {
    hoursPerWeek: Int!
    timezone: String!
    responseTime: Int!
    preferredProjects: [String!]!
    schedule: [AvailabilitySchedule!]!
  }
`;

const AvailabilitySchedule = gql`
  type AvailabilitySchedule {
    dayOfWeek: Int!
    startTime: String!
    endTime: String!
  }
`;

const Pricing = gql`
  type Pricing {
    hourlyRate: Currency!
    projectRates: [ProjectRate!]!
    currency: String!
    negotiable: Boolean!
    minimumProject: Currency!
  }
`;

const ProjectRate = gql`
  type ProjectRate {
    projectType: String!
    minRate: Currency!
    maxRate: Currency!
    avgTime: Int!
  }
`;

const Verification = gql`
  type Verification {
    identityVerified: Boolean!
    skillVerified: Boolean!
    backgroundCheck: Boolean!
    verificationDate: DateTime!
    verificationLevel: VerificationLevel!
  }
`;

const Metrics = gql`
  type Metrics {
    completedJobs: Int!
    totalEarnings: Currency!
    averageRating: Float!
    responseRate: Float!
    onTimeDelivery: Float!
    clientRepeatRate: Float!
  }
`;

const Achievement = gql`
  type Achievement {
    id: ID!
    name: String!
    description: String!
    icon: String!
    level: Int!
    category: String!
    rarity: Rarity!
    unlockedAt: DateTime!
    progress: Float!
  }
`;

const UserStatistics = gql`
  type UserStatistics {
    totalEarnings: Currency!
    completedTasks: Int!
    totalProjects: Int!
    averageRating: Float!
    successRate: Float!
    activeContracts: Int!
    skills: [SkillStatistics!]!
  }
`;

const SkillStatistics = gql`
  type SkillStatistics {
    category: String!
    earnings: Currency!
    projects: Int!
    rating: Float!
    experience: Int!
  }
`;

const Task = gql`
  type Task {
    id: ID!
    title: String!
    description: String!
    category: TaskCategory!
    type: TaskType!
    difficulty: TaskDifficulty!
    estimatedTime: Int!
    reward: Currency!
    currency: String!
    requirements: TaskRequirements!
    deliverables: [Deliverable!]!
    client: Client!
    status: TaskStatus!
    assignedTo: User
    applicants: [Application!]!
    createdAt: DateTime!
    updatedAt: DateTime!
    deadline: DateTime!
  }
`;

const Client = gql`
  type Client {
    id: ID!
    name: String!
    email: String!
    company: String!
    website: String!
    logo: String!
    description: String!
    location: String!
    rating: Float!
    totalSpent: Currency!
    projects: Int!
    verification: ClientVerification!
    createdAt: DateTime!
  }
`;

const ClientVerification = gql`
  type ClientVerification {
    verified: Boolean!
    businessLicense: Boolean!
    kycCompleted: Boolean!
    verificationDate: DateTime!
  }
`;

const Application = gql`
  type Application {
    id: ID!
    taskId: ID!
    userId: ID!
    profileId: ID!
    proposedRate: Currency!
    coverLetter: String!
    estimatedTimeline: String!
    attachedPortfolio: [String!]!
    status: ApplicationStatus!
    submittedAt: DateTime!
    reviewedAt: DateTime!
  }
`;

const Campaign = gql`
  type Campaign {
    id: ID!
    advertiserId: ID!
    brandName: String!
    campaignType: CampaignType!
    title: String!
    description: String!
    targetAudience: TargetAudience!
    budget: Budget!
    bidding: Bidding!
    status: CampaignStatus!
    performance: CampaignPerformance!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
`;

const TargetAudience = gql`
  type TargetAudience {
    demographics: [String!]!
    geolocation: [String!]!
    deviceTypes: [String!]!
    skillLevels: [String!]!
    reputationMin: Float!
  }
`;

const Budget = gql`
  type Budget {
    total: Currency!
    currency: String!
    perTaskReward: Currency!
    maxCompletions: Int!
    platformFee: Float!
  }
`;

const Bidding = gql`
  type Bidding {
    bidType: BidType!
    currentBid: Currency!
    minimumBid: Currency!
    auctionEnds: DateTime!
    winningBidder: String!
  }
`;

const CampaignPerformance = gql`
  type CampaignPerformance {
    impressions: Int!
    clicks: Int!
    completions: Int!
    conversionRate: Float!
    costPerCompletion: Currency!
    qualityScore: Float!
  }
`;

const Booster = gql`
  type Booster {
    id: ID!
    type: BoosterType!
    name: String!
    description: String!
    effects: BoosterEffects!
    pricing: BoosterPricing!
    availability: BoosterAvailability!
    visual: BoosterVisual!
    isActive: Boolean!
    createdAt: DateTime!
  }
`;

const BoosterEffects = gql`
  type BoosterEffects {
    primary: BoosterEffect!
    secondary: [BoosterEffect!]!
  }
`;

const BoosterEffect = gql`
  type BoosterEffect {
    type: String!
    value: Float!
    duration: Int!
    description: String!
  }
`;

const BoosterPricing = gql`
  type BoosterPricing {
    basePrice: Currency!
    currency: String!
    dynamicPricing: Boolean!
    demandMultiplier: Float!
    volumeDiscounts: [VolumeDiscount!]!
  }
`;

const VolumeDiscount = gql`
  type VolumeDiscount {
    quantity: Int!
    discount: Float!
  }
`;

const BoosterAvailability = gql`
  type BoosterAvailability {
    maxSupply: Int!
    currentSupply: Int!
    replenishRate: Int!
    cooldownPeriod: Int!
    geoRestrictions: [String!]!
    userTierRestrictions: [String!]!
  }
`;

const BoosterVisual = gql`
  type BoosterVisual {
    icon: String!
    color: String!
    rarity: Rarity!
    sparkleEffect: Boolean!
  }
`;

// Enums
enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
  VERIFIED
  PENDING
}

enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAUSED
  CANCELLED
  EXPIRED
  SUSPENDED
}

enum BillingCycle {
  MONTHLY
  QUARTERLY
  ANNUAL
}

enum PaymentStatus {
  PENDING
  COMPLETED
  FAILED
  REFUNDED
}

enum BenefitCategory {
  EARNING
  ACCESS
  SUPPORT
  TOOLS
}

enum ExpertiseLevel {
  BEGINNER
  INTERMEDIATE
  ADVANCED
  EXPERT
  MASTER
}

enum VerificationLevel {
  BASIC
  STANDARD
  PREMIUM
  ENTERPRISE
}

enum Rarity {
  COMMON
  UNCOMMON
  RARE
  EPIC
  LEGENDARY
}

enum TaskCategory {
  DATA_ANNOTATION
  CONTENT_MODERATION
  TRANSLATION
  USER_TESTING
  TRANSCRIPTION
  RESEARCH
  MARKET_RESEARCH
  QUALITY_ASSURANCE
}

enum TaskType {
  FIXED_PRICE
  HOURLY
  MILESTONE
  RETAINER
  SUBSCRIPTION
  PERFORMANCE_BASED
}

enum TaskDifficulty {
  EASY
  MEDIUM
  HARD
  EXPERT
}

enum TaskRequirements {
  SKILL_LEVEL
  MIN_EXPERIENCE
  REQUIRED_SKILLS
  CERTIFICATIONS
  TOOLS
  LANGUAGES
  TIMEZONE
  AVAILABILITY
}

enum TaskStatus {
  DRAFT
  PUBLISHED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  PAUSED
}

enum ApplicationStatus {
  SUBMITTED
  VIEWED
  SHORTLISTED
  REJECTED
  HIRED
}

enum CampaignType {
  MICRO_TASKS
  SURVEYS
  APP_INSTALLS
  DATA_COLLECTION
  USER_TESTING
  MARKET_RESEARCH
  PROMOTION
}

enum CampaignStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  CANCELLED
}

enum BidType {
  FIXED
  AUCTION
  CPM
  CPC
  CPA
}

enum BoosterType {
  MINING_SPEED
  TASK_REWARDS
  REPUTATION_BOOST
  VISIBILITY_BOOST
  PRIORITY_ACCESS
  SPECIAL_FEATURES
  LIMITED_EDITION
  MERCHANT_PROMO
}

// Input Types
const UserInput = gql`
  input UserInput {
    email: String!
    username: String!
    firstName: String!
    lastName: String!
    password: String!
    country: String!
    timezone: String!
    language: String!
  }
`;

const SkillProfileInput = gql`
  input SkillProfileInput {
    category: SkillCategoryInput!
    experience: ExperienceInput!
    expertise: ExpertiseInput!
    availability: AvailabilityInput!
    pricing: PricingInput!
  }
`;

const SkillCategoryInput = gql`
  input SkillCategoryInput {
    primary: String!
    secondary: [String!]!
    specializations: [String!]!
  }
`;

const ExperienceInput = gql`
  input ExperienceInput {
    years: Int!
    projects: Int!
    hours: Int!
    reputation: Float!
  }
`;

const ExpertiseInput = gql`
  input ExpertiseInput {
    level: ExpertiseLevel!
    certifications: [CertificationInput!]!
    portfolio: [PortfolioItemInput!]!
  }
`;

const CertificationInput = gql`
  input CertificationInput {
    name: String!
    issuer: String!
    date: String!
    credentialId: String
    verified: Boolean!
  }
`;

const PortfolioItemInput = gql`
  input PortfolioItemInput {
    title: String!
    description: String!
    files: [String!]!
  }
`;

const AvailabilityInput = gql`
  input AvailabilityInput {
    hoursPerWeek: Int!
    timezone: String!
    responseTime: Int!
    preferredProjects: [String!]!
    schedule: [AvailabilityScheduleInput!]!
  }
`;

const AvailabilityScheduleInput = gql`
  input AvailabilityScheduleInput {
    dayOfWeek: Int!
    startTime: String!
    endTime: String!
  }
`;

const PricingInput = gql`
  input PricingInput {
    hourlyRate: Float!
    projectRates: [ProjectRateInput!]!
    currency: String!
    negotiable: Boolean!
    minimumProject: Float!
  }
`;

const ProjectRateInput = gql`
  input ProjectRateInput {
    type: String!
    minRate: Float!
    maxRate: Float!
    avgTime: Int!
  }
`;

const TaskInput = gql`
  input TaskInput {
    title: String!
    description: String!
    category: TaskCategory!
    type: TaskType!
    difficulty: TaskDifficulty!
    estimatedTime: Int!
    reward: Float!
    currency: String!
    requirements: TaskRequirementsInput!
    deliverables: [String!]!
    deadline: String!
  }
`;

const TaskRequirementsInput = gql`
  input TaskRequirementsInput {
    skillLevel: TaskDifficulty!
    minExperience: Int!
    requiredSkills: [String!]!
    certifications: [String!]!
    tools: [String!]!
    languages: [String!]!
    timezone: String
    availability: String!
  }
`;

const CampaignInput = gql`
  input CampaignInput {
    brandName: String!
    campaignType: CampaignType!
    title: String!
    description: String!
    targetAudience: TargetAudienceInput!
    budget: BudgetInput!
    bidding: BiddingInput!
    startDate: String!
    endDate: String!
  }
`;

const TargetAudienceInput = gql`
  input TargetAudienceInput {
    demographics: [String!]!
    geolocation: [String!]!
    deviceTypes: [String!]!
    skillLevels: [String!]!
    reputationMin: Float!
  }
`;

const BudgetInput = gql`
  input BudgetInput {
    total: Float!
    currency: String!
    perTaskReward: Float!
    maxCompletions: Int!
    platformFee: Float!
  }
`;

const BiddingInput = gql`
  input BiddingInput {
    bidType: BidType!
    minimumBid: Float!
    auctionDuration: Int!
  }
`;

const BoosterPurchaseInput = gql`
  input BoosterPurchaseInput {
    boosterId: ID!
    quantity: Int!
    paymentMethod: String!
    autoActivate: Boolean!
  }
`;

// Query Type
const Query = gql`
  type Query {
    # User Queries
    user(id: ID!): User
    users(filter: UserFilter!, pagination: Pagination!): UserConnection!
    currentUser: User
    userSearch(query: String!, limit: Int!): [User!]!

    # Profile Queries
    skillProfile(userId: ID!): SkillProfile
    skillProfiles(filter: SkillProfileFilter!, pagination: Pagination!): SkillProfileConnection!

    # Task Queries
    task(id: ID!): Task
    tasks(filter: TaskFilter!, pagination: Pagination!): TaskConnection!
    recommendedTasks(userId: ID!, limit: Int!): [Task!]!

    # Campaign Queries
    campaign(id: ID!): Campaign
    campaigns(filter: CampaignFilter!, pagination: Pagination!): CampaignConnection!

    # Booster Queries
    booster(id: ID!): Booster
    boosters(filter: BoosterFilter!, pagination: Pagination!): BoosterConnection!

    # Analytics Queries
    platformMetrics(timeframe: Timeframe!): PlatformMetrics!
    userMetrics(userId: ID!, timeframe: Timeframe!): UserMetrics!
    campaignMetrics(campaignId: ID!, timeframe: Timeframe!): CampaignMetrics!

    # Marketplace Queries
    marketplaceOverview: MarketplaceOverview!
    trendingCategories: [CategoryStats!]!
    topEarners(limit: Int!): [User!]!

    # Finance Queries
    wallet(userId: ID!): Wallet!
    transactions(userId: ID!, filter: TransactionFilter!, pagination: Pagination!): TransactionConnection!

    # Governance Queries
    governanceProposals(status: ProposalStatus!): [GovernanceProposal!]!
    votingHistory(userId: ID!, proposalId: ID!): [Vote!]!

    # Network Queries
    networkStatus: NetworkStatus!
    blockchainStats: BlockchainStats!
    tokenStats: TokenStats!
  }
`;

// Mutation Type
const Mutation = gql`
  # User Mutations
    createUser(input: UserInput!): User!
    updateUser(id: ID!, input: UserInput!): User!
    deleteUser(id: ID!): Boolean!

    # Profile Mutations
    createSkillProfile(input: SkillProfileInput!): SkillProfile!
    updateSkillProfile(id: ID!, input: SkillProfileInput!): SkillProfile!
    addPortfolioItem(userId: ID!, input: PortfolioItemInput!): PortfolioItem!

    # Task Mutations
    createTask(input: TaskInput!): Task!
    updateTask(id: ID!, input: TaskInput!): Task!
    deleteTask(id: ID!): Boolean!

    # Application Mutations
    applyForTask(taskId: ID!, input: ApplicationInput!): Application!
    updateApplication(id: ID!, status: ApplicationStatus!): Application!

    # Campaign Mutations
    createCampaign(input: CampaignInput!): Campaign!
    updateCampaign(id: ID!, input: CampaignInput!): Campaign!
    deleteCampaign(id: ID!): Boolean!

    # Booster Mutations
    purchaseBooster(input: BoosterPurchaseInput!): BoosterPurchase!
    activateBooster(purchaseId: ID!): Booster!

    # Transaction Mutations
    sendPayment(userId: ID!, amount: Float!, currency: String!, method: String!): Payment!

    # Governance Mutations
    createProposal(input: GovernanceProposalInput!): GovernanceProposal!
    vote(userId: ID!, proposalId: ID!, vote: VoteInput!): Vote!

    # Wallet Mutations
    createWallet(userId: ID!, network: String!): Wallet!
    transferToken(fromUserId: ID!, toUserId: ID!, amount: Float!, tokenType: String!): Boolean!
  }
`;

// Subscription Type
const Subscription = gql`
  type Subscription {
    # User Subscriptions
    userUpdated(userId: ID!): User!
    taskCreated: Task!
    taskUpdated: Task!
    taskCompleted: Task!
    campaignUpdated: Campaign!
    boosterPurchased: Booster!
    paymentCompleted: Payment!

    # Real-time Updates
    platformMetricsUpdated: PlatformMetrics!
    tokenPriceUpdated: TokenPrice!
    networkStatusChanged: NetworkStatus!

    # Notifications
    newNotification(userId: ID!): Notification!
    achievementUnlocked(userId: ID!, achievement: Achievement!)
  }
`;

// Union Types
const UserConnection = gql`
  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
  }
`;

const UserEdge = gql`
  type UserEdge {
    node: User!
    cursor: String!
  }
`;

const SkillProfileConnection = gql`
  type SkillProfileConnection {
    edges: [SkillProfileEdge!]!
    pageInfo: PageInfo!
  }
`;

const SkillProfileEdge = gql`
  type SkillProfileEdge {
    node: SkillProfile!
    cursor: String!
  }
`;

const TaskConnection = gql`
  type TaskConnection {
    edges: [TaskEdge!]!
    pageInfo: PageInfo!
  }
`;

const TaskEdge = gql`
  type TaskEdge {
    node: Task!
    cursor: String!
  }
`;

const CampaignConnection = gql`
  type CampaignConnection {
    edges: [CampaignEdge!]!
    pageInfo: PageInfo!
  }
`;

const CampaignEdge = gql`
  type CampaignEdge {
    node: Campaign!
    cursor: String!
  }
`;

const BoosterConnection = gql`
  type BoosterConnection {
    edges: [BoosterEdge!]!
    pageInfo: PageInfo!
  }
`;

const BoosterEdge = gql`
  type BoosterEdge {
    node: Booster!
    cursor: String!
  }
`;

const TransactionConnection = gql`
  type TransactionConnection {
    edges: [TransactionEdge!]!
    pageInfo: PageInfo!
  }
`;

const TransactionEdge = gql`
  type TransactionEdge {
    node: Transaction!
    cursor: String!
  }
`;

// Input Types for Filters
const UserFilter = gql`
  input UserFilter {
    status: UserStatus
    country: String
    reputation: FloatRange
    level: IntRange
    registrationDate: DateRange
    search: String
  }
`;

const SkillProfileFilter = gql`
  input SkillProfileFilter {
    category: String
    experienceLevel: ExpertiseLevel
    rating: FloatRange
    hourlyRate: FloatRange
    availability: String
    verified: Boolean
  }
`;

const TaskFilter = gql`
  input TaskFilter {
    category: TaskCategory
    type: TaskType
    difficulty: TaskDifficulty
    status: TaskStatus
    clientId: ID
    minReward: Float
    maxReward: Float
    deadline: DateRange
    search: String
  }
`;

const CampaignFilter = gql`
  input CampaignFilter {
    advertiserId: ID
    campaignType: CampaignType
    status: CampaignStatus
    budgetRange: FloatRange
    startDate: DateRange
    endDate: DateRange
    search: String
  }
`;

const BoosterFilter = gql`
  input BoosterFilter {
    type: BoosterType
    rarity: Rarity
    minPrice: Float
    maxPrice: Float
    active: Boolean
    search: String
  }
`;

const TransactionFilter = gql`
  input TransactionFilter {
    type: TransactionType
    status: PaymentStatus
    currency: String
    dateRange: DateRange
    minAmount: Float
    maxAmount: Float
  }
`;

const ProposalStatus = gql`
  enum ProposalStatus {
    PENDING
    ACTIVE
    EXECUTED
    DEFEATED
    EXPIRED
  }
`;

const GovernanceProposalInput = gql`
  input GovernanceProposalInput {
    title: String!
    description: String!
    targets: [String!]!
    values: [Float!]!
    calldatas: [String!]!
    startTime: String!
    endTime: String!
  }
`;

const VoteInput = gql`
  input VoteInput {
    support: Boolean!
    reason: String!
  }
`;

const ApplicationInput = gql`
  input ApplicationInput {
    proposedRate: Float!
    coverLetter: String!
    estimatedTimeline: String!
    attachedPortfolio: [String!]!
  }
`;

const Notification = gql`
  type Notification {
    id: ID!
    userId: ID!
    type: NotificationType!
    title: String!
    message: String!
    data: JSON
    read: Boolean!
    createdAt: DateTime!
  }
`;

const NotificationType = gql`
  enum NotificationType {
    INFO
    SUCCESS
    WARNING
    ERROR
    ACHIEVEMENT
    PAYMENT
    TASK_UPDATE
    CAMPAIGN_UPDATE
    PLATFORM_UPDATE
  }
`;

const TokenPrice = gql`
  type TokenPrice {
    tokenType: String!
    price: Currency!
    change24h: Float!
    marketCap: Currency!
    volume: Currency!
  }
`;

const PlatformMetrics = gql`
  type PlatformMetrics {
    users: UserMetrics!
    revenue: RevenueMetrics!
    engagement: EngagementMetrics!
    tokenomics: TokenomicsMetrics!
    network: NetworkMetrics!
  }
`;

const UserMetrics = gql`
  type UserMetrics {
    total: Int!
    active: Int!
    paying: Int!
    enterprise: Int!
    growth: Float!
    retention: Float!
  }
`;

const RevenueMetrics = gql`
  type RevenueMetrics {
    total: Currency!
    monthly: Currency!
    mrr: Currency!
    arr: Currency!
    growth: Float!
  }
`;

const EngagementMetrics = gql`
  type EngagementMetrics {
    tasks: Int!
    transactions: Int!
    volume: Currency!
    satisfaction: Float!
    networkEffects: Float!
  }
`;

const TokenomicsMetrics = gql`
  type TokenomicsMetrics {
    totalSupply: String!
    circulatingSupply: String!
    burned: String!
    marketCap: Currency!
    price: Currency!
    staked: String!
    distribution: [TokenDistribution!]!
  }
`;

const NetworkMetrics = gql`
  type NetworkMetrics {
    connections: Int!
    transactions: Int!
    gasPrice: Float!
    blockTime: Float!
    uptime: Float!
  }
`;

const TokenDistribution = gql`
  type TokenDistribution {
    category: String!
    percentage: Float!
    amount: String!
  }
`;

const UserMetrics = gql`
  type UserMetrics {
    totalEarnings: Currency!
    completedTasks: Int!
    totalProjects: Int!
    averageRating: Float!
    successRate: Float!
    activeContracts: Int!
    skills: [SkillStatistics!]!
  }
`;

const CampaignMetrics = gql`
  type CampaignMetrics {
    impressions: Int!
    clicks: Int!
    completions: Int!
    conversionRate: Float!
    costPerCompletion: Currency!
    qualityScore: Float!
    roi: Float!
  }
`;

const MarketplaceOverview = gql`
  type MarketplaceOverview {
    totalValueLocked: Currency!
    dailyVolume: Currency!
    activeUsers: Int!
    totalProjects: Int!
    successRate: Float!
    averageProjectValue: Currency!
  }
`;

const CategoryStats = gql`
  type CategoryStats {
    category: String!
    totalProjects: Int!
    totalValue: Currency!
    averageTime: Float!
    successRate: Float!
  }
`;

const NetworkStatus = gql`
  type NetworkStatus {
    status: String!
    blockNumber: Int!
    gasPrice: Float!
    peerCount: Int!
    syncStatus: String!
    lastSync: DateTime!
  }
`;

const BlockchainStats = gql`
  type BlockchainStats {
    blockNumber: Int!
    blockTime: Float!
    gasLimit: Int!
    difficulty: Float!
    hashRate: Float!
    totalSupply: String!
  }
`;

const TokenStats = gql`
  type TokenStats {
    price: Currency!
    marketCap: Currency!
    volume24h: Currency!
    change24h: Float!
    holders: Int!
    transfers: Int!
  }
`;

const GovernanceProposal = gql`
  type GovernanceProposal {
    id: ID!
    proposerId: ID!
    title: String!
    description: String!
    status: ProposalStatus!
    votes: [Vote!]!
    quorum: Int!
    votingPower: Float!
    startTime: DateTime!
    endTime: DateTime!
    createdAt: DateTime!
    executedAt: DateTime
  }
`;

const Vote = gql`
  type Vote {
    id: ID!
    proposalId: ID!
    voterId: ID!
    support: Boolean!
    votingPower: Float!
    reason: String!
    timestamp: DateTime!
  }
`;

const Transaction = gql{
  id: ID!
  userId: ID!
  type: TransactionType!
  amount: Float!
  currency: String!
  fromAddress: String!
  toAddress: String!
  blockNumber: Int!
  transactionHash: String!
  gasUsed: Int!
  gasPrice: Float!
  status: PaymentStatus!
  metadata: JSON!
  createdAt: DateTime!
  processedAt: DateTime!
}

const TransactionType = gql{
  enum TransactionType {
      MINT
      BURN
      TRANSFER
      STAKE
      UNSTAKE
      REWARD
      FEE_PAYMENT
      GOVERNANCE_VOTE
      PROPOSAL_CREATE
      BUYBACK
      DIVIDEND
  }
};

const FloatRange = gql{
  input FloatRange {
    min: Float
    max: Float
  }
`;

const IntRange = gql{
  input IntRange {
    min: Int
    max: Int
  }
};

const DateRange = gql{
  input DateRange {
    start: DateTime
    end: DateTime
  }
`;

const PageInfo = gql`
  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String!
    endCursor: String!
    total: Int!
  }
`;

// Export schema
export default {
  User,
  Wallet,
  TokenBalances,
  TokenBalance,
  StablecoinBalance,
  Subscription,
  BillingInfo,
  Payment,
  UsageStats,
  SubscriptionFeatures,
  TaskGuarantee,
  EarningsFeatures,
  SupportFeatures,
  Benefit,
  SkillProfile,
  SkillCategory,
  Experience,
  Expertise,
  PortfolioItem,
  Certification,
  Availability,
  AvailabilitySchedule,
  Pricing,
  ProjectRate,
  Verification,
  Metrics,
  Achievement,
  UserStatistics,
  SkillStatistics,
  Task,
  Client,
  ClientVerification,
  Application,
  Campaign,
  TargetAudience,
  Budget,
  Bidding,
  CampaignPerformance,
  Booster,
  BoosterEffects,
  BoosterEffect,
  BoosterPricing,
  VolumeDiscount,
  BoosterAvailability,
  BoosterVisual,
  UserStatus,
  SubscriptionStatus,
  BillingCycle,
  PaymentStatus,
  BenefitCategory,
  ExpertiseLevel,
  VerificationLevel,
  Rarity,
  TaskCategory,
  TaskType,
  TaskDifficulty,
  TaskRequirements,
  TaskStatus,
  ApplicationStatus,
  CampaignType,
  CampaignStatus,
  BidType,
  BoosterType,
  UserInput,
  SkillProfileInput,
  SkillCategoryInput,
  ExperienceInput,
  ExpertiseInput,
  CertificationInput,
  PortfolioItemInput,
  AvailabilityInput,
  AvailabilityScheduleInput,
  PricingInput,
  ProjectRateInput,
  TaskInput,
  TaskRequirementsInput,
  CampaignInput,
  TargetAudienceInput,
  BudgetInput,
  BiddingInput,
  BoosterPurchaseInput,
  UserFilter,
  SkillProfileFilter,
  TaskFilter,
  CampaignFilter,
  BoosterFilter,
  TransactionFilter,
  ProposalStatus,
  GovernanceProposalInput,
  VoteInput,
  ApplicationInput,
  Notification,
  NotificationType,
  TokenPrice,
  PlatformMetrics,
  UserMetrics,
  RevenueMetrics,
  EngagementMetrics,
  TokenomicsMetrics,
  NetworkMetrics,
  TokenDistribution,
  UserMetrics,
  CampaignMetrics,
  MarketplaceOverview,
  CategoryStats,
  NetworkStatus,
  BlockchainStats,
  TokenStats,
  GovernanceProposal,
  Vote,
  Transaction,
  TransactionType,
  FloatRange,
  IntRange,
  DateRange,
  PageInfo,
  UserConnection,
  UserEdge,
  SkillProfileConnection,
  SkillProfileEdge,
  TaskConnection,
  TaskEdge,
  CampaignConnection,
  CampaignEdge,
  BoosterConnection,
  BoosterEdge,
  TransactionConnection,
  TransactionEdge,
  Query,
  Mutation,
  Subscription,
  DateTime,
  Currency
};