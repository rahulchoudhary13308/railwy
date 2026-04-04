import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const mockFindById = vi.fn()
  const mockDelete = vi.fn()
  return { mockFindById, mockDelete }
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
    delete: mocks.mockDelete,
  })),
}))

import { GET, DELETE } from '@/app/api/projects/[id]/route'

function makeProject(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'task-api',
    description: '',
    repoUrl: 'https://github.com/user/task-api',
    branch: 'build/auto-task-api',
    stage: 'building',
    statusJson: { project: 'task-api', stage: 'building' },
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

function makeParams(id: string) {
  return { params: { id } }
}

const dummyReq = new Request('http://localhost')

describe('GET /api/projects/[id]', () => {
  beforeEach(() => {
    mocks.mockFindById.mockReset()
  })

  it('returns 200 with full data including statusJson', async () => {
    mocks.mockFindById.mockResolvedValue(makeProject())
    const res = await GET(dummyReq, makeParams('1'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.statusJson).toBeDefined()
    expect(typeof body.data.statusJson).toBe('object')
  })

  it('non-existent id returns 404', async () => {
    mocks.mockFindById.mockResolvedValue(null)
    const res = await GET(dummyReq, makeParams('999'))
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.error.message).toBe('Project not found')
  })

  it('non-numeric id returns 400', async () => {
    const res = await GET(dummyReq, makeParams('abc'))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.message).toBe('Invalid project ID')
  })

  it('statusJson is parsed as object, not string', async () => {
    mocks.mockFindById.mockResolvedValue(makeProject())
    const res = await GET(dummyReq, makeParams('1'))
    const body = await res.json()
    expect(typeof body.data.statusJson).toBe('object')
    expect(body.data.statusJson).not.toBeNull()
  })
})

describe('DELETE /api/projects/[id]', () => {
  beforeEach(() => {
    mocks.mockDelete.mockReset()
  })

  it('existing project returns 200 with success message', async () => {
    mocks.mockDelete.mockResolvedValue(true)
    const res = await DELETE(dummyReq, makeParams('1'))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.message).toBe('Project removed successfully')
  })

  it('non-existent id returns 404', async () => {
    mocks.mockDelete.mockResolvedValue(false)
    const res = await DELETE(dummyReq, makeParams('999'))
    const body = await res.json()
    expect(res.status).toBe(404)
    expect(body.error.message).toBe('Project not found')
  })

  it('non-numeric id returns 400', async () => {
    const res = await DELETE(dummyReq, makeParams('abc'))
    const body = await res.json()
    expect(res.status).toBe(400)
    expect(body.error.message).toBe('Invalid project ID')
  })
})
