/**
 * Enterprise API Gateway with Rate Limiting and Monetization
 * Multi-billion dollar crypto application API infrastructure
 */

import { EventEmitter } from 'events';
import { Express, Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { DatabaseManager } from '../../database/mongodb/connection';
import { z } from 'zod';

// API Gateway Configuration Schemas
const ApiKeySchema = z.object({
  keyId: z.string(),
  userId: z.string(),
  name: z.string(),
  permissions: z.array(z.string()),
  rateLimits: z.object({
    requestsPerMinute: z.number().default(60),
    requestsPerHour: z.number().default(1000),
    requestsPerDay: z.number().default(10000),
    bandwidthQuotaGB: z.number().default(100)
  }),
  pricing: z.object({
    tier: z.enum(['free', 'starter', 'professional', 'enterprise']),
    pricePerRequest: z.number().default(0.001),
    monthlyQuota: z.number().default(10000),
    overageRate: z.number().default(0.002)
  }),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  lastUsed: z.date().optional(),
  usage: z.object({
    totalRequests: z.number().default(0),
    currentMonthRequests: z.number().default(0),
    bandwidthUsedGB: z.number().default(0),
    lastResetDate: z.date().default(() => new Date())
  }).default({})
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

// Rate Limiting Configuration
interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  headers?: boolean;
}

// Monetization Configuration
interface MonetizationConfig {
  enabled: boolean;
  billingCycle: 'monthly' | 'daily';
  freeTierRequests: number;
  tieredPricing: {
    starter: { limit: number; pricePerRequest: number };
    professional: { limit: number; pricePerRequest: number };
    enterprise: { limit: number; pricePerRequest: number };
  };
  usageTracking: boolean;
  invoiceGeneration: boolean;
}

// API Metrics
interface ApiMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  bandwidthUsage: number;
  topEndpoints: Array<{
    path: string;
    count: number;
    avgResponseTime: number;
  }>;
  errorRates: Map<string, number>;
  responseTimePercentiles: {
    p50: number;
    p95: number;
    p99: number;
  };
}

/**
 * Enterprise API Gateway
 * Provides comprehensive API management, rate limiting, and monetization
 */
export class ApiGateway extends EventEmitter {
  private redis: Redis;
  private dbManager: DatabaseManager;
  private config: MonetizationConfig;
  private rateLimiters: Map<string, any> = new Map();
  private metrics: ApiMetrics;
  private middleware: any[] = [];

  constructor(config?: Partial<MonetizationConfig>) {
    super();

    this.dbManager = new DatabaseManager();
    this.redis = new Redis(process.env.REDIS_URL!);

    this.config = {
      enabled: true,
      billingCycle: 'monthly',
      freeTierRequests: 1000,
      tieredPricing: {
        starter: { limit: 50000, pricePerRequest: 0.001 },
        professional: { limit: 500000, pricePerRequest: 0.0005 },
        enterprise: { limit: 5000000, pricePerRequest: 0.0002 }
      },
      usageTracking: true,
      invoiceGeneration: true,
      ...config
    };

    this.metrics = this.initializeMetrics();
    this.setupDefaultMiddleware();
  }

  private initializeMetrics(): ApiMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      bandwidthUsage: 0,
      topEndpoints: [],
      errorRates: new Map(),
      responseTimePercentiles: {
        p50: 0,
        p95: 0,
        p99: 0
      }
    };
  }

  private setupDefaultMiddleware(): void {
    // API Key Authentication
    this.middleware.push(this.authenticateApiKey.bind(this));

    // Rate Limiting
    this.middleware.push(this.applyRateLimiting.bind(this));

    // Request Logging
    this.middleware.push(this.logRequest.bind(this));

    // Usage Tracking
    this.middleware.push(this.trackUsage.bind(this));

    // Response Time Monitoring
    this.middleware.push(this.monitorResponseTime.bind(this));
  }

  /**
   * Express Middleware Factory
   */
  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      this.executeMiddleware(req, res, next);
    };
  }

  private async executeMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      for (const middleware of this.middleware) {
        await middleware(req, res, () => {});
      }
      next();
    } catch (error) {
      next(error);
    }
  }

  /**
   * API Key Authentication
   */
  private async authenticateApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        error: 'API key required',
        code: 'MISSING_API_KEY',
        documentation: 'https://docs.yourapp.com/api/authentication'
      });
      return;
    }

    try {
      const keyData = await this.getApiKeyData(apiKey);

      if (!keyData || !keyData.isActive) {
        res.status(401).json({
          error: 'Invalid or inactive API key',
          code: 'INVALID_API_KEY'
        });
        return;
      }

      // Check permissions
      const requiredPermission = this.getRequiredPermission(req.path, req.method);
      if (!keyData.permissions.includes(requiredPermission) && !keyData.permissions.includes('*')) {
        res.status(403).json({
          error: 'Insufficient permissions',
          code: 'INSUFFICIENT_PERMISSIONS',
          required: requiredPermission
        });
        return;
      }

      // Attach key data to request
      (req as any).apiKey = keyData;

      // Update last used timestamp
      await this.updateApiKeyUsage(keyData.keyId);

      next();
    } catch (error) {
      console.error('API key authentication error:', error);
      res.status(500).json({
        error: 'Authentication service error',
        code: 'AUTH_ERROR'
      });
    }
  }

  /**
   * Rate Limiting Middleware
   */
  private async applyRateLimiting(req: Request, res: Response, next: NextFunction): Promise<void> {
    const apiKey = (req as any).apiKey as ApiKey;

    if (!apiKey) {
      next();
      return;
    }

    const keyId = apiKey.keyId;
    const now = Date.now();

    try {
      // Check multiple rate limit windows
      const limits = [
        { window: 60, max: apiKey.rateLimits.requestsPerMinute, key: `min:${keyId}` },
        { window: 3600, max: apiKey.rateLimits.requestsPerHour, key: `hour:${keyId}` },
        { window: 86400, max: apiKey.rateLimits.requestsPerDay, key: `day:${keyId}` }
      ];

      for (const limit of limits) {
        const current = await this.redis.incr(limit.key);

        if (current === 1) {
          await this.redis.expire(limit.key, limit.window);
        }

        if (current > limit.max) {
          const ttl = await this.redis.ttl(limit.key);

          res.set({
            'X-RateLimit-Limit': limit.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': (Math.floor(now / 1000) + ttl).toString(),
            'Retry-After': ttl.toString()
          });

          res.status(429).json({
            error: `Rate limit exceeded (${limit.window}s window)`,
            code: 'RATE_LIMIT_EXCEEDED',
            limit: limit.max,
            window: limit.window,
            retryAfter: ttl
          });
          return;
        }

        res.set({
          'X-RateLimit-Limit': limit.max.toString(),
          'X-RateLimit-Remaining': Math.max(0, limit.max - current).toString(),
          'X-RateLimit-Reset': (Math.floor(now / 1000) + await this.redis.ttl(limit.key)).toString()
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      next();
    }
  }

  /**
   * Request Logging Middleware
   */
  private async logRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = Date.now();
    const apiKey = (req as any).apiKey as ApiKey;

    // Store start time for response time calculation
    (req as any).startTime = startTime;

    // Log request details
    const logData = {
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      apiKeyId: apiKey?.keyId,
      userId: apiKey?.userId,
      requestBody: req.method !== 'GET' ? this.sanitizeRequestBody(req.body) : undefined,
      headers: this.sanitizeHeaders(req.headers)
    };

    console.log('API Request:', JSON.stringify(logData, null, 2));

    // Store in database for analytics
    await this.storeRequestLog(logData);

    next();
  }

  /**
   * Usage Tracking Middleware
   */
  private async trackUsage(req: Request, res: Response, next: NextFunction): Promise<void> {
    const apiKey = (req as any).apiKey as ApiKey;

    if (!apiKey || !this.config.usageTracking) {
      next();
      return;
    }

    try {
      // Update usage counters
      await this.updateUsageCounters(apiKey.keyId);

      // Check bandwidth quota
      const requestSize = JSON.stringify(req.body).length;
      const newBandwidthUsage = (apiKey.usage.bandwidthUsedGB || 0) + (requestSize / (1024 * 1024 * 1024));

      if (newBandwidthUsage > apiKey.rateLimits.bandwidthQuotaGB) {
        res.status(429).json({
          error: 'Bandwidth quota exceeded',
          code: 'BANDWIDTH_QUOTA_EXCEEDED',
          quota: apiKey.rateLimits.bandwidthQuotaGB,
          used: newBandwidthUsage
        });
        return;
      }

      // Calculate cost for this request
      const cost = this.calculateRequestCost(apiKey, req.path);

      // Store usage record
      await this.recordUsage({
        apiKeyId: apiKey.keyId,
        userId: apiKey.userId,
        endpoint: req.path,
        method: req.method,
        cost,
        timestamp: new Date(),
        requestSize,
        responseSize: 0 // Will be updated after response
      });

      next();
    } catch (error) {
      console.error('Usage tracking error:', error);
      next();
    }
  }

  /**
   * Response Time Monitoring Middleware
   */
  private async monitorResponseTime(req: Request, res: Response, next: NextFunction): Promise<void> {
    const startTime = (req as any).startTime;

    // Override res.end to track response
    const originalEnd = res.end;
    res.end = function(this: Response, ...args: any[]) {
      const responseTime = Date.now() - startTime;

      // Update metrics
      this.updateMetrics(req, res, responseTime);

      // Call original end
      originalEnd.apply(this, args);
    }.bind(this);

    next();
  }

  /**
   * API Key Management
   */
  public async createApiKey(userId: string, keyData: Partial<ApiKey>): Promise<ApiKey> {
    const apiKeyData: ApiKey = ApiKeySchema.parse({
      ...keyData,
      keyId: `ak_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      createdAt: new Date()
    });

    // Store in database
    await this.dbManager.insert('apiKeys', apiKeyData);

    this.emit('apiKeyCreated', apiKeyData);

    return apiKeyData;
  }

  public async updateApiKey(keyId: string, updates: Partial<ApiKey>): Promise<ApiKey | null> {
    const result = await this.dbManager.update(
      'apiKeys',
      { keyId },
      { $set: updates }
    );

    if (result.modifiedCount > 0) {
      const updatedKey = await this.getApiKeyDataByKeyId(keyId);
      this.emit('apiKeyUpdated', updatedKey);
      return updatedKey;
    }

    return null;
  }

  public async revokeApiKey(keyId: string): Promise<boolean> {
    const result = await this.dbManager.update(
      'apiKeys',
      { keyId },
      { $set: { isActive: false, revokedAt: new Date() } }
    );

    if (result.modifiedCount > 0) {
      this.emit('apiKeyRevoked', { keyId, revokedAt: new Date() });
      return true;
    }

    return false;
  }

  /**
   * Usage Analytics
   */
  public async getUsageAnalytics(userId: string, period: 'day' | 'week' | 'month' = 'month'): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'day':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const analytics = await this.dbManager.aggregate('apiUsage', [
      {
        $match: {
          userId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
            endpoint: '$endpoint'
          },
          requests: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          avgResponseTime: { $avg: '$responseTime' }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          endpoints: {
            $push: {
              endpoint: '$_id.endpoint',
              requests: '$requests',
              totalCost: '$totalCost',
              avgResponseTime: '$avgResponseTime'
            }
          },
          totalRequests: { $sum: '$requests' },
          totalCost: { $sum: '$totalCost' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    return analytics;
  }

  /**
   * Billing Integration
   */
  public async generateInvoice(userId: string, period: 'monthly' | 'daily'): Promise<any> {
    const endDate = new Date();
    const startDate = new Date(endDate);

    if (period === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else {
      startDate.setDate(startDate.getDate() - 1);
    }

    // Aggregate usage for the period
    const usage = await this.dbManager.aggregate('apiUsage', [
      {
        $match: {
          userId,
          timestamp: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: '$apiKeyId',
          totalRequests: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          totalBandwidth: { $sum: '$requestSize' }
        }
      },
      {
        $lookup: {
          from: 'apiKeys',
          localField: '_id',
          foreignField: 'keyId',
          as: 'keyInfo'
        }
      }
    ]);

    const invoice = {
      invoiceId: `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      period: { start: startDate, end: endDate },
      usage: usage[0]?.totalRequests || 0,
      amount: usage.reduce((sum, item) => sum + item.totalCost, 0),
      items: usage.map(item => ({
        apiKeyId: item._id,
        keyName: item.keyInfo[0]?.name || 'Unknown',
        requests: item.totalRequests,
        cost: item.totalCost,
        bandwidthGB: item.totalBandwidth / (1024 * 1024 * 1024)
      })),
      generatedAt: new Date(),
      status: 'pending'
    };

    // Store invoice
    await this.dbManager.insert('invoices', invoice);

    this.emit('invoiceGenerated', invoice);

    return invoice;
  }

  /**
   * Private Helper Methods
   */
  private async getApiKeyData(apiKey: string): Promise<ApiKey | null> {
    // First try Redis cache
    const cached = await this.redis.get(`apikey:${apiKey}`);
    if (cached) {
      return JSON.parse(cached);
    }

    // Fallback to database
    const keyData = await this.dbManager.findOne('apiKeys', { keyId: apiKey });
    if (keyData) {
      // Cache for 5 minutes
      await this.redis.setex(`apikey:${apiKey}`, 300, JSON.stringify(keyData));
    }

    return keyData;
  }

  private async getApiKeyDataByKeyId(keyId: string): Promise<ApiKey | null> {
    return await this.dbManager.findOne('apiKeys', { keyId });
  }

  private getRequiredPermission(path: string, method: string): string {
    // Map paths and methods to permissions
    const pathMap: { [key: string]: { [method: string]: string } } = {
      '/api/v1/trading': {
        'GET': 'trading:read',
        'POST': 'trading:write',
        'DELETE': 'trading:delete'
      },
      '/api/v1/defi': {
        'GET': 'defi:read',
        'POST': 'defi:write'
      },
      '/api/v1/nft': {
        'GET': 'nft:read',
        'POST': 'nft:write'
      },
      '/api/v1/analytics': {
        'GET': 'analytics:read'
      }
    };

    for (const [basePath, permissions] of Object.entries(pathMap)) {
      if (path.startsWith(basePath)) {
        return permissions[method] || 'api:read';
      }
    }

    return 'api:read';
  }

  private async updateApiKeyUsage(keyId: string): Promise<void> {
    await this.dbManager.update(
      'apiKeys',
      { keyId },
      { $set: { lastUsed: new Date() } }
    );
  }

  private async storeRequestLog(logData: any): Promise<void> {
    try {
      await this.dbManager.insert('requestLogs', logData);
    } catch (error) {
      console.error('Failed to store request log:', error);
    }
  }

  private async updateUsageCounters(keyId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const counterKey = `usage:${keyId}:${today}`;

    await this.redis.incr(counterKey);
    await this.redis.expire(counterKey, 86400); // 24 hours
  }

  private calculateRequestCost(apiKey: ApiKey, endpoint: string): number {
    const baseRate = apiKey.pricing.pricePerRequest;

    // Apply tier discounts
    let multiplier = 1;
    if (apiKey.pricing.tier === 'professional') multiplier = 0.8;
    if (apiKey.pricing.tier === 'enterprise') multiplier = 0.6;

    // Apply endpoint-specific pricing
    if (endpoint.includes('ai') || endpoint.includes('analytics')) {
      multiplier *= 1.5; // Premium endpoints cost more
    }

    return baseRate * multiplier;
  }

  private async recordUsage(usageRecord: any): Promise<void> {
    await this.dbManager.insert('apiUsage', usageRecord);
  }

  private sanitizeRequestBody(body: any): any {
    if (!body) return undefined;

    // Remove sensitive information
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.apiKey;
    delete sanitized.privateKey;
    delete sanitized.secret;

    return sanitized;
  }

  private sanitizeHeaders(headers: any): any {
    const sanitized = { ...headers };
    delete sanitized.authorization;
    delete sanitized['x-api-key'];

    return sanitized;
  }

  private updateMetrics(req: Request, res: Response, responseTime: number): void {
    this.metrics.totalRequests++;

    if (res.statusCode >= 200 && res.statusCode < 400) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
      this.metrics.totalRequests;

    // Update top endpoints
    const path = req.path;
    const existingEndpoint = this.metrics.topEndpoints.find(e => e.path === path);

    if (existingEndpoint) {
      existingEndpoint.count++;
      existingEndpoint.avgResponseTime =
        (existingEndpoint.avgResponseTime * (existingEndpoint.count - 1) + responseTime) /
        existingEndpoint.count;
    } else {
      this.metrics.topEndpoints.push({
        path,
        count: 1,
        avgResponseTime: responseTime
      });
    }

    // Keep only top 10 endpoints
    this.metrics.topEndpoints.sort((a, b) => b.count - a.count);
    this.metrics.topEndpoints = this.metrics.topEndpoints.slice(0, 10);
  }

  /**
   * Public Methods for Analytics
   */
  public getMetrics(): ApiMetrics {
    return { ...this.metrics };
  }

  public async getTopUsers(limit: number = 10): Promise<any[]> {
    return await this.dbManager.aggregate('apiUsage', [
      {
        $group: {
          _id: '$userId',
          totalRequests: { $sum: 1 },
          totalCost: { $sum: '$cost' },
          avgResponseTime: { $avg: '$responseTime' }
        }
      },
      { $sort: { totalRequests: -1 } },
      { $limit: limit }
    ]);
  }

  public async getTopEndpoints(limit: number = 10): Promise<any[]> {
    return await this.dbManager.aggregate('apiUsage', [
      {
        $group: {
          _id: '$endpoint',
          requests: { $sum: 1 },
          avgCost: { $avg: '$cost' },
          avgResponseTime: { $avg: '$responseTime' }
        }
      },
      { $sort: { requests: -1 } },
      { $limit: limit }
    ]);
  }

  /**
   * Health Check
   */
  public async healthCheck(): Promise<any> {
    const redisPing = await this.redis.ping();
    const dbHealth = await this.dbManager.healthCheck();

    return {
      status: 'healthy',
      timestamp: new Date(),
      redis: redisPing === 'PONG' ? 'healthy' : 'unhealthy',
      database: dbHealth.status,
      metrics: {
        totalRequests: this.metrics.totalRequests,
        averageResponseTime: this.metrics.averageResponseTime,
        successRate: this.metrics.totalRequests > 0
          ? this.metrics.successfulRequests / this.metrics.totalRequests
          : 0
      }
    };
  }

  /**
   * Cleanup
   */
  public async shutdown(): Promise<void> {
    await this.redis.quit();
    await this.dbManager.disconnect();
  }
}

/**
 * Rate Limiting Utilities
 */
export class RateLimiter {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async isAllowed(key: string, limit: number, windowMs: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const window = Math.ceil(windowMs / 1000);
    const now = Math.floor(Date.now() / 1000);
    const pipeline = this.redis.pipeline();

    // Remove expired entries
    pipeline.zremrangebyscore(key, 0, now - window);

    // Count current requests
    pipeline.zcard(key);

    // Add current request
    pipeline.zadd(key, now, `${now}-${Math.random()}`);

    // Set expiration
    pipeline.expire(key, window);

    const results = await pipeline.exec();
    const currentCount = results![1][1] as number;

    return {
      allowed: currentCount < limit,
      remaining: Math.max(0, limit - currentCount - 1),
      resetTime: now + window
    };
  }
}

export default ApiGateway;