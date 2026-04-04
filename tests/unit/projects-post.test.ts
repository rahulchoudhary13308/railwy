import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Project } from '@/types/index'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const mockFindByRepoUrl = vi.fn()
  const mockCreate = vi.fn()
  return { mockFindByRepoUrl, mockCreate }
})

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { 'content-type': 'application/json' },
      }),
  },
}))

vi.mock('@/repositories/project', () => ({
  ProjectRepository: vi.fn().mockImplementation(() => ({
    findByRepoUrl: mocks.mockFindByRepoUrl,
    create: mocks.mockCreate,
  })),
}))

import { POST } from '@/app/api/projects/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    name: 'task-api',
    description: '',
    repoUrl: 'https://github.com/user/task-api',
    branch: 'build/auto-task-api',
    stage: 'pending',
    statusJson: null,
    percentage: 0,
    currentTask: 0,
    totalTasks: 0,
    errorCount: 0,
    lastPolledAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('POST /api/projects', () => {
  beforeEach(() => {
    mocks.mockFindByRepoUrl.mockReset()
    mocks.mockCreate.mockReset()
  })

  describe('happy path', () => {
    it('valid repoUrl and branch returns 201 with project data', async () => {
      mocks.mockFindByRepoUrl.mockResolvedValue(null)
      mocks.mockCreate.mockResolvedValue(makeProject({ branch: 'build/custom' }))

      const res = await POST(
        makeRequest({ repoUrl: 'https://github.com/user/task-api', branch: 'build/custom' })
      )
      const body = await res.json()

      expect(res.status).toBe(201)
      expect(body.data.id).toBe(1)
    })

    it('no branch provided returns 201 with auto-generated branch name', async () => {
      mocks.mockFindByRepoUrl.mockResolvedValue(null)
      mocks.mockCreate.mockResolvedValue(makeProject())

      const res = await POST(makeRequest({ repoUrl: 'https://github.com/user/task-api' }))
      const body = await res.json()

      expect(res.status).toBe(201)
      expect(mocks.mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ branch: 'build/auto-task-api' })
      )
    })

    it('repoUrl with trailing slash is normalized and returns 201', async () => {
      mocks.mockFindByRepoUrl.mockResolvedValue(null)
      mocks.mockCreate.mockResolvedValue(makeProject())

      const res = await POST(
        makeRequest({ repoUrl: 'https://github.com/user/task-api/' })
      )
      expect(res.status).toBe(201)
      expect(mocks.mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ repoUrl: 'https://github.com/user/task-api' })
      )
    })

    it('repoUrl with .git suffix is normalized and returns 201', async () => {
      mocks.mockFindByRepoUrl.mockResolvedValue(null)
      mocks.mockCreate.mockResolvedValue(makeProject())

      const res = await POST(
        makeRequest({ repoUrl: 'https://github.com/user/task-api.git' })
      )
      expect(res.status).toBe(201)
      expect(mocks.mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ repoUrl: 'https://github.com/user/task-api' })
      )
    })
  })

  describe('input validation', () => {
    it('missing repoUrl returns 400 mentioning "repoUrl"', async () => {
      const res = await POST(makeRequest({ branch: 'main' }))
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
      expect(body.error.field).toBe('repoUrl')
    })

    it('empty repoUrl returns 400 with validation error', async () => {
      const res = await POST(makeRequest({ repoUrl: '' }))
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error.code).toBe('VALIDATION_ERROR')
    })

    it('non-GitHub URL returns 400 with "Invalid GitHub URL format"', async () => {
      const res = await POST(makeRequest({ repoUrl: 'https://gitlab.com/user/repo' }))
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error.message).toBe('Invalid GitHub URL format')
    })

    it('missing body entirely returns 400', async () => {
      const req = new Request('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'not json',
      })
      const res = await POST(req)
      const body = await res.json()

      expect(res.status).toBe(400)
    })
  })

  describe('business rules', () => {
    it('duplicate repoUrl returns 409 with "Project already registered"', async () => {
      mocks.mockFindByRepoUrl.mockResolvedValue(makeProject())

      const res = await POST(makeRequest({ repoUrl: 'https://github.com/user/task-api' }))
      const body = await res.json()

      expect(res.status).toBe(409)
      expect(body.error.code).toBe('CONFLICT')
      expect(body.error.message).toBe('Project already registered')
    })
  })
})
