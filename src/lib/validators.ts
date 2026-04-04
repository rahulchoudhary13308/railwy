import { z } from 'zod'

const GITHUB_URL_PATTERN = /^https:\/\/github\.com\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/

export const registerProjectSchema = z.object({
  repoUrl: z
    .string({ required_error: 'repoUrl is required' })
    .min(1, 'repoUrl is required')
    .regex(GITHUB_URL_PATTERN, 'Invalid GitHub URL format'),
  branch: z.string().optional(),
})

export type RegisterProjectInput = z.infer<typeof registerProjectSchema>

export function parseGitHubRepoName(repoUrl: string): string {
  const normalized = repoUrl.replace(/\.git$/, '').replace(/\/$/, '')
  const parts = normalized.split('/')
  return parts[parts.length - 1]
}
