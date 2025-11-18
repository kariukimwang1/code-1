import { EventEmitter } from 'events';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (req: any) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  onLimitReached?: (req: any, res: any) => void;
  customResponse?: (req: any, res: any) => any;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

interface DDoSProtectionConfig {
  enabled: boolean;
  detectionThreshold: number;
  mitigationLevels: {
    low: { multiplier: number; duration: number };
    medium: { multiplier: number; duration: number };
    high: { multiplier: number; duration: number };
    critical: { multiplier: number; duration: number };
  };
  whitelist: string[];
  blacklist: string[];
  adaptiveLimiting: boolean;
  geoBlocking: boolean;
  botDetection: boolean;
  requestValidation: boolean;
  connectionLimiting: boolean;
  bandwidthLimiting: boolean;
}

interface RateLimitStore {
  hits: number;
  resetTime: Date;
  lastAccess: Date;
  blocked: boolean;
  blockExpires?: Date;
  mitigationLevel?: string;
}

interface DDoSDetection {
  id: string;
  type: 'traffic_spike' | 'suspicious_pattern' | 'bot_attack' | 'geo_anomaly' | 'connection_flood';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  timestamp: Date;
  metrics: {
    requestRate: number;
    bandwidthUsage: number;
    connectionCount: number;
    errorRate: number;
  };
  mitigated: boolean;
  mitigationDuration: number;
}

interface ConnectionInfo {
  id: string;
  ipAddress: string;
  userAgent: string;
  startTime: Date;
  requestCount: number;
  bandwidthUsed: number;
  lastActivity: Date;
  flagged: boolean;
}

export class DDoSProtection extends EventEmitter {
  private config: DDoSProtectionConfig;
  private rateLimitConfigs: Map<string, RateLimitConfig> = new Map();
  private rateLimitStore: LRUCache<string, RateLimitStore>;
  private ddosDetections: DDoSDetection[] = [];
  private activeConnections = new Map<string, ConnectionInfo>();
  private ipReputation = new Map<string, { score: number; lastUpdate: Date }>();
  private globalMetrics = {
    totalRequests: 0,
    totalBandwidth: 0,
    activeConnections: 0,
    blockedRequests: 0,
    startTime: new Date()
  };
  private trafficHistory = new Map<string, { timestamp: number; requests: number; bandwidth: number }[]>();
  private mitigationStatus = new Map<string, { level: string; expires: Date }>();

  constructor(config: Partial<DDoSProtectionConfig> = {}) {
    super();

    this.config = {
      enabled: true,
      detectionThreshold: 1000, // requests per minute
      mitigationLevels: {
        low: { multiplier: 0.5, duration: 5 * 60 * 1000 },
        medium: { multiplier: 0.2, duration: 15 * 60 * 1000 },
        high: { multiplier: 0.1, duration: 30 * 60 * 1000 },
        critical: { multiplier: 0.01, duration: 60 * 60 * 1000 }
      },
      whitelist: [],
      blacklist: [],
      adaptiveLimiting: true,
      geoBlocking: true,
      botDetection: true,
      requestValidation: true,
      connectionLimiting: true,
      bandwidthLimiting: true,
      ...config
    };

    this.rateLimitStore = new LRUCache<string, RateLimitStore>({
      max: 100000, // Store up to 100k entries
      ttl: 1000 * 60 * 60, // 1 hour TTL
      allowStale: false
    });

    this.initializeDefaultRateLimits();
    this.startMonitoring();
  }

  private initializeDefaultRateLimits(): void {
    // Global rate limit
    this.addRateLimit('global', {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 10000,
      standardHeaders: true,
      legacyHeaders: false
    });

    // API rate limits
    this.addRateLimit('api', {
      windowMs: 60 * 1000,
      maxRequests: 1000,
      standardHeaders: true,
      legacyHeaders: false
    });

    this.addRateLimit('auth', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 20,
      standardHeaders: true,
      legacyHeaders: false
    });

    this.addRateLimit('sensitive', {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 100,
      standardHeaders: true,
      legacyHeaders: false
    });

    // Per-IP rate limits
    this.addRateLimit('ip', {
      windowMs: 60 * 1000,
      maxRequests: 100,
      standardHeaders: true,
      legacyHeaders: false
    });

