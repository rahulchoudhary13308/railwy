// ─── DB / Domain entities ────────────────────────────────────────────────────

export interface Project {
  id: number
  name: string
  description: string
  repoUrl: string
  branch: string
  stage: string
  statusJson: StatusJson | null
  percentage: number
  currentTask: number
  totalTasks: number
  errorCount: number
  lastPolledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface PollLog {
  id: number
  projectId: number
  success: boolean
  errorMessage: string | null
  polledAt: Date
}

// ─── STATUS.json schema ───────────────────────────────────────────────────────

export interface StatusTask {
  id: number
  name: string
  size?: string
  status: string
}

export interface StatusError {
  task_id?: number
  message: string
  file?: string
  line?: number
  timestamp?: string
}

export interface StatusJson {
  project: string
  description: string
  stage: string
  plan_review: string
  progress: {
    total_tasks: number
    completed: number
    current_task: number
    current_task_name: string
    current_task_status: string
    fix_attempt?: number
    percentage: number
  }
  time_estimate?: {
    method: string
    remaining_minutes: number
  }
  branch: string
  lock?: {
    active: boolean
    since?: string
  }
  last_updated: string
  tasks: StatusTask[]
  verification?: {
    build?: string
    lint?: string
    typecheck?: string
    tests?: string
    coverage?: number
  }
  errors: StatusError[]
}

// ─── Repository input types ───────────────────────────────────────────────────

export interface CreateProjectInput {
  name: string
  description?: string
  repoUrl: string
  branch: string
}

export interface UpdateProjectInput {
  name?: string
  description?: string
  stage?: string
  statusJson?: StatusJson | null
  percentage?: number
  currentTask?: number
  totalTasks?: number
  errorCount?: number
  lastPolledAt?: Date | null
}

// ─── Aggregate stats ──────────────────────────────────────────────────────────

export interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  erroredProjects: number
  totalTasksCompleted: number
  totalTasksRemaining: number
}

// ─── API response wrappers ────────────────────────────────────────────────────

export interface ApiSuccess<T> {
  data: T
}

export interface ApiError {
  error: {
    code: string
    message: string
    field?: string
  }
}
