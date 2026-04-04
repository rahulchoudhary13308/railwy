'use client'

import { useParams } from 'next/navigation'
import useSWR from 'swr'
import type { Project } from '@/types/index'
import { ProjectDetail } from '@/components/ProjectDetail'
import { useState } from 'react'

const POLL_INTERVAL = parseInt(
  process.env.NEXT_PUBLIC_POLL_INTERVAL ?? '30000',
  10
)

async function fetcher(url: string) {
  const res = await fetch(url)
  const json = await res.json()
  return json.data
}

export default function ProjectDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [isRefreshing, setIsRefreshing] = useState(false)

  const { data: project, isLoading, mutate } = useSWR<Project>(
    `/api/projects/${id}`,
    fetcher,
    { refreshInterval: POLL_INTERVAL }
  )

  async function handleRefresh() {
    setIsRefreshing(true)
    try {
      await fetch(`/api/projects/${id}/refresh`, { method: 'POST' })
      await mutate()
    } finally {
      setIsRefreshing(false)
    }
  }

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-gray-400">Loading project...</p>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="container mx-auto px-4 py-8">
        <p className="text-red-400">Project not found.</p>
      </main>
    )
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <a href="/" className="mb-4 inline-block text-sm text-blue-400 hover:underline">
        &larr; Back to dashboard
      </a>
      <ProjectDetail
        project={project}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    </main>
  )
}
