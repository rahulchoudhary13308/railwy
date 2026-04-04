import { describe, it, expect, vi } from 'vitest'

vi.mock('next/server', () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => {
      return new Response(JSON.stringify(data), {
        status: (init as { status?: number } | undefined)?.status ?? 200,
        headers: { 'content-type': 'application/json' },
      })
    },
  },
}))

import { GET } from '@/app/api/health/route'

describe('GET /api/health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const response = await GET()
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data).toEqual({ status: 'ok' })
  })
})
