import { NextRequest, NextResponse } from 'next/server';
import { SecurityHardening } from '../security/security-hardening';
import { ZeroTrustArchitecture } from '../security/zero-trust-architecture';

interface SecurityMiddlewareConfig {
  enableCSRFProtection: boolean;
  enableRateLimiting: boolean;
  enableInputValidation: boolean;
  enableSecurityHeaders: boolean;
  enableAuditLogging: boolean;
  enableZeroTrust: boolean;
  trustedOrigins: string[];
  rateLimits: {
    [key: string]: {
      windowMs: number;
      maxRequests: number;
      skipSuccessfulRequests?: boolean;
    };
  };
}

export class SecurityMiddleware {
  private security: SecurityHardening;
  private zeroTrust: ZeroTrustArchitecture;
  private config: SecurityMiddlewareConfig;
  private csrfTokens = new Map<string, { token: string; expires: Date }>();
  private rateLimitStore = new Map<string, { count: number; resetTime: Date; blocked: boolean }>();

  constructor(
    security: SecurityHardening,
    zeroTrust: ZeroTrustArchitecture,
    config: Partial<SecurityMiddlewareConfig> = {}
  ) {
    this.security = security;
    this.zeroTrust = zeroTrust;
    this.config = {
      enableCSRFProtection: true,
      enableRateLimiting: true,
      enableInputValidation: true,
      enableSecurityHeaders: true,
      enableAuditLogging: true,
      enableZeroTrust: true,
      trustedOrigins: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'https://yourdomain.com'
      ],
      rateLimits: {
        'global': { windowMs: 15 * 60 * 1000, maxRequests: 100 },
        'auth': { windowMs: 15 * 60 * 1000, maxRequests: 5 },
        'sensitive': { windowMs: 60 * 60 * 1000, maxRequests: 10 },
        'api': { windowMs: 15 * 60 * 1000, maxRequests: 1000 }
      },
      ...config
    };
  }

  // Main middleware function
  async handleRequest(request: NextRequest, handler: (req: NextRequest) => Promise<NextResponse>): Promise<NextResponse> {
    try {
      const startTime = Date.now();
      const requestId = crypto.randomUUID();

      // Extract request information
      const requestInfo = this.extractRequestInfo(request, requestId);

      // Apply security layers in order
      const securityResults = await this.applySecurityLayers(request, requestInfo);

      // Check if request should be blocked
      if (securityResults.blocked) {
        return this.createSecurityResponse(securityResults.reason!, securityResults.statusCode!, requestInfo);
      }

      // Execute the original handler
      const response = await handler(request);

      // Apply response security headers
      this.applyResponseSecurityHeaders(response, requestInfo);

      // Log the request completion
      this.logRequestCompletion(requestInfo, response, startTime);

      return response;

    } catch (error) {
      console.error('Security middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  private extractRequestInfo(request: NextRequest, requestId: string) {
    const url = new URL(request.url);

    return {
      requestId,
      method: request.method,
      url: request.url,
      pathname: url.pathname,
      search: url.search,
      userAgent: request.headers.get('user-agent') || 'unknown',
      ipAddress: this.getClientIP(request),
      origin: request.headers.get('origin') || '',
      referer: request.headers.get('referer') || '',
      contentType: request.headers.get('content-type') || '',
      authorization: request.headers.get('authorization') || '',
      timestamp: new Date(),
      cookies: this.parseCookies(request.headers.get('cookie') || ''),
      headers: this.sanitizeHeaders(Object.fromEntries(request.headers.entries()))
    };
  }

  private async applySecurityLayers(request: NextRequest, requestInfo: any): Promise<{ blocked: boolean; reason?: string; statusCode?: number }> {
    // Layer 1: Basic security validation
    if (!this.validateBasicSecurity(request, requestInfo)) {
      return { blocked: true, reason: 'Basic security validation failed', statusCode: 400 };
    }

    // Layer 2: Rate limiting
    if (this.config.enableRateLimiting && !this.checkRateLimit(requestInfo)) {
      return { blocked: true, reason: 'Rate limit exceeded', statusCode: 429 };
    }

    // Layer 3: CSRF protection (for state-changing requests)
    if (this.config.enableCSRFProtection && this.isStateChangingRequest(request)) {
      const csrfResult = this.validateCSRF(request, requestInfo);
      if (!csrfResult.valid) {
        return { blocked: true, reason: csrfResult.reason || 'CSRF validation failed', statusCode: 403 };
      }
    }

    // Layer 4: Input validation
    if (this.config.enableInputValidation) {
      const validationResult = this.validateRequestInput(request, requestInfo);
      if (!validationResult.valid) {
        return { blocked: true, reason: validationResult.reason || 'Input validation failed', statusCode: 400 };
      }
    }

    // Layer 5: Zero-trust evaluation
    if (this.config.enableZeroTrust && this.isProtectedEndpoint(requestInfo.pathname)) {
      const zeroTrustResult = await this.evaluateZeroTrust(request, requestInfo);
      if (!zeroTrustResult.allowed) {
        return { blocked: true, reason: zeroTrustResult.reason || 'Access denied by zero-trust policy', statusCode: 403 };
      }
    }

    // Layer 6: Security scanning
    const securityScanResult = this.performSecurityScan(request, requestInfo);
    if (securityScanResult.threats.length > 0) {
      this.handleSecurityThreats(securityScanResult.threats, requestInfo);
      if (securityScanResult.blocked) {
        return { blocked: true, reason: 'Security threats detected', statusCode: 403 };
      }
    }

    return { blocked: false };
  }

  private validateBasicSecurity(request: NextRequest, requestInfo: any): boolean {
    // Check for required headers
    if (!requestInfo.userAgent || requestInfo.userAgent.length < 10) {
      return false;
    }

    // Check for HTTP method validation
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!allowedMethods.includes(requestInfo.method)) {
      return false;
    }

    // Check URL length
    if (requestInfo.url.length > 2048) {
      return false;
    }

    // Check header size
    const headerSize = JSON.stringify(requestInfo.headers).length;
    if (headerSize > 8192) { // 8KB
      return false;
    }

    return true;
  }

  private checkRateLimit(requestInfo: any): boolean {
    const endpointType = this.getEndpointType(requestInfo.pathname);
    const rateLimit = this.config.rateLimits[endpointType] || this.config.rateLimits['global'];

    const key = `${requestInfo.ipAddress}:${endpointType}`;
    const now = Date.now();
    const existing = this.rateLimitStore.get(key);

    if (!existing) {
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: new Date(now + rateLimit.windowMs),
        blocked: false
      });
      return true;
    }

    if (existing.blocked && existing.resetTime > new Date(now)) {
      return false;
    }

    if (existing.resetTime <= new Date(now)) {
      // Reset the counter
      this.rateLimitStore.set(key, {
        count: 1,
        resetTime: new Date(now + rateLimit.windowMs),
        blocked: false
      });
      return true;
    }

    existing.count++;

    if (existing.count > rateLimit.maxRequests) {
      existing.blocked = true;

      // Log rate limit violation
      this.security.logSecurityEvent('rate_limit_exceeded', {
        ipAddress: requestInfo.ipAddress,
        endpoint: requestInfo.pathname,
        count: existing.count,
        limit: rateLimit.maxRequests
      }, 'medium');

      return false;
    }

    return true;
  }

  private getEndpointType(pathname: string): string {
    if (pathname.includes('/auth/')) return 'auth';
    if (pathname.includes('/admin/')) return 'sensitive';
    if (pathname.startsWith('/api/')) return 'api';
    return 'global';
  }

  private validateCSRF(request: NextRequest, requestInfo: any): { valid: boolean; reason?: string } {
    // Skip CSRF for GET, HEAD, OPTIONS requests
    if (['GET', 'HEAD', 'OPTIONS'].includes(requestInfo.method)) {
      return { valid: true };
    }

    // Check Origin header
    if (requestInfo.origin && !this.config.trustedOrigins.includes(requestInfo.origin)) {
      return { valid: false, reason: 'Untrusted origin' };
    }

    // Check Referer header
    if (requestInfo.referer && !this.isTrustedReferer(requestInfo.referer)) {
      return { valid: false, reason: 'Untrusted referer' };
    }

    // Check CSRF token for API requests
    if (requestInfo.pathname.startsWith('/api/')) {
      const csrfToken = request.headers.get('x-csrf-token') || requestInfo.cookies.csrf_token;

      if (!csrfToken) {
        return { valid: false, reason: 'Missing CSRF token' };
      }

      if (!this.validateCSRFToken(csrfToken, requestInfo)) {
        return { valid: false, reason: 'Invalid CSRF token' };
      }
    }

    return { valid: true };
  }

  private isTrustedReferer(referer: string): boolean {
    try {
      const refererUrl = new URL(referer);
      return this.config.trustedOrigins.some(origin => {
        const originUrl = new URL(origin);
        return refererUrl.origin === originUrl.origin;
      });
    } catch {
      return false;
    }
  }

  private validateCSRFToken(token: string, requestInfo: any): boolean {
    // In a real implementation, validate against stored token
    // For now, just check format
    return token.length === 32 && /^[a-zA-Z0-9]+$/.test(token);
  }

  private isStateChangingRequest(request: NextRequest): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);
  }

  private validateRequestInput(request: NextRequest, requestInfo: any): { valid: boolean; reason?: string } {
    // Validate URL parameters
    const url = new URL(request.url);
    for (const [key, value] of url.searchParams) {
      const validation = this.security.validateInput(value, this.getInputType(key));
      if (!validation.valid) {
        return { valid: false, reason: `Invalid parameter: ${key} - ${validation.errors.join(', ')}` };
      }
    }

    // Validate request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(requestInfo.method)) {
      try {
        const contentType = requestInfo.contentType;

        if (contentType?.includes('application/json')) {
          // Would need to clone request to read body in Next.js middleware
          // For now, skip body validation
        } else if (contentType?.includes('application/x-www-form-urlencoded')) {
          // Validate form data
          const formData = requestInfo.search; // Simplified
          const params = new URLSearchParams(formData);
          for (const [key, value] of params) {
            const validation = this.security.validateInput(value, this.getInputType(key));
            if (!validation.valid) {
              return { valid: false, reason: `Invalid form field: ${key}` };
            }
          }
        }
      } catch (error) {
        return { valid: false, reason: 'Invalid request body' };
      }
    }

    return { valid: true };
  }

  private getInputType(key: string): 'email' | 'username' | 'text' | 'number' | 'json' {
    if (key.includes('email')) return 'email';
    if (key.includes('password') || key.includes('username')) return 'username';
    if (key.includes('amount') || key.includes('count')) return 'number';
    if (key.includes('data') || key.includes('config')) return 'json';
    return 'text';
  }

  private isProtectedEndpoint(pathname: string): boolean {
    const protectedPatterns = [
      '/api/admin/',
      '/api/user/',
      '/api/wallet/',
      '/api/mining/',
      '/api/kyc/',
      '/api/withdrawals/'
    ];

    return protectedPatterns.some(pattern => pathname.includes(pattern));
  }

  private async evaluateZeroTrust(request: NextRequest, requestInfo: any): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Extract user info from JWT
      const userId = this.extractUserIdFromRequest(request);

      if (!userId) {
        // Allow unauthenticated access to public endpoints
        const publicEndpoints = ['/api/auth/', '/api/public/'];
        const isPublic = publicEndpoints.some(endpoint => requestInfo.pathname.startsWith(endpoint));

        if (!isPublic) {
          return { allowed: false, reason: 'Authentication required' };
        }

        return { allowed: true };
      }

      // Create request context for zero-trust evaluation
      const context = {
        ipAddress: requestInfo.ipAddress,
        userAgent: requestInfo.userAgent,
        deviceId: this.extractDeviceId(request),
        time: new Date(),
        sessionId: this.extractSessionId(request),
        previousActivities: [], // Would fetch from user session
        deviceFingerprint: this.generateDeviceFingerprint(requestInfo)
      };

      const accessRequest = await this.zeroTrust.evaluateAccessRequest(
        userId,
        requestInfo.pathname,
        requestInfo.method.toLowerCase(),
        context
      );

      return {
        allowed: accessRequest.status === 'approved',
        reason: accessRequest.decision.reason
      };

    } catch (error) {
      console.error('Zero-trust evaluation error:', error);
      return { allowed: false, reason: 'Security evaluation failed' };
    }
  }

  private performSecurityScan(request: NextRequest, requestInfo: any): { threats: string[]; blocked: boolean } {
    const threats: string[] = [];

    // SQL Injection detection
    if (this.detectSQLInjection(requestInfo.url) || this.detectSQLInjection(requestInfo.search)) {
      threats.push('sql_injection');
    }

    // XSS detection
    if (this.detectXSS(requestInfo.url) || this.detectXSS(requestInfo.search)) {
      threats.push('xss');
    }

    // Path traversal detection
    if (this.detectPathTraversal(requestInfo.pathname)) {
      threats.push('path_traversal');
    }

    // Command injection detection
    if (this.detectCommandInjection(requestInfo.url) || this.detectCommandInjection(requestInfo.search)) {
      threats.push('command_injection');
    }

    // Suspicious user agent
    if (this.isSuspiciousUserAgent(requestInfo.userAgent)) {
      threats.push('suspicious_user_agent');
    }

    // Check for common attack patterns
    if (this.hasAttackPatterns(requestInfo)) {
      threats.push('attack_patterns');
    }

    const blocked = threats.some(threat =>
      ['sql_injection', 'xss', 'command_injection', 'path_traversal'].includes(threat)
    );

    return { threats, blocked };
  }

  private detectSQLInjection(input: string): boolean {
    const patterns = [
      /(\%27)|(\')|(\-\-)|(\%23)|(#)/i,
      /((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i,
      /\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i,
      /union.*select/i,
      /select.*from/i,
      /insert.*into/i,
      /delete.*from/i,
      /update.*set/i,
      /drop.*table/i
    ];

    return patterns.some(pattern => pattern.test(input));
  }

  private detectXSS(input: string): boolean {
    const patterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /<link[^>]*>/gi,
      /<meta[^>]*>/gi,
      /expression\s*\(/gi,
      /@import/i,
      /binding\s*:/gi
    ];

    return patterns.some(pattern => pattern.test(input));
  }

  private detectPathTraversal(path: string): boolean {
    const patterns = [
      /\.\.\//,
      /\.\.\\/,
      /\.%2e%2e/,
      /\.%2e\//,
      /%2e%2e/,
      /\.\.%2f/,
      /\.\.%5c/,
      /\/etc\/passwd/i,
      /\/windows\/system32/i
    ];

    return patterns.some(pattern => pattern.test(path));
  }

  private detectCommandInjection(input: string): boolean {
    const patterns = [
      /[;&|`$(){}[\]]/,
      /\/bin\/sh/i,
      /cmd\.exe/i,
      /powershell/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /system\s*\(/i,
      /passthru\s*\(/i,
      /shell_exec\s*\(/i
    ];

    return patterns.some(pattern => pattern.test(input));
  }

  private isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /^$/,
      /bot/i,
      /crawler/i,
      /scanner/i,
      /sqlmap/i,
      /nmap/i,
      /curl/i,
      /wget/i,
      /python-requests/i,
      /mozilla\/4\.0/i, // Very old browsers
      /curl\//i,
      /wget\//i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(userAgent));
  }

  private hasAttackPatterns(requestInfo: any): boolean {
    // Check for common attack patterns in headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip', 'x-originating-ip'];

    for (const header of suspiciousHeaders) {
      const value = requestInfo.headers[header];
      if (value && this.detectSQLInjection(value)) {
        return true;
      }
    }

    return false;
  }

  private handleSecurityThreats(threats: string[], requestInfo: any): void {
    this.security.logSecurityEvent('security_threat_detected', {
      threats,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      url: requestInfo.url,
      method: requestInfo.method
    }, 'high');

    // Emit for real-time monitoring
    this.security.emit('security_threat', {
      threats,
      requestInfo,
      timestamp: new Date()
    });
  }

  private applyResponseSecurityHeaders(response: NextResponse, requestInfo: any): void {
    if (!this.config.enableSecurityHeaders) return;

    const headers = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': this.buildCSPHeader(),
      'X-Request-ID': requestInfo.requestId
    };

    for (const [key, value] of Object.entries(headers)) {
      response.headers.set(key, value);
    }
  }

  private buildCSPHeader(): string {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  private logRequestCompletion(requestInfo: any, response: NextResponse, startTime: number): void {
    if (!this.config.enableAuditLogging) return;

    const duration = Date.now() - startTime;
    const statusCode = response.status;

    this.security.logSecurityEvent('request_completed', {
      requestId: requestInfo.requestId,
      method: requestInfo.method,
      url: requestInfo.url,
      statusCode,
      duration,
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent
    }, statusCode >= 400 ? 'medium' : 'low');
  }

  private createSecurityResponse(reason: string, statusCode: number, requestInfo: any): NextResponse {
    const response = NextResponse.json(
      {
        error: 'Access denied',
        reason,
        requestId: requestInfo.requestId
      },
      { status: statusCode }
    );

    // Apply security headers even to error responses
    this.applyResponseSecurityHeaders(response, requestInfo);

    return response;
  }

  // Helper methods
  private getClientIP(request: NextRequest): string {
    return request.headers.get('x-forwarded-for') ||
           request.headers.get('x-real-ip') ||
           request.headers.get('cf-connecting-ip') ||
           '127.0.0.1';
  }

  private parseCookies(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {};

    if (!cookieHeader) return cookies;

    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        cookies[name] = decodeURIComponent(value);
      }
    });

    return cookies;
  }

  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const [key, value] of Object.entries(headers)) {
      if (sensitiveHeaders.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private extractUserIdFromRequest(request: NextRequest): string | null {
    // Extract user ID from JWT token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    try {
      const token = authHeader.substring(7);
      // In a real implementation, verify and decode JWT
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId || payload.sub || null;
    } catch {
      return null;
    }
  }

  private extractDeviceId(request: NextRequest): string {
    return request.headers.get('x-device-id') ||
           request.headers.get('device-id') ||
           'unknown';
  }

  private extractSessionId(request: NextRequest): string {
    return request.headers.get('x-session-id') ||
           request.headers.get('session-id') ||
           'unknown';
  }

  private generateDeviceFingerprint(requestInfo: any): string {
    const data = [
      requestInfo.userAgent,
      requestInfo.ipAddress,
      request.headers['accept-language'],
      request.headers['accept-encoding']
    ].join('|');

    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
  }

  // Public API methods
  generateCSRFToken(): string {
    const token = crypto.randomBytes(16).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    this.csrfTokens.set(token, { token, expires });

    return token;
  }

  validateCSRFTokenEndpoint(token: string): boolean {
    const stored = this.csrfTokens.get(token);
    if (!stored) return false;

    if (stored.expires < new Date()) {
      this.csrfTokens.delete(token);
      return false;
    }

    return true;
  }

  clearExpiredCSRFTokens(): void {
    for (const [token, data] of this.csrfTokens.entries()) {
      if (data.expires < new Date()) {
        this.csrfTokens.delete(token);
      }
    }
  }

  updateConfig(updates: Partial<SecurityMiddlewareConfig>): void {
    Object.assign(this.config, updates);
  }

  getMetrics(): any {
    return {
      csrfTokensActive: this.csrfTokens.size,
      rateLimitEntries: this.rateLimitStore.size,
      config: this.config
    };
  }
}