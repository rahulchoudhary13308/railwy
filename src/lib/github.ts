import type { StatusJson } from '@/types/index'

const GITHUB_URL_REGEX = /^https:\/\/github\.com\/([a-zA-Z0-9_.-]+)\/([a-zA-Z0-9_.-]+)\/?$/

export interface GitHubRepoInfo {
  owner: string
  repo: string
}

export function parseGitHubUrl(url: string): GitHubRepoInfo {
  const normalized = url.replace(/\.git$/, '').replace(/\/$/, '')
  const match = normalized.match(GITHUB_URL_REGEX)
  if (!match) {
    throw new Error('Invalid GitHub URL')
  }
  return { owner: match[1], repo: match[2] }
}

export async function fetchStatusJson(
  owner: string,
  repo: string,
  branch: string
): Promise<StatusJson | null> {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/.status/STATUS.json?ref=${branch}`
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3.raw',
    'User-Agent': 'railwy-dashboard',
  }

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }

  const response = await fetch(url, { headers })

  if (response.status === 404) {
    return null
  }

  if (response.status === 403) {
    throw new Error('GitHub API rate limit exceeded')
  }

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as StatusJson
  return data
}
