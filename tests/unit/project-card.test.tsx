/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ProjectCard } from '@/components/ProjectCard'
import type { Project } from '@/types/index'

vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn().mockReturnValue('5 minutes'),
}))

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    name: 'task-api',
    description: '',
    repoUrl: 'https://github.com/user/task-api',
    branch: 'build/auto-task-api',
    stage: 'building',
    statusJson: null,
    percentage: 50,
    currentTask: 5,
    totalTasks: 10,
    errorCount: 0,
    lastPolledAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('ProjectCard', () => {
  it('renders with all required fields visible', () => {
    render(<ProjectCard project={makeProject()} />)
    expect(screen.getByText('task-api')).toBeInTheDocument()
    expect(screen.getByText('building')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Task 5/10')).toBeInTheDocument()
  })

  it('shows correct stage badge color for building', () => {
    render(<ProjectCard project={makeProject({ stage: 'building' })} />)
    const badge = screen.getByText('building')
    expect(badge.className).toContain('bg-blue-600')
  })

  it('shows correct stage badge color for complete', () => {
    render(<ProjectCard project={makeProject({ stage: 'complete' })} />)
    const badge = screen.getByText('complete')
    expect(badge.className).toContain('bg-green-600')
  })

  it('shows correct stage badge color for error', () => {
    render(<ProjectCard project={makeProject({ stage: 'error' })} />)
    const badge = screen.getByText('error')
    expect(badge.className).toContain('bg-red-600')
  })

  it('progress bar width matches percentage', () => {
    const { container } = render(<ProjectCard project={makeProject({ percentage: 75 })} />)
    const bar = container.querySelector('[style*="width"]')
    expect(bar).toHaveAttribute('style', 'width: 75%;')
  })

  it('hides error count when errorCount is 0', () => {
    render(<ProjectCard project={makeProject({ errorCount: 0 })} />)
    expect(screen.queryByText(/error/)).not.toBeInTheDocument()
  })

  it('shows error count when errorCount > 0', () => {
    render(<ProjectCard project={makeProject({ errorCount: 3 })} />)
    expect(screen.getByText('3 errors')).toBeInTheDocument()
  })
})
