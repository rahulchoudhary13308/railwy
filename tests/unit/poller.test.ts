import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Project, StatusJson } from '@/types/index'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const mockUpdate = vi.fn().mockResolvedValue(null)
  const mockCreatePollLog = vi.fn().mockResolvedValue(undefined)
  const mockFetchStatusJson = vi.fn()
  return { mockUpdate, mockCreatePollLog, mockFetchStatusJson }
})

vi.mock('mysql2/promise', () => ({
  default: {
    createPool: vi.fn().mockReturnValue({
      execute: vi.fn().mockResolvedValue([[], []]),
      query: vi.fn().mockResolvedValue([[], []]),
      getConnection: vi.fn().mockResolvedValue({
        execute: vi.fn().mockResolvedValue([[], []]),
        release: vi.fn(),
      }),
    }),
  },
}))

vi.mock('@/repositories/project', () => ({
  ProjectRepository: vi.fn().mockImplementation(() => ({
    update: mocks.mockUpdate,
    createPollLog: mocks.mockCreatePollLog,
  })),
}))

vi.mock('@/lib/github', () => ({
  fetchStatusJson: mocks.mockFetchStatusJson,
  parseGitHubUrl: vi.fn().mockReturnValue({ owner: 'user', repo: 'task-api' }),
}))

import { pollProject } from '@/lib/poller'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    name: 'task-api',
    description: '',
    repoUrl: 'https://github.com/user/task-api',
    branch: 'build/auto-task-api',
    stage: 'building',
    statusJson: null,
    percentage: 0,
    currentTask: 0,
    totalTasks: 0,
    errorCount: 0,
    lastPolledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function makeStatusJson(overrides: Partial<StatusJson> = {}): StatusJson {
  return {
    project: 'task-api',
    description: 'A test project',
    stage: 'building',
    plan_review: 'approved',
    progress: {
      total_tasks: 20,
      completed: 10,
      current_task: 11,
      current_task_name: 'Auth endpoint',
      current_task_status: 'coding',
      percentage: 50,
    },
    branch: 'build/auto-task-api',
    last_updated: '2026-01-01T00:00:00Z',
    tasks: [],
    errors: [],
    ...overrides,
  }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('pollProject', () => {
  beforeEach(() => {
    mocks.mockUpdate.mockReset().mockResolvedValue(null)
    mocks.mockCreatePollLog.mockReset().mockResolvedValue(undefined)
    mocks.mockFetchStatusJson.mockReset()
  })

  it('successful poll updates project fields from STATUS.json', async () => {
    const status = makeStatusJson()
    mocks.mockFetchStatusJson.mockResolvedValue(status)

    await pollProject(makeProject())

    expect(mocks.mockUpdate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        stage: 'building',
        percentage: 50,
        currentTask: 11,
        totalTasks: 20,
        errorCount: 0,
      })
    )
  })

  it('first successful poll sets project name and description', async () => {
    const status = makeStatusJson()
    mocks.mockFetchStatusJson.mockResolvedValue(status)

    await pollProject(makeProject({ lastPolledAt: null }))

    expect(mocks.mockUpdate).toHaveBeenCalledWith(
      1,
      expect.objectContaining({
        name: 'task-api',
        description: 'A test project',
      })
    )
  })

  it('completed projects are skipped', async () => {
    await pollProject(makeProject({ stage: 'complete' }))
    expect(mocks.mockFetchStatusJson).not.toHaveBeenCalled()
    expect(mocks.mockUpdate).not.toHaveBeenCalled()
  })

  it('poll failure logs error to poll_logs', async () => {
    mocks.mockFetchStatusJson.mockRejectedValue(new Error('Network error'))

    await pollProject(makeProject())

    expect(mocks.mockCreatePollLog).toHaveBeenCalledWith(1, false, 'Network error')
  })

  it('extracts percentage from progress.percentage', async () => {
    const status = makeStatusJson()
    status.progress.percentage = 75
    mocks.mockFetchStatusJson.mockResolvedValue(status)

    await pollProject(makeProject())
    expect(mocks.mockUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ percentage: 75 }))
  })

  it('extracts current_task from progress.current_task', async () => {
    const status = makeStatusJson()
    status.progress.current_task = 15
    mocks.mockFetchStatusJson.mockResolvedValue(status)

    await pollProject(makeProject())
    expect(mocks.mockUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ currentTask: 15 }))
  })

  it('error_count equals length of errors array', async () => {
    const status = makeStatusJson({
      errors: [
        { message: 'Error 1' },
        { message: 'Error 2' },
        { message: 'Error 3' },
      ],
    })
    mocks.mockFetchStatusJson.mockResolvedValue(status)

    await pollProject(makeProject())
    expect(mocks.mockUpdate).toHaveBeenCalledWith(1, expect.objectContaining({ errorCount: 3 }))
  })
})
