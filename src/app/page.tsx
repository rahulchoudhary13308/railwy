'use client'

import { useState } from 'react'
import useSWR from 'swr'
import type { Project, ProjectStats } from '@/types/index'
import { ProjectCard } from '@/components/ProjectCard'
import { SearchFilter } from '@/components/SearchFilter'
import { RegisterProject } from '@/components/RegisterProject'
import { StatsBar } from '@/components/StatsBar'

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
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')

  const { data: projects, isLoading, mutate } = useSWR<Project[]>(
    '/api/projects',
    fetcher,
    { refreshInterval: POLL_INTERVAL }
  )

  const { data: stats } = useSWR<ProjectStats>(
    '/api/stats',
    fetcher,
    { refreshInterval: POLL_INTERVAL }
  )

  const filtered = (projects ?? []).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesStage = stageFilter === 'all' || p.stage === stageFilter
    return matchesSearch && matchesStage
  })

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold">Railwy Dashboard</h1>
      <p className="mt-2 text-gray-400">
        Real-time monitoring for autonomous AI code generation projects
      </p>

      {stats && <div className="mt-6"><StatsBar stats={stats} /></div>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <SearchFilter
          search={search}
          onSearchChange={setSearch}
          stageFilter={stageFilter}
          onStageFilterChange={setStageFilter}
        />
        <RegisterProject onSuccess={() => mutate()} />
      </div>

      <div className="mt-6">
        {isLoading && (
          <p className="text-gray-400">Loading projects...</p>
        )}

        {!isLoading && filtered.length === 0 && (
          <p className="text-gray-500">
            {projects && projects.length > 0
              ? 'No matching projects'
              : 'No projects registered yet.'}
          </p>
        )}

        {filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
