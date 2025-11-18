import { EventEmitter } from 'events';
import { User, Transaction, ActivityLog, DeviceInfo, IPInfo } from '../types';

interface FraudPattern {
  id: string;
  name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  rules: Array<{
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'ne' | 'contains' | 'pattern' | 'time_range' | 'frequency';
    value: any;
    weight: number;
  }>;
  thresholds: {
    suspicious: number;
    fraud: number;
    critical: number;
  };
  timeframe: number; // in minutes
}

interface RiskScore {
  userId: string;
  score: number;
  level: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    factor: string;
    weight: number;
    contribution: number;
    details: any;
  }>;
  timestamp: Date;
  recommendations: string[];
}

interface FraudAlert {
  id: string;
  userId: string;
  type: 'suspicious_activity' | 'potential_fraud' | 'confirmed_fraud' | 'security_threat';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  evidence: any[];
  riskScore: number;
  actions: Array<{
    type: 'block_account' | 'freeze_transactions' | 'require_verification' | 'notify_admin' | 'monitor';
    automated: boolean;
    executed: boolean;
    timestamp: Date;
  }>;
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  createdAt: Date;
  updatedAt: Date;
}

interface SecurityMetrics {
  totalTransactions: number;
  fraudulentTransactions: number;
  blockedTransactions: number;
  falsePositives: number;
  detectionAccuracy: number;
  responseTime: number;
  patternsIdentified: number;
  alertsGenerated: number;
  alertsResolved: number;
}

export class FraudDetectionSystem extends EventEmitter {
  private patterns: FraudPattern[] = [];
  private riskScores = new Map<string, RiskScore>();
  private alerts: FraudAlert[] = [];
  private userProfileData = new Map<string, any>();
  private deviceProfiles = new Map<string, DeviceInfo>();
  private ipReputation = new Map<string, IPInfo>();
  private transactionPatterns = new Map<string, any[]>();
  private behaviorBaseline = new Map<string, any>();

  private metrics: SecurityMetrics = {
    totalTransactions: 0,
    fraudulentTransactions: 0,
    blockedTransactions: 0,
    falsePositives: 0,
    detectionAccuracy: 0,
    responseTime: 0,
    patternsIdentified: 0,
    alertsGenerated: 0,
    alertsResolved: 0,
  };

  constructor() {
    super();
    this.initializeFraudPatterns();
    this.startMonitoring();
  }

