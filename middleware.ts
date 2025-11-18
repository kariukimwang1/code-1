import { NextRequest, NextResponse } from 'next/server';
import { SecurityHardening } from './lib/security/security-hardening';
import { ZeroTrustArchitecture } from './lib/security/zero-trust-architecture';
import { DDoSProtection } from './lib/security/ddos-protection';

// Initialize security systems
const security = new SecurityHardening();
const zeroTrust = new ZeroTrustArchitecture(security);
const ddosProtection = new DDoSProtection();

// Middleware configuration
const SECURITY_CONFIG = {
  // Paths that bypass authentication
  publicPaths: [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/auth/forgot-password',
    '/api/public/',
    '/_next/',
    '/favicon.ico',
    '/robots.txt'
  ],

  // Paths requiring admin privileges
  adminPaths: [
    '/api/admin/',
    '/api/system/',
    '/api/security/'
  ],

  // Paths requiring additional verification
  sensitivePaths: [
    '/api/user/delete',
    '/api/wallet/withdraw',
    '/api/kyc/submit',
    '/api/admin/',
    '/api/security/'
  ],

  // Rate limiting configurations
  rateLimits: {
    global: { windowMs: 60 * 1000, maxRequests: 10000 },
    auth: { windowMs: 15 * 60 * 1000, maxRequests: 20 },
    api: { windowMs: 60 * 1000, maxRequests: 1000 },
    sensitive: { windowMs: 60 * 60 * 1000, maxRequests: 100 },
    ip: { windowMs: 60 * 1000, maxRequests: 100 }
  }
};

