'use client'

import useSWR from 'swr'
import type { Project } from '@/types/index'
import { ProjectCard } from '@/components/ProjectCard'

const POLL_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_POLL_INTERVAL ?? '30000',
  10
)

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  return json.data
}

export default function HomePage() {
  const { data: projects, isLoading } = useSWR<Project[]>(
    '/api/projects',
    fetcher,
    { refreshInterval: POLL_INTERVAL }
  )

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Railwy Dashboard</h1>
      <p className="mt-2 text-gray-400">
        Real-time monitoring for autonomous AI code generation projects
      </p>

      <div className="mt-8">
        {isLoading && (
          <p className="text-gray-400">Loading projects...</p>
        )}

        {!isLoading && (!projects || projects.length === 0) && (
          <p className="text-gray-500">No projects registered yet.</p>
        )}

        {projects && projects.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
