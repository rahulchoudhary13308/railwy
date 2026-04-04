import { ProjectRepository } from '@/repositories/project'
import { fetchStatusJson } from '@/lib/github'
import { parseGitHubUrl } from '@/lib/github'
import type { Project, StatusJson } from '@/types/index'

const repo = new ProjectRepository()

export async function pollProject(project: Project): Promise<void> {
  if (project.stage === 'complete') {
    return
  }

  const { owner, repo: repoName } = parseGitHubUrl(project.repoUrl)
  let statusJson: StatusJson | null = null

  try {
    statusJson = await fetchStatusJson(owner, repoName, project.branch)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    await repo.createPollLog(project.id, false, message)
    return
  }

  if (!statusJson) {
    await repo.update(project.id, { stage: 'pending' })
    await repo.createPollLog(project.id, false, 'STATUS.json not found (404)')
    return
  }

  const isFirstPoll = !project.lastPolledAt

  await repo.update(project.id, {
    stage: statusJson.stage,
    statusJson,
    percentage: statusJson.progress.percentage,
    currentTask: statusJson.progress.current_task,
    totalTasks: statusJson.progress.total_tasks,
    errorCount: statusJson.errors.length,
    lastPolledAt: new Date(),
    ...(isFirstPoll
      ? { name: statusJson.project, description: statusJson.description }
      : {}),
  })

  await repo.createPollLog(project.id, true, null)
}
