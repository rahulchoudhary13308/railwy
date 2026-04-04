import { describe, it, expect, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => {
  const mockRelease = vi.fn()
  const mockExecute = vi.fn().mockResolvedValue([[], []])
  const mockConnection = { execute: mockExecute, release: mockRelease }
  const mockQuery = vi.fn().mockResolvedValue([[], []])
  const mockGetConnection = vi.fn().mockResolvedValue(mockConnection)
  const mockPoolInstance = {
    getConnection: mockGetConnection,
    execute: mockQuery,
    query: mockQuery,
  }
  const mockCreatePool = vi.fn().mockReturnValue(mockPoolInstance)
  return { mockRelease, mockExecute, mockGetConnection, mockCreatePool, mockPoolInstance }
})

vi.mock('mysql2/promise', () => ({
  default: { createPool: mocks.mockCreatePool },
  createPool: mocks.mockCreatePool,
}))

import { pool, migrate } from '@/lib/db'

describe('db module', () => {
  describe('pool creation', () => {
    it('creates pool with config from environment variables', () => {
      expect(mocks.mockCreatePool).toHaveBeenCalledWith(
        expect.objectContaining({
          host: expect.any(String),
          port: expect.any(Number),
          user: expect.any(String),
          database: expect.any(String),
          waitForConnections: true,
          connectionLimit: 10,
        })
      )
    })

    it('exports a pool instance', () => {
      expect(pool).toBeDefined()
      expect(pool).toBe(mocks.mockPoolInstance)
    })
  })

  describe('migrate()', () => {
    beforeEach(() => {
      mocks.mockExecute.mockClear()
      mocks.mockGetConnection.mockClear()
      mocks.mockRelease.mockClear()
    })

    it('creates projects table with correct schema', async () => {
      await migrate()
      const projectsSql = mocks.mockExecute.mock.calls[0][0] as string
      expect(projectsSql).toMatch(/CREATE TABLE IF NOT EXISTS projects/)
      expect(projectsSql).toMatch(/repo_url VARCHAR\(500\) NOT NULL UNIQUE/)
      expect(projectsSql).toMatch(/AUTO_INCREMENT/)
      expect(projectsSql).toMatch(/status_json JSON/)
    })

    it('creates poll_logs table with FK and ON DELETE CASCADE', async () => {
      await migrate()
      const pollLogsSql = mocks.mockExecute.mock.calls[1][0] as string
      expect(pollLogsSql).toMatch(/CREATE TABLE IF NOT EXISTS poll_logs/)
      expect(pollLogsSql).toMatch(/FOREIGN KEY \(project_id\) REFERENCES projects\(id\) ON DELETE CASCADE/)
    })

    it('is idempotent — both statements use IF NOT EXISTS', async () => {
      await migrate()
      await migrate()
      const allSql = mocks.mockExecute.mock.calls.map((c) => c[0] as string)
      for (const sql of allSql) {
        expect(sql).toMatch(/IF NOT EXISTS/)
      }
    })

    it('releases connection after migration completes', async () => {
      await migrate()
      expect(mocks.mockRelease).toHaveBeenCalledTimes(1)
    })

    it('releases connection even when migration throws', async () => {
      mocks.mockExecute.mockRejectedValueOnce(new Error('SQL error'))
      await expect(migrate()).rejects.toThrow('SQL error')
      expect(mocks.mockRelease).toHaveBeenCalledTimes(1)
    })
  })

  describe('concurrent pool access', () => {
    it('handles multiple concurrent queries', async () => {
      const queries = Array.from({ length: 5 }, (_, i) => pool.query(`SELECT ${i}`))
      const results = await Promise.all(queries)
      expect(results).toHaveLength(5)
    })
  })
})
