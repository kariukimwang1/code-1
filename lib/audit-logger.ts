import { query } from "./database"

/**
 * Audit Logger - Immutable logging of all critical operations
 * For compliance, transparency, and dispute resolution
 */

export interface AuditLogEntry {
  id: string
  action: string
  actor: string
  resource: string
  resourceId: string
  details: Record<string, any>
  timestamp: Date
  ipAddress?: string
}

export async function logAuditEvent(
  action: string,
  actor: string,
  resource: string,
  resourceId: string,
  details: Record<string, any>,
  ipAddress?: string,
): Promise<AuditLogEntry> {
  const result = await query(
    `INSERT INTO audit_logs 
     (action, actor, resource, resource_id, details, ip_address, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING id, action, actor, resource, resource_id, details, created_at`,
    [action, actor, resource, resourceId, JSON.stringify(details), ipAddress],
  )

  return {
    id: result.rows[0].id,
    action: result.rows[0].action,
    actor: result.rows[0].actor,
    resource: result.rows[0].resource,
    resourceId: result.rows[0].resource_id,
    details: JSON.parse(result.rows[0].details),
    timestamp: new Date(result.rows[0].created_at),
  }
}

export async function getAuditTrail(resourceId: string, limit = 100): Promise<AuditLogEntry[]> {
  const result = await query(
    `SELECT id, action, actor, resource, resource_id, details, created_at
     FROM audit_logs
     WHERE resource_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [resourceId, limit],
  )

  return result.rows.map((row) => ({
    id: row.id,
    action: row.action,
    actor: row.actor,
    resource: row.resource,
    resourceId: row.resource_id,
    details: JSON.parse(row.details),
    timestamp: new Date(row.created_at),
  }))
}

export async function generateComplianceReport(
  startDate: Date,
  endDate: Date,
): Promise<{
  totalTransactions: number
  totalRewardsDistributed: number
  totalWithdrawals: number
  totalUsers: number
  highValueTransactions: any[]
  suspiciousActivities: any[]
  auditTrail: AuditLogEntry[]
}> {
  // Total transactions
  const txResult = await query(
    `SELECT COUNT(*) as count FROM audit_logs 
     WHERE created_at BETWEEN $1 AND $2 AND action IN ('reward_claimed', 'withdrawal_created')`,
    [startDate, endDate],
  )

  // Total rewards distributed
  const rewardsResult = await query(
    `SELECT SUM(amount) as total FROM reward_ledger 
     WHERE created_at BETWEEN $1 AND $2 AND status = 'claimed'`,
    [startDate, endDate],
  )

  // Total withdrawals
  const withdrawalsResult = await query(
    `SELECT SUM(amount) as total, COUNT(*) as count FROM withdrawals 
     WHERE created_at BETWEEN $1 AND $2 AND status = 'completed'`,
    [startDate, endDate],
  )

  // Unique users
  const usersResult = await query(
    `SELECT COUNT(DISTINCT user_id) as count FROM audit_logs 
     WHERE created_at BETWEEN $1 AND $2`,
    [startDate, endDate],
  )

  // High value transactions (> $100)
  const hvResult = await query(
    `SELECT * FROM withdrawals 
     WHERE created_at BETWEEN $1 AND $2 AND amount > 100
     ORDER BY amount DESC LIMIT 50`,
    [startDate, endDate],
  )

  // Suspicious activities (multiple rejections, rapid submissions)
  const suspResult = await query(
    `SELECT user_id, COUNT(*) as rejection_count, created_at
     FROM task_submissions
     WHERE created_at BETWEEN $1 AND $2 AND status = 'rejected'
     GROUP BY user_id
     HAVING COUNT(*) > 10
     ORDER BY rejection_count DESC`,
    [startDate, endDate],
  )

  // Full audit trail
  const auditTrail = await query(
    `SELECT id, action, actor, resource, resource_id, details, created_at
     FROM audit_logs
     WHERE created_at BETWEEN $1 AND $2
     ORDER BY created_at DESC
     LIMIT 1000`,
    [startDate, endDate],
  )

  return {
    totalTransactions: Number.parseInt(txResult.rows[0]?.count) || 0,
    totalRewardsDistributed: Number.parseFloat(rewardsResult.rows[0]?.total) || 0,
    totalWithdrawals: Number.parseFloat(withdrawalsResult.rows[0]?.total) || 0,
    totalUsers: Number.parseInt(usersResult.rows[0]?.count) || 0,
    highValueTransactions: hvResult.rows || [],
    suspiciousActivities: suspResult.rows || [],
    auditTrail: auditTrail.rows.map((row) => ({
      id: row.id,
      action: row.action,
      actor: row.actor,
      resource: row.resource,
      resourceId: row.resource_id,
      details: JSON.parse(row.details),
      timestamp: new Date(row.created_at),
    })),
  }
}
