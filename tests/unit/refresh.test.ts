import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const mockFindById = vi.fn()
  const mockPollProject = vi.fn()
  return { mockFindById, mockPollProject }
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
    findById: mocks.mockFindById,
  })),
}))

vi.mock('@/lib/poller', () => ({
  pollProject: mocks.mockPollProject,
}))

import { POST } from '@/app/api/projects/[id]/refresh/route'

const dummyReq = new Request('http://localhost', { method: 'POST' })
const makeParams = (id: string) => ({ params: { id } })

function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'task-api',
    description: '',
    repoUrl: 'https://github.com/user/task-api',
    branch: 'build/auto-task-api',
    stage: 'building',
    statusJson: null,
    percentage: 60,
    currentTask: 12,
    totalTasks: 20,
    errorCount: 0,
    lastPolledAt: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  }
}

describe('POST /api/projects/[id]/refresh', () => {
  beforeEach(() => {
    mocks.mockFindById.mockReset()
    mocks.mockPollProject.mockReset()
  })

  it('returns 200 with updated data on success', async () => {
    const project = makeProject()
    mocks.mockFindById
      .mockResolvedValueOnce(project)
      .mockResolvedValueOnce({ ...project, percentage: 65 })
    mocks.mockPollProject.mockResolvedValue(undefined)

    const res = await POST(dummyReq, makeParams('1'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe(1)
    expect(body.data.percentage).toBe(65)
  })

  it('non-existent project returns 404', async () => {
    mocks.mockFindById.mockResolvedValue(null)
    const res = await POST(dummyReq, makeParams('999'))
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.error.message).toBe('Project not found')
  })

  it('invalid id returns 400', async () => {
    const res = await POST(dummyReq, makeParams('abc'))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.message).toBe('Invalid project ID')
  })

  it('GitHub fetch failure returns 502', async () => {
    mocks.mockFindById.mockResolvedValueOnce(makeProject())
    mocks.mockPollProject.mockRejectedValue(new Error('GitHub error'))

    const res = await POST(dummyReq, makeParams('1'))
    const body = await res.json()
    expect(res.status).toBe(502)
    expect(body.error.message).toBe('Failed to fetch STATUS.json from GitHub')
  })
})
