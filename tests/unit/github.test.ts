import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { parseGitHubUrl, fetchStatusJson } from '@/lib/github'

describe('parseGitHubUrl', () => {
  it('extracts owner and repo from valid URL', () => {
    const result = parseGitHubUrl('https://github.com/user/task-api')
    expect(result).toEqual({ owner: 'user', repo: 'task-api' })
  })

  it('handles URL with trailing slash', () => {
    const result = parseGitHubUrl('https://github.com/user/task-api/')
    expect(result).toEqual({ owner: 'user', repo: 'task-api' })
  })

  it('handles URL with .git suffix', () => {
    const result = parseGitHubUrl('https://github.com/user/task-api.git')
    expect(result).toEqual({ owner: 'user', repo: 'task-api' })
  })

  it('rejects non-GitHub URL', () => {
    expect(() => parseGitHubUrl('https://gitlab.com/user/repo')).toThrow('Invalid GitHub URL')
  })

  it('rejects malformed URL', () => {
    expect(() => parseGitHubUrl('not-a-url')).toThrow('Invalid GitHub URL')
  })
})

describe('fetchStatusJson', () => {
  const originalFetch = globalThis.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns null on GitHub 404', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    }) as unknown as typeof fetch

    const result = await fetchStatusJson('user', 'repo', 'main')
    expect(result).toBeNull()
  })

  it('throws descriptive error on rate limit (403)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      status: 403,
      ok: false,
    }) as unknown as typeof fetch

    await expect(fetchStatusJson('user', 'repo', 'main')).rejects.toThrow(
      'GitHub API rate limit exceeded'
    )
  })

  it('throws descriptive error on network failure', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(
      new Error('fetch failed')
    ) as unknown as typeof fetch

    await expect(fetchStatusJson('user', 'repo', 'main')).rejects.toThrow(
      'fetch failed'
    )
  })
})
