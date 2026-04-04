import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const mockGetStats = vi.fn()
  return { mockGetStats }
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
    getStats: mocks.mockGetStats,
  })),
}))

import { GET } from '@/app/api/stats/route'

describe('GET /api/stats', () => {
  beforeEach(() => {
    mocks.mockGetStats.mockReset()
  })

  it('returns 200 with correct aggregate stats', async () => {
    mocks.mockGetStats.mockResolvedValue({
      totalProjects: 5,
      activeProjects: 2,
      completedProjects: 2,
      erroredProjects: 1,
      totalTasksCompleted: 87,
      totalTasksRemaining: 18,
    })

    const res = await GET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.totalProjects).toBe(5)
    expect(body.data.activeProjects).toBe(2)
    expect(body.data.completedProjects).toBe(2)
    expect(body.data.erroredProjects).toBe(1)
    expect(body.data.totalTasksCompleted).toBe(87)
    expect(body.data.totalTasksRemaining).toBe(18)
  })

  it('zero projects returns all zeros', async () => {
    mocks.mockGetStats.mockResolvedValue({
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      erroredProjects: 0,
      totalTasksCompleted: 0,
      totalTasksRemaining: 0,
    })

    const res = await GET()
    const body = await res.json()
    expect(body.data.totalProjects).toBe(0)
    expect(body.data.totalTasksCompleted).toBe(0)
  })

  it('mix of stages returns correct counts', async () => {
    mocks.mockGetStats.mockResolvedValue({
      totalProjects: 3,
      activeProjects: 1,
      completedProjects: 1,
      erroredProjects: 1,
      totalTasksCompleted: 45,
      totalTasksRemaining: 30,
    })

    const res = await GET()
    const body = await res.json()
    expect(body.data.activeProjects).toBe(1)
    expect(body.data.completedProjects).toBe(1)
    expect(body.data.erroredProjects).toBe(1)
  })

  it('totalTasksCompleted sums across all projects', async () => {
    mocks.mockGetStats.mockResolvedValue({
      totalProjects: 2,
      activeProjects: 2,
      completedProjects: 0,
      erroredProjects: 0,
      totalTasksCompleted: 30,
      totalTasksRemaining: 20,
    })

    const res = await GET()
    const body = await res.json()
    expect(body.data.totalTasksCompleted).toBe(30)
    expect(body.data.totalTasksRemaining).toBe(20)
  })
})