  async initializeFraudPatterns(): Promise<void> {
    this.patterns = [
      {
        id: 'rapid_transactions',
        name: 'Rapid Transaction Pattern',
        description: 'Unusually high frequency of transactions in short time',
        severity: 'high',
        rules: [
          { field: 'transaction_count', operator: 'gt', value: 10, weight: 0.7 },
          { field: 'time_window', operator: 'lt', value: 5, weight: 0.5 },
          { field: 'amount_variance', operator: 'gt', value: 0.8, weight: 0.3 }
        ],
        thresholds: { suspicious: 0.5, fraud: 0.7, critical: 0.9 },
        timeframe: 5
      },
      {
        id: 'amount_anomaly',
        name: 'Unusual Transaction Amount',
        description: 'Transaction amount significantly deviates from user baseline',
        severity: 'medium',
        rules: [
          { field: 'amount_deviation', operator: 'gt', value: 3, weight: 0.6 },
          { field: 'historical_avg', operator: 'lt', value: 0.1, weight: 0.4 }
        ],
        thresholds: { suspicious: 0.4, fraud: 0.6, critical: 0.8 },
        timeframe: 60
      },
      {
        id: 'location_anomaly',
        name: 'Suspicious Geographic Location',
        description: 'Transaction from impossible geographic location',
        severity: 'high',
        rules: [
          { field: 'distance_traveled', operator: 'gt', value: 1000, weight: 0.8 },
          { field: 'time_between', operator: 'lt', value: 30, weight: 0.7 },
          { field: 'country_risk', operator: 'gt', value: 0.7, weight: 0.5 }
        ],
        thresholds: { suspicious: 0.5, fraud: 0.7, critical: 0.9 },
        timeframe: 30
      },
      {
        id: 'device_anomaly',
        name: 'New or Suspicious Device',
        description: 'Transaction from unrecognized or suspicious device',
        severity: 'medium',
        rules: [
          { field: 'new_device', operator: 'eq', value: true, weight: 0.4 },
          { field: 'device_fingerprint', operator: 'pattern', value: 'suspicious', weight: 0.6 },
          { field: 'root_device', operator: 'eq', value: true, weight: 0.8 }
        ],
        thresholds: { suspicious: 0.3, fraud: 0.5, critical: 0.7 },
        timeframe: 1440
      },
      {
        id: 'velocity_check',
        name: 'Transaction Velocity Anomaly',
        description: 'Excessive transaction volume in short period',
        severity: 'critical',
        rules: [
          { field: 'volume_per_hour', operator: 'gt', value: 10000, weight: 0.7 },
          { field: 'count_per_hour', operator: 'gt', value: 50, weight: 0.6 },
          { field: 'success_rate', operator: 'lt', value: 0.3, weight: 0.4 }
        ],
        thresholds: { suspicious: 0.4, fraud: 0.6, critical: 0.8 },
        timeframe: 60
      },
      {
        id: 'behavior_anomaly',
        name: 'Unusual User Behavior',
        description: 'Significant deviation from established user behavior patterns',
        severity: 'medium',
        rules: [
          { field: 'login_time_deviation', operator: 'gt', value: 4, weight: 0.5 },
          { field: 'session_duration', operator: 'lt', value: 30, weight: 0.3 },
          { field: 'feature_usage_change', operator: 'gt', value: 0.8, weight: 0.4 }
        ],
        thresholds: { suspicious: 0.3, fraud: 0.5, critical: 0.7 },
        timeframe: 1440
      },
      {
        id: 'multiple_accounts',
        name: 'Multiple Account Linking',
        description: 'Evidence of multiple accounts controlled by same entity',
        severity: 'high',
        rules: [
          { field: 'shared_device', operator: 'gt', value: 3, weight: 0.7 },
          { field: 'shared_ip', operator: 'gt', value: 5, weight: 0.8 },
          { field: 'similar_patterns', operator: 'gt', value: 0.9, weight: 0.6 }
        ],
        thresholds: { suspicious: 0.4, fraud: 0.6, critical: 0.8 },
        timeframe: 4320
      }
    ];
  }

  async analyzeTransaction(
    transaction: Transaction,
    user: User,
    deviceInfo: DeviceInfo,
    ipInfo: IPInfo
  ): Promise<RiskScore> {
    const startTime = Date.now();
    this.metrics.totalTransactions++;

    const factors: Array<{
      factor: string;
      weight: number;
      contribution: number;
      details: any;
    }> = [];

    let totalRiskScore = 0;

    // Analyze against each fraud pattern
    for (const pattern of this.patterns) {
      const patternScore = await this.evaluatePattern(pattern, transaction, user, deviceInfo, ipInfo);
      if (patternScore > 0) {
        factors.push({
          factor: pattern.name,
          weight: pattern.rules.reduce((sum, rule) => sum + rule.weight, 0),
          contribution: patternScore,
          details: { patternId: pattern.id, score: patternScore, threshold: pattern.thresholds.fraud }
        });
        totalRiskScore += patternScore;
      }
    }

    // User behavior analysis
    const behaviorScore = await this.analyzeUserBehavior(user, transaction);
    if (behaviorScore.score > 0) {
      factors.push(behaviorScore);
      totalRiskScore += behaviorScore.contribution;
    }

    // Device reputation analysis
    const deviceScore = await this.analyzeDeviceReputation(deviceInfo);
    if (deviceScore.score > 0) {
      factors.push(deviceScore);
      totalRiskScore += deviceScore.contribution;
    }

    // IP reputation analysis
    const ipScore = await this.analyzeIPReputation(ipInfo);
    if (ipScore.score > 0) {
      factors.push(ipScore);
      totalRiskScore += ipScore.contribution;
    }

    // Normalize risk score (0-100)
    const normalizedScore = Math.min(totalRiskScore * 10, 100);

    const riskLevel = this.determineRiskLevel(normalizedScore);
    const recommendations = this.generateRecommendations(normalizedScore, factors);

    const riskScore: RiskScore = {
      userId: user.id,
      score: normalizedScore,
      level: riskLevel,
      factors,
      timestamp: new Date(),
      recommendations
    };

    this.riskScores.set(user.id, riskScore);

    // Update response time metric
    this.metrics.responseTime = Date.now() - startTime;

    // Trigger alerts if necessary
    if (riskLevel !== 'low') {
      await this.generateAlert(riskScore, transaction, user, deviceInfo, ipInfo);
    }

    this.emit('transaction_analyzed', riskScore);

    return riskScore;
  }

