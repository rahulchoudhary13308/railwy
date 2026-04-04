import { pool } from '@/lib/db'
import type {
  Project,
  PollLog,
  CreateProjectInput,
  UpdateProjectInput,
  ProjectStats,
  StatusJson,
} from '@/types/index'

// ─── Row type from MySQL ──────────────────────────────────────────────────────

interface ProjectRow {
  id: number
  name: string
  description: string
  repo_url: string
  branch: string
  stage: string
  status_json: string | Record<string, unknown> | null
  percentage: number
  current_task: number
  total_tasks: number
  error_count: number
  last_polled_at: Date | null
  created_at: Date
  updated_at: Date
}

interface StatsRow {
  total_projects: number
  active_projects: number
  completed_projects: number
  errored_projects: number
  total_tasks_completed: number
  total_tasks_remaining: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    repoUrl: row.repo_url,
    branch: row.branch,
    stage: row.stage,
    statusJson: row.status_json
      ? (typeof row.status_json === 'string'
        ? JSON.parse(row.status_json) as StatusJson
        : row.status_json as unknown as StatusJson)
      : null,
    percentage: row.percentage,
    currentTask: row.current_task,
    totalTasks: row.total_tasks,
    errorCount: row.error_count,
    lastPolledAt: row.last_polled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// ─── Repository ───────────────────────────────────────────────────────────────

export class ProjectRepository {
  async create(data: CreateProjectInput): Promise<Project> {
    const [result] = await pool.execute(
      `INSERT INTO projects (name, description, repo_url, branch)
       VALUES (?, ?, ?, ?)`,
      [data.name, data.description ?? '', data.repoUrl, data.branch]
    )
    const insertResult = result as { insertId: number }
    const project = await this.findById(insertResult.insertId)
    if (!project) {
      throw new Error('Failed to retrieve project after insert')
    }
    return project
  }

  async findAll(): Promise<Project[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM projects ORDER BY updated_at DESC`
    )
    return (rows as ProjectRow[]).map(rowToProject)
  }

  async findById(id: number): Promise<Project | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM projects WHERE id = ?`,
      [id]
    )
    const results = rows as ProjectRow[]
    if (results.length === 0) return null
    return rowToProject(results[0])
  }

  async findByRepoUrl(repoUrl: string): Promise<Project | null> {
    const [rows] = await pool.execute(
      `SELECT * FROM projects WHERE repo_url = ?`,
      [repoUrl]
    )
    const results = rows as ProjectRow[]
    if (results.length === 0) return null
    return rowToProject(results[0])
  }

  async update(id: number, data: UpdateProjectInput): Promise<Project | null> {
    const fields: string[] = []
    const values: Array<string | number | boolean | null | Date> = []

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name) }
    if (data.description !== undefined) { fields.push('description = ?'); values.push(data.description) }
    if (data.stage !== undefined) { fields.push('stage = ?'); values.push(data.stage) }
    if (data.statusJson !== undefined) {
      fields.push('status_json = ?')
      values.push(data.statusJson !== null ? JSON.stringify(data.statusJson) : null)
    }
    if (data.percentage !== undefined) { fields.push('percentage = ?'); values.push(data.percentage) }
    if (data.currentTask !== undefined) { fields.push('current_task = ?'); values.push(data.currentTask) }
    if (data.totalTasks !== undefined) { fields.push('total_tasks = ?'); values.push(data.totalTasks) }
    if (data.errorCount !== undefined) { fields.push('error_count = ?'); values.push(data.errorCount) }
    if (data.lastPolledAt !== undefined) { fields.push('last_polled_at = ?'); values.push(data.lastPolledAt) }

    if (fields.length === 0) return this.findById(id)

    values.push(id)
    await pool.execute(
      `UPDATE projects SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
    return this.findById(id)
  }

  async delete(id: number): Promise<boolean> {
    const [result] = await pool.execute(
      `DELETE FROM projects WHERE id = ?`,
      [id]
    )
    const deleteResult = result as { affectedRows: number }
    return deleteResult.affectedRows > 0
  }

  async createPollLog(
    projectId: number,
    success: boolean,
    errorMessage: string | null
  ): Promise<void> {
    await pool.execute(
      `INSERT INTO poll_logs (project_id, success, error_message) VALUES (?, ?, ?)`,
      [projectId, success ? 1 : 0, errorMessage]
    )
  }

  async getPollLogsByProjectId(projectId: number): Promise<PollLog[]> {
    const [rows] = await pool.execute(
      `SELECT * FROM poll_logs WHERE project_id = ? ORDER BY polled_at DESC`,
      [projectId]
    )
    return (rows as Array<{
      id: number
      project_id: number
      success: number
      error_message: string | null
      polled_at: Date
    }>).map((row) => ({
      id: row.id,
      projectId: row.project_id,
      success: row.success === 1,
      errorMessage: row.error_message,
      polledAt: row.polled_at,
    }))
  }

  async getStats(): Promise<ProjectStats> {
    const [rows] = await pool.execute(`
      SELECT
        COUNT(*) AS total_projects,
        SUM(CASE WHEN stage IN ('building', 'testing', 'plan_review') THEN 1 ELSE 0 END) AS active_projects,
        SUM(CASE WHEN stage = 'complete' THEN 1 ELSE 0 END) AS completed_projects,
        SUM(CASE WHEN stage = 'error' THEN 1 ELSE 0 END) AS errored_projects,
        COALESCE(SUM(current_task), 0) AS total_tasks_completed,
        COALESCE(SUM(total_tasks - current_task), 0) AS total_tasks_remaining
      FROM projects
    `)
    const result = (rows as StatsRow[])[0]
    return {
      totalProjects: Number(result.total_projects),
      activeProjects: Number(result.active_projects),
      completedProjects: Number(result.completed_projects),
      erroredProjects: Number(result.errored_projects),
      totalTasksCompleted: Number(result.total_tasks_completed),
      totalTasksRemaining: Number(result.total_tasks_remaining),
    }
  }
}
