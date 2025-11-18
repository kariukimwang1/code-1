/**
 * Multi-Billion Dollar Crypto Platform Configuration
 * Production-ready configuration for enterprise deployment
 */

import { PlatformConfig } from '../platform/orchestrator';

export const PRODUCTION_CONFIG: PlatformConfig = {
  environment: 'production',
  network: 'mainnet',
  features: {
    defi: true,
    ai_trading: true,
    nft_marketplace: true,
    social_trading: true,
    cross_chain: true,
    zk_auth: true,
    real_time_analytics: true,
    enterprise_admin: true
  },
  integrations: {
    blockchains: [
      'ethereum',
      'polygon',
      'binance',
      'arbitrum',
      'optimism',
      'avalanche',
      'fantom',
      'celo'
    ],
    external_apis: [
      'coingecko',
      'defillama',
      'moralis',
      'the_graph',
      'alchemy',
      'infura',
      'quicknode',
      'chainlink',
      'uniswap',
      'curve',
      'aave'
    ],
    payment_processors: [
      'stripe',
      'coinbase',
      'paypal',
      'wyre',
      'moonpay',
      'ramp',
      'transak'
    ],
    notification_services: [
      'sendgrid',
      'twilio',
      'pusher',
      'onesignal',
      'discord_webhook',
      'telegram_bot',
      'slack_webhook'
    ]
  },
  security: {
    require_2fa: true,
    rate_limiting: true,
    ip_whitelisting: true,
    audit_logging: true
  },
  scaling: {
    auto_scaling: true,
    load_balancing: true,
    caching: true,
    cdn_enabled: true
  }
};

export const STAGING_CONFIG: PlatformConfig = {
  ...PRODUCTION_CONFIG,
  environment: 'staging',
  network: 'testnet',
  security: {
    ...PRODUCTION_CONFIG.security,
    require_2fa: false,
    ip_whitelisting: false
  }
};

export const DEVELOPMENT_CONFIG: PlatformConfig = {
  ...PRODUCTION_CONFIG,
  environment: 'development',
  network: 'local',
  security: {
    ...PRODUCTION_CONFIG.security,
    require_2fa: false,
    rate_limiting: false,
    ip_whitelisting: false
  },
  scaling: {
    auto_scaling: false,
    load_balancing: false,
    caching: false,
    cdn_enabled: false
  }
};

// Environment-specific configuration selector
export function getPlatformConfig(): PlatformConfig {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return PRODUCTION_CONFIG;
    case 'staging':
      return STAGING_CONFIG;
    case 'development':
    default:
      return DEVELOPMENT_CONFIG;
  }
}

// Database Configuration
export const DATABASE_CONFIG = {
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/crypto_platform',
    options: {
      maxPoolSize: 50,
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority'
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_DB || '0'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    family: 4,
    keyPrefix: 'crypto_platform:',
    connectTimeout: 10000,
    commandTimeout: 5000
  }
};

// API Configuration
export const API_CONFIG = {
  gateway: {
    port: parseInt(process.env.API_GATEWAY_PORT || '3000'),
    cors: {
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      optionsSuccessStatus: 200
    },
    rateLimiting: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX || '1000'),
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false
    },
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }
  },
  monitoring: {
    enableMetrics: true,
    enableTracing: true,
    sampleRate: parseFloat(process.env.TRACING_SAMPLE_RATE || '0.1'),
    serviceName: 'crypto-platform-api',
    version: process.env.APP_VERSION || '1.0.0'
  }
};

