import { ProjectRepository } from '@/repositories/project'
import type { Project, ProjectStats } from '@/types/index'

export class ProjectService {
  private repo: ProjectRepository

  constructor(repo?: ProjectRepository) {
    this.repo = repo ?? new ProjectRepository()
  }

  async getById(id: number): Promise<Project | null> {
    return this.repo.findById(id)
  }

  async getAll(): Promise<Project[]> {
    return this.repo.findAll()
  }

  async remove(id: number): Promise<boolean> {
    return this.repo.delete(id)
  }

  async getStats(): Promise<ProjectStats> {
    return this.repo.getStats()
  }
}