export async function middleware(request: NextRequest) {
  try {
    const startTime = Date.now();
    const { pathname } = new URL(request.url);

    // Skip middleware for static assets and public paths
    if (shouldSkipMiddleware(pathname)) {
      return NextResponse.next();
    }

    // Extract request information
    const requestInfo = extractRequestInfo(request);

    // Apply DDoS protection first
    const ddosResult = await ddosProtection.detectAndMitigateDDoS(requestInfo);
    if (!ddosResult.allowed) {
      return createBlockedResponse('DDoS protection activated', ddosResult);
    }

    // Apply rate limiting
    const rateLimitResult = await applyRateLimiting(requestInfo, pathname);
    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult);
    }

    // Apply security validation
    const validationResult = validateSecurity(request, requestInfo);
    if (!validationResult.valid) {
      return createSecurityResponse(validationResult);
    }

    // Apply zero-trust evaluation for protected endpoints
    const zeroTrustResult = await applyZeroTrust(request, requestInfo, pathname);
    if (!zeroTrustResult.allowed) {
      return createZeroTrustResponse(zeroTrustResult);
    }

    // Create response and apply security headers
    const response = NextResponse.next();
    applySecurityHeaders(response, requestInfo);

    // Log the request
    logRequest(requestInfo, response, startTime);

    return response;

  } catch (error) {
    console.error('Middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function shouldSkipMiddleware(pathname: string): boolean {
  // Skip Next.js internals and static files
  if (pathname.startsWith('/_next/') ||
      pathname.startsWith('/static/') ||
      pathname.includes('.')) {
    return true;
  }

  // Check public paths
  return SECURITY_CONFIG.publicPaths.some(path => pathname.startsWith(path));
}

function extractRequestInfo(request: NextRequest) {
  const url = new URL(request.url);

  return {
    method: request.method,
    url: request.url,
    pathname: url.pathname,
    search: url.search,
    userAgent: request.headers.get('user-agent') || 'unknown',
    ipAddress: getClientIP(request),
    origin: request.headers.get('origin') || '',
    referer: request.headers.get('referer') || '',
    contentType: request.headers.get('content-type') || '',
    authorization: request.headers.get('authorization') || '',
    timestamp: new Date(),
    cookies: parseCookies(request.headers.get('cookie') || ''),
    headers: Object.fromEntries(request.headers.entries())
  };
}

async function applyRateLimiting(requestInfo: any, pathname: string) {
  // Determine rate limit type based on path
  let rateLimitType = 'global';

  if (pathname.includes('/auth/')) rateLimitType = 'auth';
  else if (pathname.startsWith('/api/')) rateLimitType = 'api';
  else if (SECURITY_CONFIG.sensitivePaths.some(path => pathname.startsWith(path))) {
    rateLimitType = 'sensitive';
  }

  // Apply per-IP rate limiting
  const ipKey = `ip:${requestInfo.ipAddress}`;
  const ipResult = await ddosProtection.checkRateLimit(
    ipKey,
    'ip',
    requestInfo
  );

  // Apply endpoint-specific rate limiting
  const endpointKey = `endpoint:${pathname}`;
  const endpointResult = await ddosProtection.checkRateLimit(
    endpointKey,
    rateLimitType,
    requestInfo
  );

  return {
    allowed: ipResult.allowed && endpointResult.allowed,
    ipResult,
    endpointResult,
    retryAfter: Math.max(
      ipResult.blocked ? Math.ceil((ipResult.resetTime.getTime() - Date.now()) / 1000) : 0,
      endpointResult.blocked ? Math.ceil((endpointResult.resetTime.getTime() - Date.now()) / 1000) : 0
    )
  };
}

function validateSecurity(request: NextRequest, requestInfo: any) {
  const errors: string[] = [];

  // Validate method
  const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
  if (!allowedMethods.includes(requestInfo.method)) {
    errors.push('Invalid HTTP method');
  }

  // Validate URL length
  if (requestInfo.url.length > 2048) {
    errors.push('URL too long');
  }

  // Validate user agent
  if (!requestInfo.userAgent || requestInfo.userAgent.length < 10) {
    errors.push('Invalid user agent');
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /vbscript:/i,
    /onload=/i,
    /onerror=/i,
    /eval\s*\(/i,
    /expression\s*\(/i
  ];

  const urlAndParams = requestInfo.url + requestInfo.search;
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(urlAndParams)) {
      errors.push('Suspicious content detected');
      break;
    }
  }

  // Validate headers
  if (requestInfo.headers['host'] && !isValidHost(requestInfo.headers['host'])) {
    errors.push('Invalid host header');
  }

  return {
    valid: errors.length === 0,
    errors,
    blocked: errors.length > 0
  };
}

async function applyZeroTrust(request: NextRequest, requestInfo: any, pathname: string) {
  // Skip zero-trust for public endpoints
  if (SECURITY_CONFIG.publicPaths.some(path => pathname.startsWith(path))) {
    return { allowed: true };
  }

  try {
    const context = {
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      deviceId: request.headers.get('x-device-id') || 'unknown',
      location: await getGeoLocation(requestInfo.ipAddress),
      time: new Date(),
      sessionId: request.headers.get('x-session-id') || 'unknown',
      previousActivities: [], // Would fetch from session
      deviceFingerprint: generateDeviceFingerprint(requestInfo)
    };

    const userId = extractUserIdFromRequest(request);
    const resource = pathname;
    const action = requestInfo.method.toLowerCase();

    if (userId) {
      const accessRequest = await zeroTrust.evaluateAccessRequest(
        userId,
        resource,
        action,
        context
      );

      return {
        allowed: accessRequest.status === 'approved',
        reason: accessRequest.decision.reason,
        requirements: accessRequest.decision.requirements,
        riskLevel: accessRequest.decision.riskLevel
      };
    } else {
      // For unauthenticated requests, apply basic checks
      return {
        allowed: !SECURITY_CONFIG.adminPaths.some(path => pathname.startsWith(path)),
        reason: !SECURITY_CONFIG.adminPaths.some(path => pathname.startsWith(path)) ?
               'Public endpoint' : 'Authentication required'
      };
    }

  } catch (error) {
    console.error('Zero-trust evaluation error:', error);
    return { allowed: false, reason: 'Security evaluation failed' };
  }
}

function applySecurityHeaders(response: NextResponse, requestInfo: any) {
  const headers = {
    // Security headers
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Content-Security-Policy': buildCSPHeader(),

    // Rate limiting headers
    'X-RateLimit-Limit': '1000',
    'X-RateLimit-Remaining': '999',
    'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + 3600).toString(),

    // Security context
    'X-Request-ID': crypto.randomUUID(),
    'X-Content-Security-Policy': 'default-src \'self\''
  };

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  // Apply DDoS protection headers if applicable
  const ddosHeaders = getDDoSHeaders(requestInfo.ipAddress);
  for (const [key, value] of Object.entries(ddosHeaders)) {
    response.headers.set(key, value);
  }
}

function createBlockedResponse(reason: string, ddosResult: any) {
  const response = NextResponse.json(
    {
      error: 'Access blocked',
      reason: ddosResult.reason || reason,
      type: 'ddos_protection'
    },
    { status: 429 }
  );

  if (ddosResult.responseHeaders) {
    for (const [key, value] of Object.entries(ddosResult.responseHeaders)) {
      response.headers.set(key, value as string);
    }
  }

  return response;
}

function createRateLimitResponse(rateLimitResult: any) {
  const response = NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later',
      retryAfter: rateLimitResult.retryAfter
    },
    { status: 429 }
  );

  response.headers.set('Retry-After', rateLimitResult.retryAfter.toString());
  response.headers.set('X-RateLimit-Limit', rateLimitResult.endpointResult.maxRequests.toString());
  response.headers.set('X-RateLimit-Remaining', Math.max(0, rateLimitResult.endpointResult.remaining).toString());
  response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.endpointResult.resetTime.getTime() / 1000).toString());

  return response;
}

