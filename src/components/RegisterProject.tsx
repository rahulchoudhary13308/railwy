'use client'

import { useState } from 'react'

interface RegisterProjectProps {
  onSuccess: () => void
}

export function RegisterProject({ onSuccess }: RegisterProjectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [repoUrl, setRepoUrl] = useState('')
  const [branch, setBranch] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setIsSubmitting(true)

    try {
      const body: Record<string, string> = { repoUrl }
      if (branch.trim()) body.branch = branch.trim()

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'Failed to register project')
        return
      }

      setSuccess(true)
      setRepoUrl('')
      setBranch('')
      onSuccess()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
      >
        {isOpen ? 'Cancel' : 'Register Project'}
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded border border-gray-700 bg-gray-900 p-4">
          <div>
            <label htmlFor="repoUrl" className="block text-sm text-gray-300">
              GitHub Repository URL
            </label>
            <input
              id="repoUrl"
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/user/repo"
              className="mt-1 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="branch" className="block text-sm text-gray-300">
              Branch (optional)
            </label>
            <input
              id="branch"
              type="text"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="build/auto-repo-name"
              className="mt-1 w-full rounded border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
          {success && <p className="text-sm text-green-400">Project registered successfully!</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Registering...' : 'Submit'}
          </button>
        </form>
      )}
    </div>
  )
}
