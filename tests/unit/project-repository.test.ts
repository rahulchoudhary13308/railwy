import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Project } from '@/types/index'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const mockExecute = vi.fn()
  const mockPoolInstance = { execute: mockExecute, query: mockExecute }
  const mockCreatePool = vi.fn().mockReturnValue(mockPoolInstance)
  return { mockExecute, mockCreatePool }
})

vi.mock('mysql2/promise', () => ({
  default: { createPool: mocks.mockCreatePool },
  createPool: mocks.mockCreatePool,
}))

import { ProjectRepository } from '@/repositories/project'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 1,
    name: 'task-api',
    description: 'A test project',
    repo_url: 'https://github.com/user/task-api',
    branch: 'build/auto-task-api',
    stage: 'building',
    status_json: null,
    percentage: 50,
    current_task: 5,
    total_tasks: 10,
    error_count: 0,
    last_polled_at: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  }
}

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    name: 'task-api',
    description: 'A test project',
    repoUrl: 'https://github.com/user/task-api',
    branch: 'build/auto-task-api',
    stage: 'building',
    statusJson: null,
    percentage: 50,
    currentTask: 5,
    totalTasks: 10,
    errorCount: 0,
    lastPolledAt: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProjectRepository', () => {
  let repo: ProjectRepository

  beforeEach(() => {
    mocks.mockExecute.mockReset()
    repo = new ProjectRepository()
  })

  describe('create()', () => {
    it('inserts a project and returns it with id and timestamps', async () => {
      mocks.mockExecute
        .mockResolvedValueOnce([{ insertId: 1 }, []])          // INSERT
        .mockResolvedValueOnce([[makeRow()], []])               // SELECT by id

      const project = await repo.create({
        name: 'task-api',
        repoUrl: 'https://github.com/user/task-api',
        branch: 'build/auto-task-api',
      })

      expect(project.id).toBe(1)
      expect(project.name).toBe('task-api')
      expect(project.repoUrl).toBe('https://github.com/user/task-api')
    })

    it('with duplicate repo_url throws a database error', async () => {
      const err = Object.assign(new Error('Duplicate entry'), { code: 'ER_DUP_ENTRY' })
      mocks.mockExecute.mockRejectedValueOnce(err)

      await expect(
        repo.create({
          name: 'task-api',
          repoUrl: 'https://github.com/user/task-api',
          branch: 'build/auto-task-api',
        })
      ).rejects.toThrow()
    })
  })

  describe('findAll()', () => {
    it('returns all projects sorted by updated_at desc', async () => {
      const row1 = makeRow({ id: 2, updated_at: new Date('2026-01-03') })
      const row2 = makeRow({ id: 1, updated_at: new Date('2026-01-01') })
      mocks.mockExecute.mockResolvedValueOnce([[row1, row2], []])

      const projects = await repo.findAll()

      expect(projects).toHaveLength(2)
      expect(projects[0].id).toBe(2)
      expect(projects[1].id).toBe(1)
    })

    it('returns empty array when no projects exist', async () => {
      mocks.mockExecute.mockResolvedValueOnce([[], []])

      const projects = await repo.findAll()
      expect(projects).toEqual([])
    })
  })

  describe('findById()', () => {
    it('returns project when it exists', async () => {
      mocks.mockExecute.mockResolvedValueOnce([[makeRow()], []])

      const project = await repo.findById(1)
      expect(project).not.toBeNull()
      expect(project?.id).toBe(1)
    })

    it('returns null when project does not exist', async () => {
      mocks.mockExecute.mockResolvedValueOnce([[], []])

      const project = await repo.findById(999)
      expect(project).toBeNull()
    })
  })

  describe('findByRepoUrl()', () => {
    it('returns project matching the repo URL', async () => {
      mocks.mockExecute.mockResolvedValueOnce([[makeRow()], []])

      const project = await repo.findByRepoUrl('https://github.com/user/task-api')
      expect(project).not.toBeNull()
      expect(project?.repoUrl).toBe('https://github.com/user/task-api')
    })
  })

  describe('update()', () => {
    it('modifies specified fields and returns updated project', async () => {
      mocks.mockExecute
        .mockResolvedValueOnce([{ affectedRows: 1 }, []])             // UPDATE
        .mockResolvedValueOnce([[makeRow({ stage: 'complete' })], []])  // SELECT

      const updated = await repo.update(1, { stage: 'complete' })
      expect(updated?.stage).toBe('complete')
    })

    it('returns current project when no fields to update', async () => {
      mocks.mockExecute.mockResolvedValueOnce([[makeRow()], []])

      const project = await repo.update(1, {})
      expect(project?.id).toBe(1)
    })
  })

  describe('delete()', () => {
    it('removes project and returns true', async () => {
      mocks.mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }, []])

      const result = await repo.delete(1)
      expect(result).toBe(true)
    })

    it('returns false when project does not exist', async () => {
      mocks.mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }, []])

      const result = await repo.delete(999)
      expect(result).toBe(false)
    })
  })

  describe('getStats()', () => {
    it('returns correct counts for active/completed/errored projects', async () => {
      mocks.mockExecute.mockResolvedValueOnce([
        [
          {
            total_projects: '5',
            active_projects: '2',
            completed_projects: '2',
            errored_projects: '1',
            total_tasks_completed: '87',
            total_tasks_remaining: '18',
          },
        ],
        [],
      ])

      const stats = await repo.getStats()

      expect(stats.totalProjects).toBe(5)
      expect(stats.activeProjects).toBe(2)
      expect(stats.completedProjects).toBe(2)
      expect(stats.erroredProjects).toBe(1)
      expect(stats.totalTasksCompleted).toBe(87)
      expect(stats.totalTasksRemaining).toBe(18)
    })
  })
})