  private async evaluatePattern(
    pattern: FraudPattern,
    transaction: Transaction,
    user: User,
    deviceInfo: DeviceInfo,
    ipInfo: IPInfo
  ): Promise<number> {
    let patternScore = 0;

    for (const rule of pattern.rules) {
      const ruleScore = await this.evaluateRule(rule, transaction, user, deviceInfo, ipInfo);
      patternScore += ruleScore * rule.weight;
    }

    return Math.min(patternScore, 10); // Cap individual pattern score
  }

  private async evaluateRule(
    rule: any,
    transaction: Transaction,
    user: User,
    deviceInfo: DeviceInfo,
    ipInfo: IPInfo
  ): Promise<number> {
    switch (rule.field) {
      case 'transaction_count':
        return this.evaluateTransactionCount(user, rule.value, rule.operator);
      case 'amount_deviation':
        return this.evaluateAmountDeviation(transaction, user, rule.value, rule.operator);
      case 'distance_traveled':
        return this.evaluateLocationAnomaly(ipInfo, user, rule.value, rule.operator);
      case 'new_device':
        return this.evaluateNewDevice(deviceInfo, user);
      case 'volume_per_hour':
        return this.evaluateTransactionVolume(user, rule.value, rule.operator);
      case 'shared_ip':
        return this.evaluateSharedIP(ipInfo, rule.value, rule.operator);
      default:
        return 0;
    }
  }

  private evaluateTransactionCount(user: User, threshold: number, operator: string): number {
    const recentTransactions = this.getRecentTransactions(user.id, 5); // Last 5 minutes
    const count = recentTransactions.length;

    if (operator === 'gt' && count > threshold) {
      return Math.min((count - threshold) / threshold, 1);
    }
    return 0;
  }

  private evaluateAmountDeviation(transaction: Transaction, user: User, threshold: number, operator: string): number {
    const userAverage = this.getUserAverageTransactionAmount(user.id);
    if (userAverage === 0) return 0;

    const deviation = Math.abs(transaction.amount - userAverage) / userAverage;

    if (operator === 'gt' && deviation > threshold) {
      return Math.min(deviation / threshold, 1);
    }
    return 0;
  }

  private evaluateLocationAnomaly(ipInfo: IPInfo, user: User, maxDistance: number, operator: string): number {
    const lastLocation = this.getUserLastLocation(user.id);
    if (!lastLocation) return 0;

    const distance = this.calculateDistance(lastLocation, ipInfo.location);

    if (operator === 'gt' && distance > maxDistance) {
      return Math.min(distance / maxDistance, 1);
    }
    return 0;
  }

  private evaluateNewDevice(deviceInfo: DeviceInfo, user: User): number {
    const knownDevices = this.getUserKnownDevices(user.id);
    const isKnown = knownDevices.some(device => device.fingerprint === deviceInfo.fingerprint);

    return isKnown ? 0 : 0.5;
  }

