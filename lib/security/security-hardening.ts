// Browser-compatible security hardening class
// Note: This is a simplified version for Next.js Edge Runtime compatibility
// In production, use proper server-side crypto implementation

interface SecurityConfig {
  encryptionKey: string;
  hmacKey: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
  passwordRequirements: {
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    preventCommonPasswords: boolean;
    maxPasswordAge: number;
  };
  jwtSecret: string;
  jwtExpirationTime: string;
  refreshTokenExpirationTime: string;
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    blockDuration: number;
  };
  encryption: {
    algorithm: string;
    keySize: number;
    ivSize: number;
    tagSize: number;
  };
  audit: {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    retentionDays: number;
    encryptLogs: boolean;
  };
}

interface SecurityContext {
  userId: string;
  sessionId: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  permissions: string[];
  riskScore: number;
}

interface AuditLog {
  id: string;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  action: string;
  resource: string;
  outcome: 'success' | 'failure' | 'blocked';
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  encrypted: boolean;
}

interface SecurityIncident {
  id: string;
  type: 'brute_force' | 'injection' | 'xss' | 'csrf' | 'data_breach' | 'privilege_escalation' | 'anomaly';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affectedUsers: string[];
  affectedResources: string[];
  detectedAt: Date;
  resolvedAt?: Date;
  status: 'open' | 'investigating' | 'contained' | 'resolved' | 'false_positive';
  actions: Array<{
    type: string;
    description: string;
    timestamp: Date;
    automated: boolean;
  }>;
  evidence: Record<string, any>;
}

export class SecurityHardening extends EventEmitter {
  private config: SecurityConfig;
  private securityContexts = new Map<string, SecurityContext>();
  private auditLogs: AuditLog[] = [];
  private securityIncidents: SecurityIncident[] = [];
  private blockedIPs = new Map<string, { until: Date; reason: string }>();
  private suspiciousPatterns = new Map<string, number>();
  private sessionStore = new Map<string, { userId: string; expires: Date; lastActivity: Date }>();

  constructor(config: Partial<SecurityConfig> = {}) {
    super();

    this.config = {
      encryptionKey: process.env.ENCRYPTION_KEY || this.generateSecureKey(),
      hmacKey: process.env.HMAC_KEY || this.generateSecureKey(),
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      maxLoginAttempts: 5,
      passwordMinLength: 12,
      passwordRequirements: {
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSymbols: true,
        preventCommonPasswords: true,
        maxPasswordAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      },
      jwtSecret: process.env.JWT_SECRET || this.generateSecureKey(),
      jwtExpirationTime: '15m',
      refreshTokenExpirationTime: '7d',
      rateLimiting: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 100,
        blockDuration: 60 * 60 * 1000, // 1 hour
      },
      encryption: {
        algorithm: 'aes-256-gcm',
        keySize: 32,
        ivSize: 16,
        tagSize: 16,
      },
      audit: {
        enabled: true,
        logLevel: 'info',
        retentionDays: 365,
        encryptLogs: true,
      },
      ...config
    };