// Blockchain Configuration
export const BLOCKCHAIN_CONFIG = {
  networks: {
    ethereum: {
      chainId: 1,
      name: 'Ethereum Mainnet',
      rpcUrl: process.env.ETHEREUM_RPC_URL!,
      wsUrl: process.env.ETHEREUM_WS_URL,
      blockExplorer: 'https://etherscan.io',
      nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
      contracts: {
        bridge: process.env.ETHEREUM_BRIDGE_CONTRACT!,
        defi: process.env.ETHEREUM_DEFIS_CONTRACT!,
        nft: process.env.ETHEREUM_NFT_CONTRACT!,
        governance: process.env.ETHEREUM_GOVERNANCE_CONTRACT!
      },
      confirmations: 12,
      gasPriceMultiplier: 1.2
    },
    polygon: {
      chainId: 137,
      name: 'Polygon Mainnet',
      rpcUrl: process.env.POLYGON_RPC_URL!,
      wsUrl: process.env.POLYGON_WS_URL,
      blockExplorer: 'https://polygonscan.com',
      nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
      contracts: {
        bridge: process.env.POLYGON_BRIDGE_CONTRACT!,
        defi: process.env.POLYGON_DEFIS_CONTRACT!,
        nft: process.env.POLYGON_NFT_CONTRACT!,
        governance: process.env.POLYGON_GOVERNANCE_CONTRACT!
      },
      confirmations: 20,
      gasPriceMultiplier: 1.1
    },
    bsc: {
      chainId: 56,
      name: 'Binance Smart Chain',
      rpcUrl: process.env.BSC_RPC_URL!,
      wsUrl: process.env.BSC_WS_URL,
      blockExplorer: 'https://bscscan.com',
      nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
      contracts: {
        bridge: process.env.BSC_BRIDGE_CONTRACT!,
        defi: process.env.BSC_DEFIS_CONTRACT!,
        nft: process.env.BSC_NFT_CONTRACT!,
        governance: process.env.BSC_GOVERNANCE_CONTRACT!
      },
      confirmations: 10,
      gasPriceMultiplier: 1.05
    }
  },
  web3: {
    maxRetries: 3,
    retryDelay: 1000,
    timeout: 30000,
    blockTime: 12000, // 12 seconds for Ethereum
    maxBlockSize: 15000000
  }
};

// Security Configuration
export const SECURITY_CONFIG = {
  authentication: {
    jwt: {
      secret: process.env.JWT_SECRET!,
      expiresIn: '24h',
      issuer: 'crypto-platform',
      audience: 'crypto-platform-users'
    },
    bcrypt: {
      saltRounds: 12
    },
    session: {
      secret: process.env.SESSION_SECRET!,
      resave: false,
      saveUninitialized: false,
      rolling: true,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'strict'
      }
    }
  },
  encryption: {
    algorithm: 'aes-256-gcm',
    keyLength: 32,
    ivLength: 16,
    saltLength: 32,
    tagLength: 16
  },
  rateLimiting: {
    tiers: {
      free: { requests: 100, window: '15m' },
      starter: { requests: 1000, window: '15m' },
      professional: { requests: 10000, window: '15m' },
      enterprise: { requests: 100000, window: '15m' }
    }
  },
  ipWhitelist: process.env.IP_WHITELIST?.split(',') || [],
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self'"
  }
};

// Monitoring and Analytics Configuration
export const MONITORING_CONFIG = {
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    enableConsole: true,
    enableFile: true,
    file: {
      filename: 'logs/app.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      datePattern: 'YYYY-MM-DD'
    }
  },
  metrics: {
    enabled: true,
    interval: 30000, // 30 seconds
    retention: '7d',
    exporters: ['prometheus', 'cloudwatch']
  },
  tracing: {
    enabled: true,
    sampleRate: parseFloat(process.env.TRACING_SAMPLE_RATE || '0.1'),
    serviceName: 'crypto-platform',
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  alerts: {
    enabled: true,
    channels: ['email', 'slack', 'pagerduty'],
    thresholds: {
      errorRate: 0.05, // 5%
      responseTime: 5000, // 5 seconds
      memoryUsage: 0.85, // 85%
      cpuUsage: 0.80, // 80%
      diskUsage: 0.90 // 90%
    }
  }
};

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  caching: {
    redis: {
      ttl: {
        user_sessions: 3600, // 1 hour
        api_responses: 300, // 5 minutes
        market_data: 60, // 1 minute
        analytics: 1800 // 30 minutes
      }
    },
    memory: {
      max_size: '500mb',
      check_period: 600 // 10 minutes
    }
  },
  connectionPooling: {
    mongodb: {
      min: 5,
      max: 50,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000
    },
    redis: {
      min: 2,
      max: 10,
      acquireTimeoutMillis: 10000
    }
  },
  compression: {
    enabled: true,
    threshold: 1024, // 1KB
    level: 6
  },
  clustering: {
    enabled: process.env.NODE_ENV === 'production',
    workers: require('os').cpus().length
  }
};

