import { parseGitHubUrl, fetchStatusJson } from '@/lib/github'
import type { StatusJson } from '@/types/index'

export class GitHubService {
  async fetchStatus(repoUrl: string, branch: string): Promise<StatusJson | null> {
    const { owner, repo } = parseGitHubUrl(repoUrl)
    return fetchStatusJson(owner, repo, branch)
  }
}