    this.initializeSecurityMonitoring();
  }

  private generateSecureKey(): string {
    return randomBytes(32).toString('hex');
  }

  private initializeSecurityMonitoring(): void {
    // Start periodic security checks
    setInterval(() => {
      this.performSecurityChecks();
    }, 60 * 1000); // Every minute

    // Start cleanup of expired data
    setInterval(() => {
      this.cleanupExpiredData();
    }, 60 * 60 * 1000); // Every hour

    // Start real-time monitoring
    this.startRealTimeMonitoring();
  }

  private startRealTimeMonitoring(): void {
    // Monitor for security events in real-time
    this.on('suspicious_activity', this.handleSuspiciousActivity.bind(this));
    this.on('security_breach', this.handleSecurityBreach.bind(this));
    this.on('policy_violation', this.handlePolicyViolation.bind(this));
  }

  // Password Security
  validatePassword(password: string, userId?: string): { valid: boolean; errors: string[]; strength: number } {
    const errors: string[] = [];
    let strength = 0;

    // Length validation
    if (password.length < this.config.passwordMinLength) {
      errors.push(`Password must be at least ${this.config.passwordMinLength} characters long`);
    } else {
      strength += 20;
    }

    // Character requirements
    if (this.config.passwordRequirements.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else if (/[A-Z]/.test(password)) {
      strength += 15;
    }

    if (this.config.passwordRequirements.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else if (/[a-z]/.test(password)) {
      strength += 15;
    }

    if (this.config.passwordRequirements.requireNumbers && !/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else if (/\d/.test(password)) {
      strength += 15;
    }

    if (this.config.passwordRequirements.requireSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      strength += 15;
    }

    // Common password check
    if (this.config.passwordRequirements.preventCommonPasswords && this.isCommonPassword(password)) {
      errors.push('Password is too common. Please choose a more secure password');
    } else {
      strength += 10;
    }

    // Entropy calculation
    const entropy = this.calculatePasswordEntropy(password);
    if (entropy > 60) {
      strength += 10;
    }

    // Check against user data
    if (userId && this.containsUserData(password, userId)) {
      errors.push('Password cannot contain your personal information');
      strength = Math.max(0, strength - 30);
    }

    return {
      valid: errors.length === 0,
      errors,
      strength: Math.min(100, strength)
    };
  }

  private isCommonPassword(password: string): boolean {
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123',
      'password123', 'admin', 'letmein', 'welcome', 'monkey',
      '1234567890', 'password1', 'qwerty123', 'password!'
    ];

    return commonPasswords.includes(password.toLowerCase()) ||
           commonPasswords.some(common => password.toLowerCase().includes(common));
  }

  private containsUserData(password: string, userId: string): boolean {
    // In a real implementation, check against user's personal data
    // For now, just check against userId
    return password.toLowerCase().includes(userId.toLowerCase());
  }

  private calculatePasswordEntropy(password: string): number {
    const charsetSize = this.getCharsetSize(password);
    return Math.log2(Math.pow(charsetSize, password.length));
  }

  private getCharsetSize(password: string): number {
    let size = 0;
    if (/[a-z]/.test(password)) size += 26;
    if (/[A-Z]/.test(password)) size += 26;
    if (/\d/.test(password)) size += 10;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) size += 32;
    return size || 1;
  }

  // Encryption and Decryption
  encryptSensitiveData(data: string, additionalData?: string): { encrypted: string; iv: string; tag: string } {
    const iv = randomBytes(this.config.encryption.ivSize);
    const cipher = createCipheriv(
      this.config.encryption.algorithm,
      Buffer.from(this.config.encryptionKey, 'hex'),
      iv
    );

    if (additionalData) {
      cipher.setAAD(Buffer.from(additionalData));
    }

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  decryptSensitiveData(encryptedData: string, iv: string, tag: string, additionalData?: string): string {
    const decipher = createDecipheriv(
      this.config.encryption.algorithm,
      Buffer.from(this.config.encryptionKey, 'hex'),
      Buffer.from(iv, 'hex')
    );

    decipher.setAuthTag(Buffer.from(tag, 'hex'));

    if (additionalData) {
      decipher.setAAD(Buffer.from(additionalData));
    }

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  // Hashing
  createSecureHash(data: string, salt?: string): { hash: string; salt: string } {
    const dataSalt = salt || randomBytes(16).toString('hex');
    const hash = createHash('sha256')
      .update(data + dataSalt)
      .digest('hex');

    return { hash, salt: dataSalt };
  }

  verifyHash(data: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.createSecureHash(data, salt);
    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(computedHash));
  }

  createHMAC(data: string): string {
    return createHmac('sha256', this.config.hmacKey)
      .update(data)
      .digest('hex');
  }

  verifyHMAC(data: string, signature: string): boolean {
    const computedSignature = this.createHMAC(data);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(computedSignature, 'hex')
    );
  }

  // Security Context Management
  createSecurityContext(
    userId: string,
    sessionId: string,
    ipAddress: string,
    userAgent: string,
    permissions: string[] = []
  ): SecurityContext {
    const riskScore = this.calculateRiskScore(userId, ipAddress, userAgent);

    const context: SecurityContext = {
      userId,
      sessionId,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      permissions,
      riskScore
    };

    this.securityContexts.set(sessionId, context);

    // Store session
    this.sessionStore.set(sessionId, {
      userId,
      expires: new Date(Date.now() + this.config.sessionTimeout),
      lastActivity: new Date()
    });

    this.logSecurityEvent('session_created', {
      userId,
      sessionId,
      ipAddress,
      riskScore
    });

    return context;
  }

  validateSecurityContext(sessionId: string, ipAddress?: string): boolean {
    const context = this.securityContexts.get(sessionId);
    if (!context) {
      return false;
    }

    // Check session timeout
    const session = this.sessionStore.get(sessionId);
    if (!session || session.expires < new Date()) {
      this.securityContexts.delete(sessionId);
      this.sessionStore.delete(sessionId);
      return false;
    }

    // Check IP address consistency (optional, for high-security apps)
    if (ipAddress && ipAddress !== context.ipAddress) {
      this.logSecurityEvent('ip_address_mismatch', {
        sessionId,
        expectedIP: context.ipAddress,
        actualIP: ipAddress,
        userId: context.userId
      }, 'high');
    }

    // Update last activity
    session.lastActivity = new Date();

    return true;
  }

  private calculateRiskScore(userId: string, ipAddress: string, userAgent: string): number {
    let score = 0;

    // IP reputation
    if (this.isSuspiciousIP(ipAddress)) {
      score += 30;
    }

    // User behavior analysis
    const userHistory = this.getUserSecurityHistory(userId);
    if (userHistory.recentFailures > 3) {
      score += 20;
    }

    // Geolocation analysis (in real implementation)
    if (this.isAbnormalLocation(userId, ipAddress)) {
      score += 25;
    }

    // Device fingerprinting
    if (this.isNewDevice(userId, userAgent)) {
      score += 15;
    }

    return Math.min(100, score);
  }

  private isSuspiciousIP(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress) ||
           this.suspiciousPatterns.get(ipAddress) > 5;
  }

  private getUserSecurityHistory(userId: string): any {
    // In real implementation, fetch from database
    return { recentFailures: 0, lastLogin: new Date() };
  }

  private isAbnormalLocation(userId: string, ipAddress: string): boolean {
    // In real implementation, check against user's typical locations
    return false;
  }

  private isNewDevice(userId: string, userAgent: string): boolean {
    // In real implementation, check against known devices
    return false;
  }

  // Rate Limiting
  checkRateLimit(identifier: string, action: string): boolean {
    const key = `${identifier}:${action}`;
    const attempts = this.suspiciousPatterns.get(key) || 0;

    if (attempts >= this.config.rateLimiting.maxRequests) {
      this.blockIP(identifier, this.config.rateLimiting.blockDuration, 'Rate limit exceeded');
      return false;
    }

    this.suspiciousPatterns.set(key, attempts + 1);

    // Reset counter after window
    setTimeout(() => {
      const current = this.suspiciousPatterns.get(key) || 0;
      if (current > 0) {
        this.suspiciousPatterns.set(key, current - 1);
      }
    }, this.config.rateLimiting.windowMs);

    return true;
  }

  private blockIP(ipAddress: string, duration: number, reason: string): void {
    this.blockedIPs.set(ipAddress, {
      until: new Date(Date.now() + duration),
      reason
    });

    this.logSecurityEvent('ip_blocked', {
      ipAddress,
      duration,
      reason
    }, 'high');

    this.emit('ip_blocked', { ipAddress, reason, duration });
  }

  // Audit Logging
  logSecurityEvent(
    action: string,
    details: Record<string, any>,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    userId?: string,
    sessionId?: string
  ): void {
    if (!this.config.audit.enabled) return;

    const log: AuditLog = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      userId,
      sessionId,
      action,
      resource: details.resource || 'system',
      outcome: details.outcome || 'success',
      details,
      ipAddress: details.ipAddress || 'unknown',
      userAgent: details.userAgent || 'unknown',
      riskLevel,
      encrypted: this.config.audit.encryptLogs
    };

    // Encrypt sensitive details if required
    if (this.config.audit.encryptLogs) {
      log.details = this.encryptSensitiveData(JSON.stringify(details)).encrypted;
    }

    this.auditLogs.push(log);

    // Emit for real-time monitoring
    this.emit('security_log', log);

    // Check for security incidents
    this.checkForSecurityIncidents(log);
  }

  private checkForSecurityIncidents(log: AuditLog): void {
    // Define incident detection rules
    const incidentRules = [
      {
        type: 'brute_force',
        condition: (l: AuditLog) => l.action === 'login_failed' && this.getRecentFailedLogins(l.ipAddress) >= 5,
        severity: 'high' as const
      },
      {
        type: 'injection',
        condition: (l: AuditLog) => l.action.includes('injection') || this.detectInjectionAttempt(l.details),
        severity: 'critical' as const
      },
      {
        type: 'xss',
        condition: (l: AuditLog) => l.action.includes('xss') || this.detectXSSAttempt(l.details),
        severity: 'high' as const
      },
      {
        type: 'privilege_escalation',
        condition: (l: AuditLog) => l.action === 'unauthorized_access' && l.outcome === 'failure',
        severity: 'medium' as const
      },
      {
        type: 'anomaly',
        condition: (l: AuditLog) => l.riskLevel === 'critical',
        severity: 'medium' as const
      }
    ];

    for (const rule of incidentRules) {
      if (rule.condition(log)) {
        this.createSecurityIncident(rule.type, rule.severity, log);
        break;
      }
    }
  }

  private getRecentFailedLogins(ipAddress: string, timeWindow: number = 300000): number {
    const cutoff = new Date(Date.now() - timeWindow);
    return this.auditLogs.filter(log =>
      log.action === 'login_failed' &&
      log.ipAddress === ipAddress &&
      log.timestamp > cutoff
    ).length;
  }

  private detectInjectionAttempt(details: any): boolean {
    const detailsStr = JSON.stringify(details).toLowerCase();
    const injectionPatterns = [
      'select * from', 'drop table', 'insert into', 'update set',
      '<script', 'javascript:', 'onerror=', 'onload=',
      'union select', 'exec(', 'xp_cmdshell'
    ];

    return injectionPatterns.some(pattern => detailsStr.includes(pattern));
  }

  private detectXSSAttempt(details: any): boolean {
    const detailsStr = JSON.stringify(details).toLowerCase();
    const xssPatterns = [
      '<script', 'javascript:', 'onerror=', 'onload=',
      'alert(', 'document.cookie', 'window.location',
      'eval(', 'expression('
    ];

    return xssPatterns.some(pattern => detailsStr.includes(pattern));
  }

  private createSecurityIncident(
    type: SecurityIncident['type'],
    severity: SecurityIncident['severity'],
    triggeringLog: AuditLog
  ): void {
    const incident: SecurityIncident = {
      id: crypto.randomUUID(),
      type,
      severity,
      title: this.generateIncidentTitle(type),
      description: this.generateIncidentDescription(type, triggeringLog),
      affectedUsers: triggeringLog.userId ? [triggeringLog.userId] : [],
      affectedResources: [triggeringLog.resource],
      detectedAt: new Date(),
      status: 'open',
      actions: [],
      evidence: { triggeringLog }
    };

    this.securityIncidents.push(incident);

    // Emit for immediate response
    this.emit('security_incident', incident);

    // Take automated actions based on severity
    if (severity === 'critical') {
      this.handleCriticalIncident(incident);
    }
  }

  private generateIncidentTitle(type: SecurityIncident['type']): string {
    const titles = {
      brute_force: 'Brute Force Attack Detected',
      injection: 'SQL/Code Injection Attempt',
      xss: 'Cross-Site Scripting Attempt',
      csrf: 'Cross-Site Request Forgery Attempt',
      data_breach: 'Potential Data Breach',
      privilege_escalation: 'Privilege Escalation Attempt',
      anomaly: 'Security Anomaly Detected'
    };

    return titles[type] || 'Security Incident';
  }

  private generateIncidentDescription(type: SecurityIncident['type'], log: AuditLog): string {
    return `Security incident type: ${type}. Action: ${log.action}. IP: ${log.ipAddress}. Time: ${log.timestamp.toISOString()}`;
  }

  private handleCriticalIncident(incident: SecurityIncident): void {
    // Take immediate automated actions for critical incidents
    this.emit('critical_security_incident', incident);

    // Block the IP if applicable
    if (incident.evidence.triggeringLog?.ipAddress) {
      this.blockIP(
        incident.evidence.triggeringLog.ipAddress,
        24 * 60 * 60 * 1000, // 24 hours
        'Critical security incident'
      );
    }

    // Log the response action
    incident.actions.push({
      type: 'automated_response',
      description: 'IP blocked and security team notified',
      timestamp: new Date(),
      automated: true
    });
  }

  // Input Validation and Sanitization
  validateInput(input: string, type: 'email' | 'username' | 'text' | 'number' | 'json' = 'text'): { valid: boolean; sanitized?: string; errors: string[] } {
    const errors: string[] = [];
    let sanitized: string | undefined;

    switch (type) {
      case 'email':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
          errors.push('Invalid email format');
        }
        break;

      case 'username':
        if (!/^[a-zA-Z0-9_-]{3,20}$/.test(input)) {
          errors.push('Username must be 3-20 characters and contain only letters, numbers, underscores, and hyphens');
        }
        break;

      case 'text':
        if (input.length > 1000) {
          errors.push('Text input too long (max 1000 characters)');
        }
        // Check for XSS attempts
        if (this.detectXSSAttempt({ input })) {
          errors.push('Invalid characters detected');
        }
        break;

      case 'number':
        if (!/^-?\d*\.?\d+$/.test(input)) {
          errors.push('Invalid number format');
        }
        break;

      case 'json':
        try {
          JSON.parse(input);
        } catch {
          errors.push('Invalid JSON format');
        }
        break;
    }

    // Sanitize input
    if (errors.length === 0) {
      sanitized = this.sanitizeInput(input, type);
    }

    return {
      valid: errors.length === 0,
      sanitized,
      errors
    };
  }

  private sanitizeInput(input: string, type: string): string {
    // Basic sanitization
    let sanitized = input.trim();

    // Remove potentially dangerous characters for text input
    if (type === 'text') {
      sanitized = sanitized
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }

    return sanitized;
  }

  // Monitoring and Maintenance
  private performSecurityChecks(): void {
    // Check for expired blocks
    const now = new Date();
    for (const [ip, block] of this.blockedIPs.entries()) {
      if (block.until < now) {
        this.blockedIPs.delete(ip);
        this.logSecurityEvent('ip_unblocked', { ipAddress: ip });
      }
    }

    // Check for unusual patterns
    this.detectAnomalousPatterns();
  }

  private detectAnomalousPatterns(): void {
    // Detect unusual request patterns
    const recentLogs = this.auditLogs.filter(log =>
      log.timestamp > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
    );

    // Check for high frequency requests from single IP
    const ipCounts = new Map<string, number>();
    recentLogs.forEach(log => {
      const count = ipCounts.get(log.ipAddress) || 0;
      ipCounts.set(log.ipAddress, count + 1);
    });

    for (const [ip, count] of ipCounts.entries()) {
      if (count > 100) { // More than 100 requests in 5 minutes
        this.createSecurityIncident('anomaly', 'medium', {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          action: 'high_frequency_requests',
          resource: 'api',
          outcome: 'success',
          details: { ip, requestCount: count },
          ipAddress: ip,
          userAgent: 'unknown',
          riskLevel: 'medium',
          encrypted: false
        });
      }
    }
  }

  private cleanupExpiredData(): void {
    const cutoffDate = new Date(Date.now() - this.config.audit.retentionDays * 24 * 60 * 60 * 1000);

    // Clean old audit logs
    this.auditLogs = this.auditLogs.filter(log => log.timestamp > cutoffDate);

    // Clean old sessions
    for (const [sessionId, session] of this.sessionStore.entries()) {
      if (session.expires < new Date()) {
        this.sessionStore.delete(sessionId);
        this.securityContexts.delete(sessionId);
      }
    }

    // Clean old suspicious patterns
    this.suspiciousPatterns.clear();
  }

  // Event handlers
  private handleSuspiciousActivity(data: any): void {
    this.logSecurityEvent('suspicious_activity', data, 'medium');
  }

  private handleSecurityBreach(data: any): void {
    this.createSecurityIncident('data_breach', 'critical', {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      action: 'security_breach',
      resource: data.resource || 'system',
      outcome: 'failure',
      details: data,
      ipAddress: data.ipAddress || 'unknown',
      userAgent: data.userAgent || 'unknown',
      riskLevel: 'critical',
      encrypted: false
    });
  }

  private handlePolicyViolation(data: any): void {
    this.logSecurityEvent('policy_violation', data, 'high');
  }

  // Public API methods
  getSecurityContext(sessionId: string): SecurityContext | undefined {
    return this.securityContexts.get(sessionId);
  }

  destroySecurityContext(sessionId: string): void {
    this.securityContexts.delete(sessionId);
    this.sessionStore.delete(sessionId);
  }

  getAuditLogs(filters?: {
    userId?: string;
    sessionId?: string;
    action?: string;
    dateFrom?: Date;
    dateTo?: Date;
    riskLevel?: string;
  }): AuditLog[] {
    let logs = [...this.auditLogs];

    if (filters) {
      if (filters.userId) {
        logs = logs.filter(log => log.userId === filters.userId);
      }
      if (filters.sessionId) {
        logs = logs.filter(log => log.sessionId === filters.sessionId);
      }
      if (filters.action) {
        logs = logs.filter(log => log.action === filters.action);
      }
      if (filters.dateFrom) {
        logs = logs.filter(log => log.timestamp >= filters.dateFrom!);
      }
      if (filters.dateTo) {
        logs = logs.filter(log => log.timestamp <= filters.dateTo!);
      }
      if (filters.riskLevel) {
        logs = logs.filter(log => log.riskLevel === filters.riskLevel);
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getSecurityIncidents(status?: SecurityIncident['status']): SecurityIncident[] {
    let incidents = [...this.securityIncidents];

    if (status) {
      incidents = incidents.filter(incident => incident.status === status);
    }

    return incidents.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
  }

  updateIncidentStatus(incidentId: string, status: SecurityIncident['status'], notes?: string): void {
    const incident = this.securityIncidents.find(inc => inc.id === incidentId);
    if (incident) {
      incident.status = status;
      if (status === 'resolved') {
        incident.resolvedAt = new Date();
      }
      if (notes) {
        incident.actions.push({
          type: 'status_update',
          description: notes,
          timestamp: new Date(),
          automated: false
        });
      }
      this.emit('incident_updated', incident);
    }
  }

  getSecurityMetrics(): {
    totalAudits: number;
    openIncidents: number;
    criticalIncidents: number;
    blockedIPs: number;
    activeSessions: number;
    averageRiskScore: number;
  } {
    const recentLogs = this.auditLogs.filter(log =>
      log.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    const avgRisk = recentLogs.length > 0
      ? recentLogs.reduce((sum, log) => sum + (log.riskLevel === 'critical' ? 4 : log.riskLevel === 'high' ? 3 : log.riskLevel === 'medium' ? 2 : 1), 0) / recentLogs.length
      : 0;

    return {
      totalAudits: this.auditLogs.length,
      openIncidents: this.securityIncidents.filter(inc => inc.status === 'open').length,
      criticalIncidents: this.securityIncidents.filter(inc => inc.severity === 'critical').length,
      blockedIPs: this.blockedIPs.size,
      activeSessions: this.sessionStore.size,
      averageRiskScore: avgRisk
    };
  }
}