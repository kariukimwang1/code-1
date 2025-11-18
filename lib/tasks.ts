import { query } from "./database"

export interface Task {
  id: string
  sponsor_id: string
  type: string
  title: string
  description: string
  reward_tokens: number
  max_claims: number
  complexity_score: number
  status: string
  image_url: string
}

export async function createTask(task: Omit<Task, "id">) {
  const result = await query(
    `INSERT INTO tasks (sponsor_id, type, title, description, reward_tokens, max_claims, complexity_score, image_url, status) 
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active') 
     RETURNING *`,
    [
      task.sponsor_id,
      task.type,
      task.title,
      task.description,
      task.reward_tokens,
      task.max_claims,
      task.complexity_score,
      task.image_url,
    ],
  )
  return result.rows[0]
}

export async function getActiveTasks(limit = 20, offset = 0) {
  const result = await query(
    `SELECT * FROM tasks WHERE status = 'active' AND (max_claims = -1 OR claims_count < max_claims) 
     ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
    [limit, offset],
  )
  return result.rows
}

export async function getTaskById(taskId: string) {
  const result = await query("SELECT * FROM tasks WHERE id = $1", [taskId])
  return result.rows[0] || null
}

export async function submitTaskEvidence(taskId: string, userId: string, evidenceLink: string, evidenceHash: string) {
  const result = await query(
    `INSERT INTO task_submissions (task_id, user_id, evidence_link, evidence_hash, status) 
     VALUES ($1, $2, $3, $4, 'pending') RETURNING *`,
    [taskId, userId, evidenceLink, evidenceHash],
  )

  // Increment claims count
  await query("UPDATE tasks SET claims_count = claims_count + 1 WHERE id = $1", [taskId])

  return result.rows[0]
}

export async function getTaskSubmissions(taskId: string) {
  const result = await query("SELECT * FROM task_submissions WHERE task_id = $1 ORDER BY submitted_at DESC", [taskId])
  return result.rows
}

export async function approveSubmission(submissionId: string, reviewerId: string) {
  const result = await query(
    `UPDATE task_submissions SET status = 'approved', reviewed_by = $1, reviewed_at = NOW() 
     WHERE id = $2 RETURNING *`,
    [reviewerId, submissionId],
  )
  return result.rows[0]
}

export async function rejectSubmission(submissionId: string, reviewerId: string, reason: string) {
  const result = await query(
    `UPDATE task_submissions SET status = 'rejected', reviewed_by = $1, reviewed_at = NOW(), rejection_reason = $2 
     WHERE id = $3 RETURNING *`,
    [reviewerId, reason, submissionId],
  )
  return result.rows[0]
}