// Notification Configuration
export const NOTIFICATION_CONFIG = {
  email: {
    service: process.env.EMAIL_SERVICE || 'sendgrid',
    from: process.env.EMAIL_FROM!,
    templates: {
      welcome: 'welcome_template',
      verification: 'email_verification',
      password_reset: 'password_reset',
      transaction: 'transaction_confirmation',
      security_alert: 'security_alert'
    }
  },
  sms: {
    service: process.env.SMS_SERVICE || 'twilio',
    from: process.env.SMS_FROM!,
    templates: {
      verification: 'sms_verification',
      security_alert: 'security_alert'
    }
  },
  push: {
    service: process.env.PUSH_SERVICE || 'onesignal',
    appId: process.env.PUSH_APP_ID!,
    apiKey: process.env.PUSH_API_KEY!
  },
  webhooks: {
    discord: process.env.DISCORD_WEBHOOK_URL,
    slack: process.env.SLACK_WEBHOOK_URL,
    telegram: process.env.TELEGRAM_BOT_TOKEN
  }
};

// Business Logic Configuration
export const BUSINESS_CONFIG = {
  trading: {
    fees: {
      maker: 0.001, // 0.1%
      taker: 0.002, // 0.2%
      bridge: 0.001, // 0.1%
      nft: 0.025, // 2.5%
      withdrawal: {
        crypto: 0.001, // 0.1%
        fiat: 0.02 // 2%
      }
    },
    limits: {
      minimum_order: '10', // $10
      maximum_order: '1000000', // $1M
      daily_volume: '10000000', // $10M
      leverage: {
        max: 100,
        default: 10
      }
    },
    supported_assets: [
      'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'ADA', 'SOL', 'DOT', 'AVAX', 'MATIC',
      'LINK', 'UNI', 'AAVE', 'COMP', 'MKR', 'YFI', 'SNX', 'CRV', 'SUSHI'
    ]
  },
  defi: {
    protocols: {
      'aave': { fee: 0.0005, risk: 'low' },
      'compound': { fee: 0.0005, risk: 'low' },
      'uniswap': { fee: 0.003, risk: 'medium' },
      'curve': { fee: 0.0004, risk: 'low' },
      'yearn': { fee: 0.02, risk: 'high' }
    },
    yields: {
      conservative: { min: 0.02, max: 0.08 }, // 2-8%
      balanced: { min: 0.05, max: 0.15 }, // 5-15%
      aggressive: { min: 0.10, max: 0.50 } // 10-50%
    }
  },
  nft: {
    royalties: {
      creator: 0.025, // 2.5%
      platform: 0.025 // 2.5%
    },
    categories: ['art', 'gaming', 'music', 'sports', 'collectibles', 'virtual_worlds'],
    supported_formats: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg']
  },
  social: {
    copy_trading: {
      fee_sharing: {
        trader: 0.1, // 10%
        platform: 0.05 // 5%
      },
      minimum_followers: 10,
      minimum_profit_period: '30d'
    },
    reputation: {
      starting_score: 50,
      max_score: 100,
      decay_rate: 0.01 // 1% per month
    }
  }
};

// Legal and Compliance Configuration
export const COMPLIANCE_CONFIG = {
  kyc: {
    levels: {
      tier1: { limits: { daily: '1000', monthly: '10000' }, requirements: ['email', 'phone'] },
      tier2: { limits: { daily: '10000', monthly: '100000' }, requirements: ['email', 'phone', 'identity'] },
      tier3: { limits: { daily: '100000', monthly: '1000000' }, requirements: ['email', 'phone', 'identity', 'address'] }
    },
    providers: ['sumsub', 'onfido', 'veriff']
  },
  aml: {
    screening: {
      enabled: true,
      providers: ['chainalysis', 'elliptic', 'ciphertrace'],
      risk_threshold: 0.7
    },
    reporting: {
      sar_threshold: 10000, // $10,000
      ctr_threshold: 10000 // $10,000 daily
    }
  },
  jurisdictions: {
    restricted: ['US', 'IR', 'KP', 'SY'],
    licensed: ['GB', 'MT', 'CY', 'EE'],
    special_requirements: {
      'US': ['form_w9', 'accreditation'],
      'EU': ['kyc', 'aml_check', 'gdpr_compliance'],
      'UK': ['kyc', 'aml_check', 'fca_compliance']
    }
  }
};

export default {
  getPlatformConfig,
  DATABASE_CONFIG,
  API_CONFIG,
  BLOCKCHAIN_CONFIG,
  SECURITY_CONFIG,
  MONITORING_CONFIG,
  PERFORMANCE_CONFIG,
  NOTIFICATION_CONFIG,
  BUSINESS_CONFIG,
  COMPLIANCE_CONFIG
};