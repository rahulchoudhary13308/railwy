'use client'

import type { StatusError } from '@/types/index'

interface ErrorPanelProps {
  errors: StatusError[]
}

export function ErrorPanel({ errors }: ErrorPanelProps) {
  if (errors.length === 0) {
    return <p className="text-sm text-gray-500">No errors</p>
  }

  const sorted = [...errors].sort((a, b) => {
    if (!a.timestamp || !b.timestamp) return 0
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  return (
    <ul className="space-y-2">
      {sorted.map((error, i) => (
        <li key={i} className="rounded border border-red-900 bg-red-950 p-3">
          <p className="text-sm text-red-300">{error.message}</p>
          {(error.file || error.line !== undefined) && (
            <p className="mt-1 text-xs text-red-400">
              {error.file}{error.line !== undefined ? `:${error.line}` : ''}
            </p>
          )}
          {error.timestamp && (
            <p className="mt-1 text-xs text-gray-500">{error.timestamp}</p>
          )}
        </li>
      ))}
    </ul>
  )
}