  private evaluateTransactionVolume(user: User, maxVolume: number, operator: string): number {
    const recentTransactions = this.getRecentTransactions(user.id, 60); // Last hour
    const totalVolume = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0);

    if (operator === 'gt' && totalVolume > maxVolume) {
      return Math.min(totalVolume / maxVolume, 1);
    }
    return 0;
  }

  private evaluateSharedIP(ipInfo: IPInfo, maxUsers: number, operator: string): number {
    const accountsOnIP = this.getAccountsOnIP(ipInfo.ip);

    if (operator === 'gt' && accountsOnIP.length > maxUsers) {
      return Math.min(accountsOnIP.length / maxUsers, 1);
    }
    return 0;
  }

  private async analyzeUserBehavior(user: User, transaction: Transaction): Promise<any> {
    const baseline = this.behaviorBaseline.get(user.id);
    if (!baseline) {
      // Establish baseline
      this.establishBehaviorBaseline(user);
      return { score: 0, contribution: 0, factor: 'user_behavior' };
    }

    let behaviorScore = 0;
    const factors = [];

    // Analyze transaction timing
    const currentHour = new Date().getHours();
    const typicalHours = baseline.typicalTransactionHours;
    if (!typicalHours.includes(currentHour)) {
      behaviorScore += 0.3;
      factors.push('unusual_time');
    }

    // Analyze transaction amount patterns
    const amountPattern = this.analyzeAmountPattern(transaction.amount, baseline.amountPatterns);
    behaviorScore += amountPattern * 0.4;

    // Analyze session duration
    const currentSessionDuration = this.getCurrentSessionDuration(user.id);
    if (currentSessionDuration < baseline.averageSessionDuration * 0.5) {
      behaviorScore += 0.3;
      factors.push('short_session');
    }

    return {
      factor: 'user_behavior',
      weight: 0.6,
      contribution: behaviorScore,
      details: { factors, baseline: baseline.id }
    };
  }

  private async analyzeDeviceReputation(deviceInfo: DeviceInfo): Promise<any> {
    let deviceRisk = 0;
    const factors = [];

    // Check for known compromised devices
    if (this.isCompromisedDevice(deviceInfo.fingerprint)) {
      deviceRisk += 0.8;
      factors.push('compromised_device');
    }

    // Check for emulators/virtual environments
    if (this.isVirtualDevice(deviceInfo)) {
      deviceRisk += 0.6;
      factors.push('virtual_device');
    }

    // Check for rooted/jailbroken devices
    if (deviceInfo.isRooted) {
      deviceRisk += 0.5;
      factors.push('rooted_device');
    }

    return {
      factor: 'device_reputation',
      weight: 0.4,
      contribution: deviceRisk,
      details: { factors, deviceInfo: deviceInfo.fingerprint }
    };
  }

  private async analyzeIPReputation(ipInfo: IPInfo): Promise<any> {
    let ipRisk = 0;
    const factors = [];

    // Check against known malicious IP databases
    if (this.isMaliciousIP(ipInfo.ip)) {
      ipRisk += 0.9;
      factors.push('malicious_ip');
    }

    // Check for VPN/Proxy usage
    if (this.isVPNOrProxy(ipInfo)) {
      ipRisk += 0.3;
      factors.push('vpn_proxy');
    }

    // Check for high-risk countries
    if (this.isHighRiskCountry(ipInfo.country)) {
      ipRisk += 0.4;
      factors.push('high_risk_country');
    }

    return {
      factor: 'ip_reputation',
      weight: 0.3,
      contribution: ipRisk,
      details: { factors, ip: ipInfo.ip }
    };
  }

  private determineRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
    if (score < 20) return 'low';
    if (score < 50) return 'medium';
    if (score < 80) return 'high';
    return 'critical';
  }

  private generateRecommendations(score: number, factors: any[]): string[] {
    const recommendations: string[] = [];

    if (score > 70) {
      recommendations.push('Block transaction immediately');
      recommendations.push('Require additional verification');
      recommendations.push('Flag account for review');
    } else if (score > 50) {
      recommendations.push('Implement additional verification steps');
      recommendations.push('Monitor account closely');
      recommendations.push('Consider temporary restrictions');
    } else if (score > 30) {
      recommendations.push('Enhanced monitoring required');
      recommendations.push('Implement velocity checks');
      recommendations.push('Consider risk-based authentication');
    }

    // Add specific recommendations based on risk factors
    for (const factor of factors) {
      if (factor.factor.includes('location')) {
        recommendations.push('Verify location with additional methods');
      }
      if (factor.factor.includes('device')) {
        recommendations.push('Implement device verification');
      }
      if (factor.factor.includes('behavior')) {
        recommendations.push('Monitor user behavior patterns');
      }
    }

    return recommendations;
  }

  private async generateAlert(
    riskScore: RiskScore,
    transaction: Transaction,
    user: User,
    deviceInfo: DeviceInfo,
    ipInfo: IPInfo
  ): Promise<void> {
    const alert: FraudAlert = {
      id: this.generateAlertId(),
      userId: user.id,
      type: riskScore.level === 'critical' ? 'confirmed_fraud' :
            riskScore.level === 'high' ? 'potential_fraud' : 'suspicious_activity',
      severity: riskScore.level,
      title: `${riskScore.level.charAt(0).toUpperCase() + riskScore.level.slice(1)} Risk Transaction Detected`,
      description: `Transaction of $${transaction.amount} flagged with risk score ${riskScore.score}`,
      evidence: [riskScore, transaction, deviceInfo, ipInfo],
      riskScore: riskScore.score,
      actions: this.generateAlertActions(riskScore.level),
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.alerts.push(alert);
    this.metrics.alertsGenerated++;

    // Execute automated actions
    await this.executeAutomatedActions(alert);

    this.emit('fraud_alert', alert);

    // Critical alerts trigger immediate notifications
    if (riskScore.level === 'critical') {
      this.emit('critical_fraud_alert', alert);
    }
  }

  private generateAlertActions(riskLevel: string) {
    const actions = [];

    if (riskLevel === 'critical') {
      actions.push(
        { type: 'block_account', automated: true, executed: false, timestamp: new Date() },
        { type: 'freeze_transactions', automated: true, executed: false, timestamp: new Date() },
        { type: 'notify_admin', automated: true, executed: false, timestamp: new Date() }
      );
    } else if (riskLevel === 'high') {
      actions.push(
        { type: 'require_verification', automated: true, executed: false, timestamp: new Date() },
        { type: 'monitor', automated: true, executed: false, timestamp: new Date() },
        { type: 'notify_admin', automated: true, executed: false, timestamp: new Date() }
      );
    } else if (riskLevel === 'medium') {
      actions.push(
        { type: 'monitor', automated: true, executed: false, timestamp: new Date() },
        { type: 'require_verification', automated: false, executed: false, timestamp: new Date() }
      );
    }

    return actions;
  }

  private async executeAutomatedActions(alert: FraudAlert): Promise<void> {
    for (const action of alert.actions) {
      if (action.automated) {
        try {
          await this.executeAction(action);
          action.executed = true;
        } catch (error) {
          console.error(`Failed to execute action ${action.type}:`, error);
        }
      }
    }
  }

  private async executeAction(action: any): Promise<void> {
    switch (action.type) {
      case 'block_account':
        await this.blockAccount(alert.userId);
        break;
      case 'freeze_transactions':
        await this.freezeTransactions(alert.userId);
        break;
      case 'require_verification':
        await this.requireVerification(alert.userId);
        break;
      case 'notify_admin':
        await this.notifyAdmin(alert);
        break;
      case 'monitor':
        await this.enhancedMonitoring(alert.userId);
        break;
    }
  }

  // Utility methods
  private getRecentTransactions(userId: string, minutes: number): Transaction[] {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    // Implementation would fetch from database or cache
    return [];
  }

  private getUserAverageTransactionAmount(userId: string): number {
    // Implementation would calculate from user history
    return 0;
  }

  private calculateDistance(loc1: any, loc2: any): number {
    // Haversine formula for distance calculation
    return 0;
  }

  private getUserKnownDevices(userId: string): DeviceInfo[] {
    // Implementation would fetch from database
    return [];
  }

  private getAccountsOnIP(ip: string): string[] {
    // Implementation would query database
    return [];
  }

  private isCompromisedDevice(fingerprint: string): boolean {
    // Implementation would check against blacklists
    return false;
  }

  private isVirtualDevice(deviceInfo: DeviceInfo): boolean {
    return deviceInfo.isEmulator || deviceInfo.isVirtual;
  }

  private isMaliciousIP(ip: string): boolean {
    // Implementation would check against threat intelligence feeds
    return false;
  }

  private isVPNOrProxy(ipInfo: IPInfo): boolean {
    return ipInfo.isVPN || ipInfo.isProxy;
  }

  private isHighRiskCountry(country: string): boolean {
    const highRiskCountries = ['XX', 'YY', 'ZZ']; // Would be populated with actual country codes
    return highRiskCountries.includes(country);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserLastLocation(userId: string): any {
    // Implementation would fetch from database
    return null;
  }

  private analyzeAmountPattern(amount: number, patterns: any): number {
    // Implementation would analyze against historical patterns
    return 0;
  }

  private getCurrentSessionDuration(userId: string): number {
    // Implementation would calculate session duration
    return 0;
  }

  private establishBehaviorBaseline(user: User): void {
    // Implementation would establish baseline from user history
  }

  private getUserLastTransaction(userId: string): Transaction | null {
    // Implementation would fetch from database
    return null;
  }

  private async blockAccount(userId: string): Promise<void> {
    // Implementation would block the user account
  }

  private async freezeTransactions(userId: string): Promise<void> {
    // Implementation would freeze user transactions
  }

  private async requireVerification(userId: string): Promise<void> {
    // Implementation would require additional verification
  }

  private async notifyAdmin(alert: FraudAlert): Promise<void> {
    // Implementation would notify administrators
  }

  private async enhancedMonitoring(userId: string): Promise<void> {
    // Implementation would enable enhanced monitoring
  }

  private startMonitoring(): void {
    // Start continuous monitoring processes
    setInterval(() => {
      this.updateMetrics();
      this.cleanupOldData();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private updateMetrics(): void {
    // Update detection accuracy and other metrics
    const totalAlerts = this.alerts.length;
    const resolvedAlerts = this.alerts.filter(a => a.status === 'resolved').length;

    this.metrics.alertsResolved = resolvedAlerts;
    this.metrics.detectionAccuracy = totalAlerts > 0 ? (resolvedAlerts / totalAlerts) * 100 : 0;
  }

  private cleanupOldData(): void {
    // Clean up old data to prevent memory leaks
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours ago

    // Clean old risk scores, alerts, etc.
    this.riskScores.forEach((score, userId) => {
      if (score.timestamp.getTime() < cutoffTime) {
        this.riskScores.delete(userId);
      }
    });
  }

  // Public API methods
  getAlerts(userId?: string): FraudAlert[] {
    if (userId) {
      return this.alerts.filter(alert => alert.userId === userId);
    }
    return this.alerts;
  }

  getMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  resolveAlert(alertId: string, resolution: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = resolution === 'false_positive' ? 'false_positive' : 'resolved';
      alert.updatedAt = new Date();
      this.metrics.alertsResolved++;
      this.emit('alert_resolved', alert);
    }
  }

  async updateFraudPatterns(newPatterns: FraudPattern[]): Promise<void> {
    this.patterns = [...this.patterns, ...newPatterns];
    this.emit('patterns_updated', newPatterns);
  }
}