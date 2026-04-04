import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const mockFindAll = vi.fn()
  return { mockFindAll }
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
    findAll: mocks.mockFindAll,
  })),
}))

import { GET } from '@/app/api/projects/route'

function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'task-api',
    description: '',
    repoUrl: 'https://github.com/user/task-api',
    branch: 'build/auto-task-api',
    stage: 'building',
    statusJson: null,
    percentage: 50,
    currentTask: 5,
    totalTasks: 10,
    errorCount: 0,
    lastPolledAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    ...overrides,
  }
}

describe('GET /api/projects', () => {
  beforeEach(() => {
    mocks.mockFindAll.mockReset()
  })

  it('returns 200 with array of projects', async () => {
    mocks.mockFindAll.mockResolvedValue([makeProject()])
    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
  })

  it('returns projects sorted by updated_at descending', async () => {
    const p1 = makeProject({ id: 1, updatedAt: new Date('2026-01-01') })
    const p2 = makeProject({ id: 2, updatedAt: new Date('2026-01-03') })
    mocks.mockFindAll.mockResolvedValue([p2, p1])

    const res = await GET()
    const body = await res.json()
    expect(body.data[0].id).toBe(2)
    expect(body.data[1].id).toBe(1)
  })

  it('each project has all required camelCase fields', async () => {
    mocks.mockFindAll.mockResolvedValue([makeProject()])
    const res = await GET()
    const body = await res.json()
    const p = body.data[0]
    expect(p).toHaveProperty('id')
    expect(p).toHaveProperty('name')
    expect(p).toHaveProperty('repoUrl')
    expect(p).toHaveProperty('branch')
    expect(p).toHaveProperty('stage')
    expect(p).toHaveProperty('percentage')
    expect(p).toHaveProperty('currentTask')
    expect(p).toHaveProperty('totalTasks')
    expect(p).toHaveProperty('errorCount')
    expect(p).toHaveProperty('lastPolledAt')
    expect(p).toHaveProperty('createdAt')
    expect(p).toHaveProperty('updatedAt')
  })

  it('empty database returns empty array', async () => {
    mocks.mockFindAll.mockResolvedValue([])
    const res = await GET()
    const body = await res.json()
    expect(body).toEqual({ data: [] })
  })
})
