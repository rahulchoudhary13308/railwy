'use client'

import type { ProjectStats } from '@/types/index'

interface StatsBarProps {
  stats: ProjectStats
}

function StatItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className="text-sm text-gray-400">{label}</span>
    </div>
  )
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="flex flex-wrap gap-6 rounded-lg border border-gray-800 bg-gray-900 p-4">
      <StatItem label="Total" value={stats.totalProjects} color="text-gray-100" />
      <StatItem label="Active" value={stats.activeProjects} color="text-blue-400" />
      <StatItem label="Completed" value={stats.completedProjects} color="text-green-400" />
      <StatItem label="Errored" value={stats.erroredProjects} color="text-red-400" />
      <StatItem label="Tasks Done" value={stats.totalTasksCompleted} color="text-green-400" />
      <StatItem label="Tasks Left" value={stats.totalTasksRemaining} color="text-yellow-400" />
    </div>
  )
}
