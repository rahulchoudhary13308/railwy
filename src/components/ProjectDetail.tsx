'use client'

import type { Project, StatusJson, StatusTask, StatusError } from '@/types/index'
import { useState } from 'react'

interface ProjectDetailProps {
  project: Project
  onRefresh: () => void
  isRefreshing: boolean
}

function VerificationBadge({ label, status }: { label: string; status?: string }) {
  const color = status === 'pass' ? 'text-green-400' : status === 'fail' ? 'text-red-400' : 'text-gray-500'
  const icon = status === 'pass' ? 'PASS' : status === 'fail' ? 'FAIL' : '—'
  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs font-mono ${color}`}>{icon}</span>
      <span className="text-sm text-gray-300">{label}</span>
    </div>
  )
}

function TaskItem({ task }: { task: StatusTask }) {
  const icon = task.status === 'done' ? '✓' : task.status === 'coding' || task.status === 'testing' || task.status === 'fixing' ? '►' : '○'
  const color = task.status === 'done' ? 'text-green-400' : task.status === 'pending' ? 'text-gray-500' : 'text-yellow-400'
  return (
    <li className="flex items-center gap-2 py-1">
      <span className={`font-mono text-sm ${color}`}>{icon}</span>
      <span className="text-sm text-gray-300">{task.name}</span>
      <span className="ml-auto text-xs text-gray-500">{task.status}</span>
    </li>
  )
}

function ErrorItem({ error }: { error: StatusError }) {
  return (
    <li className="rounded border border-red-900 bg-red-950 p-3">
      <p className="text-sm text-red-300">{error.message}</p>
      {(error.file || error.line) && (
        <p className="mt-1 text-xs text-red-400">
          {error.file}{error.line ? `:${error.line}` : ''}
        </p>
      )}
      {error.timestamp && (
        <p className="mt-1 text-xs text-gray-500">{error.timestamp}</p>
      )}
    </li>
  )
}

export function ProjectDetail({ project, onRefresh, isRefreshing }: ProjectDetailProps) {
  const status = project.statusJson as StatusJson | null
  const tasks = status?.tasks ?? []
  const errors = status?.errors ?? []
  const verification = status?.verification

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">{project.name}</h1>
          {project.description && (
            <p className="mt-1 text-gray-400">{project.description}</p>
          )}
        </div>
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Verification */}
      {verification && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-200">Verification</h2>
          <div className="flex flex-wrap gap-4 rounded bg-gray-900 p-4">
            <VerificationBadge label="Build" status={verification.build} />
            <VerificationBadge label="Lint" status={verification.lint} />
            <VerificationBadge label="Typecheck" status={verification.typecheck} />
            <VerificationBadge label="Tests" status={verification.tests} />
            {verification.coverage !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-blue-400">{verification.coverage}%</span>
                <span className="text-sm text-gray-300">Coverage</span>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tasks */}
      {tasks.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-200">Tasks</h2>
          <ul className="rounded bg-gray-900 p-4">
            {tasks.map((task) => (
              <TaskItem key={task.id} task={task} />
            ))}
          </ul>
        </section>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-gray-200">
            Errors ({errors.length})
          </h2>
          <ul className="space-y-2">
            {errors.map((error, i) => (
              <ErrorItem key={i} error={error} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
