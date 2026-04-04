'use client'

import type { Project } from '@/types/index'
import { formatDistanceToNow } from 'date-fns'

interface ProjectCardProps {
  project: Project
}

const STAGE_COLORS: Record<string, string> = {
  pending: 'bg-gray-600',
  plan_review: 'bg-yellow-600',
  building: 'bg-blue-600',
  testing: 'bg-purple-600',
  complete: 'bg-green-600',
  error: 'bg-red-600',
}

export function ProjectCard({ project }: ProjectCardProps) {
  const stageBg = STAGE_COLORS[project.stage] ?? 'bg-gray-600'

  return (
    <a
      href={`/projects/${project.id}`}
      className="block rounded-lg border border-gray-800 bg-gray-900 p-5 transition hover:border-gray-600"
    >
      <div className="flex items-start justify-between">
        <h3 className="text-lg font-semibold text-gray-100">{project.name}</h3>
        <span
          className={`rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${stageBg}`}
        >
          {project.stage}
        </span>
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Progress</span>
          <span>{project.percentage}%</span>
        </div>
        <div className="mt-1 h-2 w-full rounded-full bg-gray-800">
          <div
            className="h-2 rounded-full bg-blue-500 transition-all"
            style={{ width: `${project.percentage}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-4 text-sm text-gray-400">
        <span>
          Task {project.currentTask}/{project.totalTasks}
        </span>
        {project.errorCount > 0 && (
          <span className="flex items-center gap-1 text-red-400">
            {project.errorCount} error{project.errorCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {project.lastPolledAt && (
        <p className="mt-2 text-xs text-gray-500">
          Polled {formatDistanceToNow(new Date(project.lastPolledAt))} ago
        </p>
      )}
    </a>
  )
}