    // WebSocket connections
    this.addRateLimit('websocket', {
      windowMs: 60 * 1000,
      maxRequests: 30,
      standardHeaders: true,
      legacyHeaders: false
    });
  }

  private startMonitoring(): void {
    // Update global metrics every second
    setInterval(() => {
      this.updateGlobalMetrics();
    }, 1000);

    // Clean up old data every 5 minutes
    setInterval(() => {
      this.cleanupOldData();
    }, 5 * 60 * 1000);

    // Analyze traffic patterns every minute
    setInterval(() => {
      this.analyzeTrafficPatterns();
    }, 60 * 1000);

    // Update IP reputation every 10 minutes
    setInterval(() => {
      this.updateIPReputation();
    }, 10 * 60 * 1000);
  }

  addRateLimit(name: string, config: RateLimitConfig): void {
    this.rateLimitConfigs.set(name, config);
  }

  // Main rate limiting method
  async checkRateLimit(
    key: string,
    limitName: string,
    request?: any
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    totalHits: number;
    blocked: boolean;
    reason?: string;
    mitigationLevel?: string;
  }> {
    const config = this.rateLimitConfigs.get(limitName);
    if (!config) {
      throw new Error(`Rate limit '${limitName}' not found`);
    }

    // Check if IP is whitelisted or blacklisted
    if (request && this.isIPRestricted(request.ipAddress)) {
      const restriction = this.getIPRestriction(request.ipAddress);
      if (restriction.type === 'blacklist') {
        return {
          allowed: false,
          remaining: 0,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
          totalHits: 0,
          blocked: true,
          reason: 'IP address is blacklisted'
        };
      }
      if (restriction.type === 'whitelist') {
        return {
          allowed: true,
          remaining: Infinity,
          resetTime: new Date(Date.now() + config.windowMs),
          totalHits: 0,
          blocked: false
        };
      }
    }

    // Check existing mitigation
    const mitigation = this.mitigationStatus.get(key);
    if (mitigation && mitigation.expires > new Date()) {
      const mitigatedConfig = this.applyMitigation(config, mitigation.level);
      const result = await this.checkAgainstStore(key, mitigatedConfig);
      result.mitigationLevel = mitigation.level;
      return result;
    }

    // Normal rate limit check
    return this.checkAgainstStore(key, config);
  }

  private async checkAgainstStore(
    key: string,
    config: RateLimitConfig
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    totalHits: number;
    blocked: boolean;
    reason?: string;
  }> {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let store = this.rateLimitStore.get(key);

    if (!store || store.resetTime <= new Date()) {
      // Create new store entry
      store = {
        hits: 0,
        resetTime: new Date(now + config.windowMs),
        lastAccess: new Date(),
        blocked: false
      };
      this.rateLimitStore.set(key, store);
    }

    // Check if blocked
    if (store.blocked && store.blockExpires && store.blockExpires > new Date()) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: store.blockExpires,
        totalHits: store.hits,
        blocked: true,
        reason: 'Rate limit exceeded'
      };
    }

    // Increment hit count
    store.hits++;
    store.lastAccess = new Date();

    // Check if limit exceeded
    const allowed = store.hits <= config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - store.hits);

    // Block if exceeded
    if (!allowed && !store.blocked) {
      store.blocked = true;
      store.blockExpires = new Date(now + config.windowMs);

      this.emit('rate_limit_exceeded', {
        key,
        hits: store.hits,
        limit: config.maxRequests,
        windowMs: config.windowMs
      });
    }

    return {
      allowed,
      remaining,
      resetTime: store.resetTime,
      totalHits: store.hits,
      blocked: store.blocked && !allowed
    };
  }

  private applyMitigation(config: RateLimitConfig, mitigationLevel: string): RateLimitConfig {
    const level = this.config.mitigationLevels[mitigationLevel as keyof typeof this.config.mitigationLevels];
    if (!level) return config;

    return {
      ...config,
      maxRequests: Math.ceil(config.maxRequests * level.multiplier)
    };
  }

  // DDoS Detection and Mitigation
  async detectAndMitigateDDoS(request: any): Promise<{
    allowed: boolean;
    mitigationLevel?: string;
    reason?: string;
    responseHeaders?: Record<string, string>;
  }> {
    if (!this.config.enabled) {
      return { allowed: true };
    }

    const ipAddress = request.ipAddress;
    const detection = await this.analyzeRequest(request);

    if (detection.threatLevel === 'critical') {
      const mitigationLevel = 'critical';
      await this.applyMitigation(ipAddress, mitigationLevel, detection);

      return {
        allowed: false,
        mitigationLevel,
        reason: 'Critical DDoS threat detected',
        responseHeaders: {
          'Retry-After': '3600',
          'X-DDoS-Mitigation': mitigationLevel
        }
      };
    }

    if (detection.threatLevel === 'high') {
      const mitigationLevel = 'high';
      await this.applyMitigation(ipAddress, mitigationLevel, detection);

      return {
        allowed: detection.allowed,
        mitigationLevel,
        reason: 'High DDoS threat detected',
        responseHeaders: {
          'X-DDoS-Mitigation': mitigationLevel
        }
      };
    }

    if (detection.threatLevel === 'medium') {
      const mitigationLevel = 'medium';
      await this.applyMitigation(ipAddress, mitigationLevel, detection);

      return {
        allowed: detection.allowed,
        mitigationLevel,
        reason: 'Medium DDoS threat detected'
      };
    }

    return { allowed: true };
  }

  private async analyzeRequest(request: any): Promise<{
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    allowed: boolean;
    detections: string[];
    metrics: any;
  }> {
    const detections: string[] = [];
    const metrics = {
      requestRate: this.getCurrentRequestRate(request.ipAddress),
      bandwidthUsage: this.getBandwidthUsage(request.ipAddress),
      connectionCount: this.getConnectionCount(request.ipAddress),
      errorRate: this.getErrorRate(request.ipAddress)
    };

    let threatLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let allowed = true;

    // Check request rate
    if (metrics.requestRate > this.config.detectionThreshold * 10) {
      detections.push('extreme_traffic_spike');
      threatLevel = 'critical';
      allowed = false;
    } else if (metrics.requestRate > this.config.detectionThreshold * 5) {
      detections.push('high_traffic_spike');
      threatLevel = 'high';
      allowed = false;
    } else if (metrics.requestRate > this.config.detectionThreshold * 2) {
      detections.push('moderate_traffic_spike');
      if (threatLevel === 'low') threatLevel = 'medium';
    }

    // Check for bot patterns
    if (this.config.botDetection && this.detectBot(request)) {
      detections.push('bot_detected');
      if (threatLevel === 'low') threatLevel = 'medium';
    }

    // Check connection patterns
    if (this.config.connectionLimiting && metrics.connectionCount > 1000) {
      detections.push('connection_flood');
      if (threatLevel === 'low') threatLevel = 'medium';
      allowed = false;
    }

    // Check bandwidth usage
    if (this.config.bandwidthLimiting && metrics.bandwidthUsage > 1024 * 1024 * 100) { // 100MB
      detections.push('excessive_bandwidth');
      if (threatLevel === 'low') threatLevel = 'medium';
    }

    // Check error rate
    if (metrics.errorRate > 0.5) { // 50% error rate
      detections.push('high_error_rate');
      if (threatLevel === 'low') threatLevel = 'medium';
    }

    // Check IP reputation
    const reputation = this.ipReputation.get(request.ipAddress);
    if (reputation && reputation.score < -50) {
      detections.push('poor_ip_reputation');
      threatLevel = 'high';
      allowed = false;
    }

    return {
      threatLevel,
      allowed,
      detections,
      metrics
    };
  }

  private detectBot(request: any): boolean {
    const userAgent = request.userAgent;

    if (!userAgent) return true; // No user agent is suspicious

    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /java\/1\./i,
      /apache-httpclient/i,
      /okhttp/i,
      /requests/i,
      /axios/i,
      /node-fetch/i,
      /go-http-client/i,
      /python-urllib/i,
      /lwp::simple/i,
      /winhttp/i,
      /httpclient/i,
      /http-request/i
    ];

    // Check user agent
    if (botPatterns.some(pattern => pattern.test(userAgent))) {
      return true;
    }

    // Check for missing common browser headers
    const requiredHeaders = ['accept', 'accept-language'];
    const hasRequiredHeaders = requiredHeaders.every(header => request.headers[header]);

    if (!hasRequiredHeaders) {
      return true;
    }

    // Check request pattern timing
    const key = `bot_timing:${request.ipAddress}`;
    const timing = this.rateLimitStore.get(key);

    if (timing && timing.hits > 100 && timing.lastAccess > new Date(Date.now() - 1000)) {
      return true; // More than 100 requests in 1 second
    }

    return false;
  }

  private async applyMitigation(
    identifier: string,
    level: string,
    detection: any
  ): Promise<void> {
    const levelConfig = this.config.mitigationLevels[level as keyof typeof this.config.mitigationLevels];
    if (!levelConfig) return;

    const expires = new Date(Date.now() + levelConfig.duration);

    // Store mitigation status
    this.mitigationStatus.set(identifier, {
      level,
      expires
    });

    // Create detection record
    const ddosDetection: DDoSDetection = {
      id: crypto.randomUUID(),
      type: this.classifyThreatType(detection.detections),
      severity: level as any,
      source: identifier,
      timestamp: new Date(),
      metrics: detection.metrics,
      mitigated: true,
      mitigationDuration: levelConfig.duration
    };

    this.ddosDetections.push(ddosDetection);

    // Emit events
    this.emit('ddos_detected', ddosDetection);
    this.emit('mitigation_applied', {
      identifier,
      level,
      duration: levelConfig.duration,
      detection: ddosDetection
    });
  }

  private classifyThreatType(detections: string[]): DDoSDetection['type'] {
    if (detections.includes('extreme_traffic_spike') || detections.includes('connection_flood')) {
      return 'traffic_spike';
    }
    if (detections.includes('bot_detected')) {
      return 'bot_attack';
    }
    if (detections.includes('poor_ip_reputation')) {
      return 'suspicious_pattern';
    }
    return 'suspicious_pattern';
  }

  private isIPRestricted(ipAddress: string): boolean {
    return this.config.whitelist.includes(ipAddress) || this.config.blacklist.includes(ipAddress);
  }

  private getIPRestriction(ipAddress: string): { type: 'whitelist' | 'blacklist' | 'none' } {
    if (this.config.whitelist.includes(ipAddress)) return { type: 'whitelist' };
    if (this.config.blacklist.includes(ipAddress)) return { type: 'blacklist' };
    return { type: 'none' };
  }

  private getCurrentRequestRate(ipAddress: string): number {
    const key = `rate:${ipAddress}`;
    const store = this.rateLimitStore.get(key);
    return store ? store.hits : 0;
  }

  private getBandwidthUsage(ipAddress: string): number {
    const connection = this.activeConnections.get(ipAddress);
    return connection ? connection.bandwidthUsed : 0;
  }

  private getConnectionCount(ipAddress: string): number {
    let count = 0;
    for (const [id, connection] of this.activeConnections.entries()) {
      if (connection.ipAddress === ipAddress) {
        count++;
      }
    }
    return count;
  }

  private getErrorRate(ipAddress: string): number {
    // Calculate error rate based on recent requests
    const key = `errors:${ipAddress}`;
    const errorStore = this.rateLimitStore.get(key);
    const totalStore = this.rateLimitStore.get(`rate:${ipAddress}`);

    if (!errorStore || !totalStore || totalStore.hits === 0) return 0;

    return errorStore.hits / totalStore.hits;
  }

  // Connection management
  registerConnection(connection: Partial<ConnectionInfo>): string {
    const id = crypto.randomUUID();
    const connectionInfo: ConnectionInfo = {
      id,
      ipAddress: connection.ipAddress || 'unknown',
      userAgent: connection.userAgent || 'unknown',
      startTime: new Date(),
      requestCount: 0,
      bandwidthUsed: 0,
      lastActivity: new Date(),
      flagged: false
    };

    this.activeConnections.set(id, connectionInfo);
    this.globalMetrics.activeConnections++;

    return id;
  }

  updateConnection(connectionId: string, updates: Partial<ConnectionInfo>): void {
    const connection = this.activeConnections.get(connectionId);
    if (connection) {
      Object.assign(connection, updates);
      connection.lastActivity = new Date();
    }
  }

  closeConnection(connectionId: string): void {
    if (this.activeConnections.has(connectionId)) {
      this.activeConnections.delete(connectionId);
      this.globalMetrics.activeConnections--;
    }
  }

  // IP Reputation Management
  updateIPReputation(ipAddress: string, scoreChange: number): void {
    const current = this.ipReputation.get(ipAddress);
    const newScore = (current?.score || 0) + scoreChange;

    this.ipReputation.set(ipAddress, {
      score: Math.max(-100, Math.min(100, newScore)),
      lastUpdate: new Date()
    });
  }

  getIPReputation(ipAddress: string): { score: number; lastUpdate: Date } | undefined {
    return this.ipReputation.get(ipAddress);
  }

  // Monitoring and Analytics
  private updateGlobalMetrics(): void {
    const now = new Date();
    const timeDiff = (now.getTime() - this.globalMetrics.startTime.getTime()) / 1000;

    // Calculate current request rate
    const currentRate = this.rateLimitStore.size / Math.max(timeDiff, 1);

    this.emit('metrics_update', {
      totalRequests: this.globalMetrics.totalRequests,
      activeConnections: this.globalMetrics.activeConnections,
      currentRate,
      blockedRequests: this.globalMetrics.blockedRequests,
      uptime: timeDiff
    });
  }

  private analyzeTrafficPatterns(): void {
    const now = Date.now();
    const windowSize = 60 * 1000; // 1 minute

    // Analyze global traffic
    let totalRequests = 0;
    let totalBandwidth = 0;

    for (const [key, store] of this.rateLimitStore.entries()) {
      if (store.lastAccess > new Date(now - windowSize)) {
        totalRequests += store.hits;
      }
    }

    const previousMinute = this.trafficHistory.get('global')?.find(
      entry => entry.timestamp > now - 2 * 60 * 1000 && entry.timestamp <= now - 60 * 1000
    );

    const currentEntry = { timestamp: now, requests: totalRequests, bandwidth: totalBandwidth };

    if (!this.trafficHistory.has('global')) {
      this.trafficHistory.set('global', []);
    }

    const history = this.trafficHistory.get('global')!;
    history.push(currentEntry);

    // Keep only last hour of history
    const oneHourAgo = now - 60 * 60 * 1000;
    const filtered = history.filter(entry => entry.timestamp > oneHourAgo);
    this.trafficHistory.set('global', filtered);

    // Detect traffic anomalies
    if (previousMinute && totalRequests > previousMinute.requests * 3) {
      this.emit('traffic_anomaly', {
        type: 'spike',
        current: totalRequests,
        previous: previousMinute.requests,
        multiplier: totalRequests / previousMinute.requests
      });
    }
  }

  private updateIPReputation(): void {
    const now = new Date();

    // Age out old reputation data
    for (const [ip, reputation] of this.ipReputation.entries()) {
      const age = now.getTime() - reputation.lastUpdate.getTime();
      if (age > 24 * 60 * 60 * 1000) { // 24 hours
        // Gradually restore reputation
        reputation.score += 10;
        reputation.lastUpdate = now;

        if (reputation.score >= 0) {
          this.ipReputation.delete(ip);
        }
      }
    }
  }

  private cleanupOldData(): void {
    const now = Date.now();

    // Clean up expired mitigations
    for (const [key, mitigation] of this.mitigationStatus.entries()) {
      if (mitigation.expires <= new Date()) {
        this.mitigationStatus.delete(key);
      }
    }

    // Clean up inactive connections
    for (const [id, connection] of this.activeConnections.entries()) {
      const inactiveTime = now - connection.lastActivity.getTime();
      if (inactiveTime > 30 * 60 * 1000) { // 30 minutes
        this.activeConnections.delete(id);
        this.globalMetrics.activeConnections--;
      }
    }

    // Clean up old DDoS detections
    const oneWeekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    this.ddosDetections = this.ddosDetections.filter(
      detection => detection.timestamp > oneWeekAgo
    );
  }

  // Public API methods
  getMetrics(): any {
    return {
      global: this.globalMetrics,
      activeConnections: this.activeConnections.size,
      ddosDetections: this.ddosDetections.length,
      ipReputationEntries: this.ipReputation.size,
      mitigationEntries: this.mitigationStatus.size,
      rateLimitStoreSize: this.rateLimitStore.size
    };
  }

  getDDoSDetections(severity?: DDoSDetection['severity']): DDoSDetection[] {
    if (severity) {
      return this.ddosDetections.filter(detection => detection.severity === severity);
    }
    return this.ddosDetections;
  }

  getActiveConnections(): ConnectionInfo[] {
    return Array.from(this.activeConnections.values());
  }

  addToWhitelist(ipAddress: string): void {
    if (!this.config.whitelist.includes(ipAddress)) {
      this.config.whitelist.push(ipAddress);
    }
  }

  removeFromWhitelist(ipAddress: string): void {
    const index = this.config.whitelist.indexOf(ipAddress);
    if (index > -1) {
      this.config.whitelist.splice(index, 1);
    }
  }

  addToBlacklist(ipAddress: string): void {
    if (!this.config.blacklist.includes(ipAddress)) {
      this.config.blacklist.push(ipAddress);
    }
  }

  removeFromBlacklist(ipAddress: string): void {
    const index = this.config.blacklist.indexOf(ipAddress);
    if (index > -1) {
      this.config.blacklist.splice(index, 1);
    }
  }

  clearRateLimitStore(): void {
    this.rateLimitStore.clear();
  }

  reset(): void {
    this.rateLimitStore.clear();
    this.ddosDetections = [];
    this.activeConnections.clear();
    this.ipReputation.clear();
    this.trafficHistory.clear();
    this.mitigationStatus.clear();
    this.globalMetrics = {
      totalRequests: 0,
      totalBandwidth: 0,
      activeConnections: 0,
      blockedRequests: 0,
      startTime: new Date()
    };
  }
}