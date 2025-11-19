// Browser-compatible DDoS protection for Edge Runtime
// Note: Simplified implementation for Edge Runtime compatibility

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  blockDuration: number;
}

interface RateLimitEntry {
  requests: number;
  windowStart: number;
  blockedUntil?: number;
}

interface SecurityEvent {
  id: string;
  timestamp: Date;
  ip: string;
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// Simple EventEmitter implementation for Edge Runtime
class SimpleEventEmitter {
  private events: Record<string, Function[]> = {};

  on(event: string, listener: Function): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  emit(event: string, data?: any): void {
    if (this.events[event]) {
      this.events[event].forEach(listener => listener(data));
    }
  }

  removeListener(event: string, listener: Function): void {
    if (this.events[event]) {
      this.events[event] = this.events[event].filter(l => l !== listener);
    }
  }
}

export class DDoSProtection extends SimpleEventEmitter {
  private config: RateLimitConfig;
  private rateLimitMap = new Map<string, RateLimitEntry>();
  private securityEvents: SecurityEvent[] = [];

  constructor(config: Partial<RateLimitConfig> = {}) {
    super();

    this.config = {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100, // 100 requests per window
      blockDuration: 60 * 60 * 1000, // 1 hour block
      ...config
    };

    this.startCleanup();
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }

  private getClientIdentifier(request: any): string {
    // Get client identifier from IP address
    const forwardedFor = request.headers?.get('x-forwarded-for');
    const realIP = request.headers?.get('x-real-ip');
    const ip = request.ip || forwardedFor?.split(',')[0] || realIP || 'unknown';
    return ip;
  }

  async checkRateLimit(request: any): Promise<{ allowed: boolean; remaining: number; resetTime: number; blocked: boolean }> {
    const clientId = this.getClientIdentifier(request);
    const now = Date.now();

    let entry = this.rateLimitMap.get(clientId);

    if (!entry) {
      entry = {
        requests: 0,
        windowStart: now
      };
      this.rateLimitMap.set(clientId, entry);
    }

    // Check if currently blocked
    if (entry.blockedUntil && now < entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: entry.blockedUntil,
        blocked: true
      };
    }

    // Reset window if expired
    if (now - entry.windowStart > this.config.windowMs) {
      entry.requests = 0;
      entry.windowStart = now;
      entry.blockedUntil = undefined;
    }

    // Increment request count
    entry.requests++;
    const remaining = Math.max(0, this.config.maxRequests - entry.requests);
    const resetTime = entry.windowStart + this.config.windowMs;

    // Check if limit exceeded
    if (entry.requests > this.config.maxRequests) {
      entry.blockedUntil = now + this.config.blockDuration;

      this.logSecurityEvent({
        id: this.generateId(),
        timestamp: new Date(),
        ip: clientId,
        action: 'rate_limit_exceeded',
        severity: 'high'
      });

      this.emit('rate_limit_exceeded', {
        clientId,
        requests: entry.requests,
        maxRequests: this.config.maxRequests,
        blockedUntil: entry.blockedUntil
      });

      return {
        allowed: false,
        remaining: 0,
        resetTime,
        blocked: true
      };
    }

    return {
      allowed: true,
      remaining,
      resetTime,
      blocked: false
    };
  }

  async checkSuspiciousActivity(request: any): Promise<{ suspicious: boolean; score: number; reasons: string[] }> {
    const clientId = this.getClientIdentifier(request);
    const now = Date.now();
    let score = 0;
    const reasons: string[] = [];

    // Check for suspicious patterns
    const userAgent = request.headers?.get('user-agent') || '';
    const referer = request.headers?.get('referer') || '';

    // No user agent
    if (!userAgent) {
      score += 20;
      reasons.push('no_user_agent');
    }

    // Suspicious user agent patterns
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /scanner/i,
      /curl/i,
      /wget/i,
      /python/i,
      /python-requests/i,
      /http/i
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      score += 30;
      reasons.push('suspicious_user_agent');
    }

    // No referer for API requests
    if (!referer && request.url?.includes('/api/')) {
      score += 15;
      reasons.push('no_referer');
    }

    // Check recent activity
    const recentEvents = this.securityEvents.filter(
      event => event.ip === clientId &&
      (now - event.timestamp.getTime()) < 60000 // Last minute
    );

    if (recentEvents.length > 50) {
      score += 25;
      reasons.push('high_frequency_requests');
    }

    // Check for security events
    const securityEvents = recentEvents.filter(
      event => event.severity === 'high' || event.severity === 'critical'
    );

    if (securityEvents.length > 0) {
      score += 40;
      reasons.push('recent_security_events');
    }

    const suspicious = score > 50;

    if (suspicious) {
      this.logSecurityEvent({
        id: this.generateId(),
        timestamp: new Date(),
        ip: clientId,
        action: 'suspicious_activity',
        severity: score > 80 ? 'critical' : 'high'
      });

      this.emit('suspicious_activity', {
        clientId,
        score,
        reasons,
        userAgent
      });
    }

    return {
      suspicious,
      score,
      reasons
    };
  }

  private logSecurityEvent(event: SecurityEvent): void {
    this.securityEvents.push(event);

    // Keep only recent events (last 24 hours)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    this.securityEvents = this.securityEvents.filter(
      event => event.timestamp.getTime() > cutoff
    );
  }

  private startCleanup(): void {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const cutoff = now - (this.config.windowMs + this.config.blockDuration);

      for (const [clientId, entry] of this.rateLimitMap.entries()) {
        if (entry.windowStart < cutoff && (!entry.blockedUntil || entry.blockedUntil < now)) {
          this.rateLimitMap.delete(clientId);
        }
      }
    }, 5 * 60 * 1000);
  }

  getMetrics(): any {
    const now = Date.now();
    const blockedCount = Array.from(this.rateLimitMap.values())
      .filter(entry => entry.blockedUntil && entry.blockedUntil > now)
      .length;

    const recentSecurityEvents = this.securityEvents.filter(
      event => (now - event.timestamp.getTime()) < 60 * 60 * 1000 // Last hour
    );

    return {
      totalEntries: this.rateLimitMap.size,
      blockedIPs: blockedCount,
      recentSecurityEvents: recentSecurityEvents.length,
      config: this.config
    };
  }

  unblockIP(ip: string): void {
    const entry = this.rateLimitMap.get(ip);
    if (entry) {
      entry.blockedUntil = undefined;
      this.emit('ip_unblocked', { ip });
    }
  }

  addCustomRule(rule: {
    name: string;
    condition: (request: any) => boolean;
    action: 'block' | 'warn';
    score: number;
  }): void {
    this.emit('rule_added', rule);
  }

  getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  cleanup(): void {
    this.rateLimitMap.clear();
    this.securityEvents = [];
  }
}

export default DDoSProtection;