function createSecurityResponse(validationResult: any) {
  return NextResponse.json(
    {
      error: 'Security validation failed',
      details: validationResult.errors
    },
    { status: 400 }
  );
}

function createZeroTrustResponse(zeroTrustResult: any) {
  return NextResponse.json(
    {
      error: 'Access denied',
      reason: zeroTrustResult.reason,
      requirements: zeroTrustResult.requirements,
      riskLevel: zeroTrustResult.riskLevel
    },
    { status: 403 }
  );
}

function logRequest(requestInfo: any, response: NextResponse, startTime: number) {
  const duration = Date.now() - startTime;
  const statusCode = response.status;

  // Log to security system
  security.logSecurityEvent('api_request', {
    method: requestInfo.method,
    url: requestInfo.url,
    statusCode,
    duration,
    ipAddress: requestInfo.ipAddress,
    userAgent: requestInfo.userAgent
  }, statusCode >= 400 ? 'medium' : 'low');
}

// Helper functions
function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for') ||
         request.headers.get('x-real-ip') ||
         request.headers.get('cf-connecting-ip') ||
         request.ip ||
         '127.0.0.1';
}

function parseCookies(cookieHeader: string): Record<string, string> {
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

function isValidHost(host: string): boolean {
  // Allow localhost and development domains
  const allowedHosts = [
    'localhost',
    '127.0.0.1',
    process.env.DOMAIN_NAME,
    process.env.FRONTEND_URL
  ].filter(Boolean);

  return allowedHosts.some(allowed => host.includes(allowed));
}

function buildCSPHeader(): string {
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

async function getGeoLocation(ipAddress: string): Promise<any> {
  // In a real implementation, use a geoIP service
  return {
    country: 'US',
    region: 'CA',
    city: 'San Francisco',
    coordinates: [-122.4194, 37.7749]
  };
}

function generateDeviceFingerprint(requestInfo: any): string {
  const data = [
    requestInfo.userAgent,
    requestInfo.ipAddress,
    requestInfo.headers['accept-language'],
    requestInfo.headers['accept-encoding']
  ].join('|');

  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

function extractUserIdFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId || payload.sub || null;
  } catch {
    return null;
  }
}

function getDDoSHeaders(ipAddress: string): Record<string, string> {
  const headers: Record<string, string> = {};

  const mitigation = ddosProtection.getMitigationStatus(ipAddress);
  if (mitigation) {
    headers['X-DDoS-Mitigation'] = mitigation.level;
    headers['X-DDoS-Mitigation-Expires'] = mitigation.expires.toISOString();
  }

  return headers;
}

// Export for testing and configuration
export { security, zeroTrust, ddosProtection, SECURITY_CONFIG };