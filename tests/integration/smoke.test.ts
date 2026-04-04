import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mocks = vi.hoisted(() => {
  const mockExecute = vi.fn()
  const mockRelease = vi.fn()
  const mockGetConnection = vi.fn().mockResolvedValue({
    execute: vi.fn().mockResolvedValue([[], []]),
    release: vi.fn(),
  })
  const mockPool = {
    execute: mockExecute,
    query: mockExecute,
    getConnection: mockGetConnection,
  }
  const mockCreatePool = vi.fn().mockReturnValue(mockPool)
  return { mockExecute, mockCreatePool, mockRelease }
})

vi.mock('mysql2/promise', () => ({
  default: { createPool: mocks.mockCreatePool },
  createPool: mocks.mockCreatePool,
}))

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: { status?: number }) =>
      new Response(JSON.stringify(data), {
        status: init?.status ?? 200,
        headers: { 'content-type': 'application/json' },
      }),
  },
}))

import { GET as healthGET } from '@/app/api/health/route'
import { GET as projectsGET, POST as projectsPOST } from '@/app/api/projects/route'
import { GET as projectGET, DELETE as projectDELETE } from '@/app/api/projects/[id]/route'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/projects', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeProjectRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    name: 'task-api',
    description: '',
    repo_url: 'https://github.com/user/task-api',
    branch: 'build/auto-task-api',
    stage: 'pending',
    status_json: null,
    percentage: 0,
    current_task: 0,
    total_tasks: 0,
    error_count: 0,
    last_polled_at: null,
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  }
}

// ─── Smoke test: Tasks 1-4 ───────────────────────────────────────────────────

describe('Smoke test checkpoint 1 (Tasks 1-4)', () => {
  beforeEach(() => {
    mocks.mockExecute.mockReset()
  })

  it('GET /api/health returns 200 with { status: "ok" }', async () => {
    const res = await healthGET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ status: 'ok' })
  })

  it('POST /api/projects with valid GitHub URL returns 201', async () => {
    // findByRepoUrl returns empty (no duplicate)
    mocks.mockExecute.mockResolvedValueOnce([[], []])
    // create INSERT
    mocks.mockExecute.mockResolvedValueOnce([{ insertId: 1 }, []])
    // findById after insert
    mocks.mockExecute.mockResolvedValueOnce([[makeProjectRow()], []])

    const res = await projectsPOST(
      makeRequest({ repoUrl: 'https://github.com/user/task-api' })
    )
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(body.data.id).toBe(1)
    expect(body.data.name).toBe('task-api')
    expect(body.data.repoUrl).toBe('https://github.com/user/task-api')
    expect(body.data.branch).toBe('build/auto-task-api')
  })

  it('POST same URL again returns 409 conflict', async () => {
    // findByRepoUrl returns existing project
    mocks.mockExecute.mockResolvedValueOnce([[makeProjectRow()], []])

    const res = await projectsPOST(
      makeRequest({ repoUrl: 'https://github.com/user/task-api' })
    )
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.error.code).toBe('CONFLICT')
    expect(body.error.message).toBe('Project already registered')
  })

  it('database receives the registered project with correct fields', async () => {
    mocks.mockExecute.mockResolvedValueOnce([[], []])
    mocks.mockExecute.mockResolvedValueOnce([{ insertId: 1 }, []])
    mocks.mockExecute.mockResolvedValueOnce([[makeProjectRow()], []])

    await projectsPOST(
      makeRequest({ repoUrl: 'https://github.com/user/task-api' })
    )

    // Verify the INSERT was called with correct params
    const insertCall = mocks.mockExecute.mock.calls[1]
    expect(insertCall[0]).toContain('INSERT INTO projects')
    expect(insertCall[1]).toEqual([
      'task-api',
      '',
      'https://github.com/user/task-api',
      'build/auto-task-api',
    ])
  })

  it('entire flow completes without errors', async () => {
    // Health check
    const healthRes = await healthGET()
    expect(healthRes.status).toBe(200)

    // Register project
    mocks.mockExecute.mockResolvedValueOnce([[], []])
    mocks.mockExecute.mockResolvedValueOnce([{ insertId: 1 }, []])
    mocks.mockExecute.mockResolvedValueOnce([[makeProjectRow()], []])

    const registerRes = await projectsPOST(
      makeRequest({ repoUrl: 'https://github.com/user/task-api' })
    )
    expect(registerRes.status).toBe(201)

    // Duplicate check
    mocks.mockExecute.mockResolvedValueOnce([[makeProjectRow()], []])
    const dupRes = await projectsPOST(
      makeRequest({ repoUrl: 'https://github.com/user/task-api' })
    )
    expect(dupRes.status).toBe(409)
  })
})

// ─── Smoke test: Tasks 6-9 ───────────────────────────────────────────────────

describe('Smoke test checkpoint 2 (Tasks 6-9)', () => {
  beforeEach(() => {
    mocks.mockExecute.mockReset()
  })

  it('GET /api/projects returns registered project in list', async () => {
    mocks.mockExecute.mockResolvedValueOnce([[makeProjectRow()], []])
    const res = await projectsGET()
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].name).toBe('task-api')
  })

  it('GET /api/projects/[id] returns full detail with all fields', async () => {
    mocks.mockExecute.mockResolvedValueOnce([[makeProjectRow({ status_json: '{"stage":"building"}' })], []])
    const res = await projectGET(new Request('http://localhost'), { params: { id: '1' } })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe(1)
    expect(body.data.repoUrl).toBe('https://github.com/user/task-api')
  })

  it('DELETE /api/projects/[id] removes project', async () => {
    mocks.mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }, []])
    const res = await projectDELETE(new Request('http://localhost'), { params: { id: '1' } })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.message).toBe('Project removed successfully')
  })

  it('GET /api/projects after delete returns empty list', async () => {
    mocks.mockExecute.mockResolvedValueOnce([[], []])
    const res = await projectsGET()
    const body = await res.json()
    expect(body.data).toEqual([])
  })

  it('entire flow completes without errors', async () => {
    // List
    mocks.mockExecute.mockResolvedValueOnce([[makeProjectRow()], []])
    const listRes = await projectsGET()
    expect(listRes.status).toBe(200)

    // Detail
    mocks.mockExecute.mockResolvedValueOnce([[makeProjectRow()], []])
    const detailRes = await projectGET(new Request('http://localhost'), { params: { id: '1' } })
    expect(detailRes.status).toBe(200)

    // Delete
    mocks.mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }, []])
    const deleteRes = await projectDELETE(new Request('http://localhost'), { params: { id: '1' } })
    expect(deleteRes.status).toBe(200)
  })
})
