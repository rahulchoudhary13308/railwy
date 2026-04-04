/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ProjectDetail } from '@/components/ProjectDetail'
import type { Project, StatusJson } from '@/types/index'

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 1,
    name: 'task-api',
    description: 'A test project',
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

function makeStatus(overrides: Partial<StatusJson> = {}): StatusJson {
  return {
    project: 'task-api',
    description: 'A test project',
    stage: 'building',
    plan_review: 'approved',
    progress: {
      total_tasks: 10,
      completed: 5,
      current_task: 6,
      current_task_name: 'Auth',
      current_task_status: 'coding',
      percentage: 50,
    },
    branch: 'build/auto',
    last_updated: '',
    tasks: [
      { id: 1, name: 'Scaffold', status: 'done' },
      { id: 2, name: 'DB setup', status: 'coding' },
    ],
    verification: {
      build: 'pass',
      lint: 'pass',
      typecheck: 'pass',
      tests: 'fail',
      coverage: 82,
    },
    errors: [],
    ...overrides,
  }
}

describe('ProjectDetail', () => {
  const noop = vi.fn()

  it('renders with all sections visible', () => {
    const project = makeProject({ statusJson: makeStatus() })
    render(<ProjectDetail project={project} onRefresh={noop} isRefreshing={false} />)
    expect(screen.getByText('task-api')).toBeInTheDocument()
    expect(screen.getByText('Verification')).toBeInTheDocument()
    expect(screen.getByText('Tasks')).toBeInTheDocument()
  })

  it('shows correct status icons per task', () => {
    const project = makeProject({ statusJson: makeStatus() })
    render(<ProjectDetail project={project} onRefresh={noop} isRefreshing={false} />)
    expect(screen.getByText('Scaffold')).toBeInTheDocument()
    expect(screen.getByText('DB setup')).toBeInTheDocument()
  })

  it('shows pass/fail indicators in verification', () => {
    const project = makeProject({ statusJson: makeStatus() })
    render(<ProjectDetail project={project} onRefresh={noop} isRefreshing={false} />)
    const passes = screen.getAllByText('PASS')
    expect(passes.length).toBe(3)
    expect(screen.getByText('FAIL')).toBeInTheDocument()
  })

  it('refresh button triggers API call', () => {
    const onRefresh = vi.fn()
    render(<ProjectDetail project={makeProject()} onRefresh={onRefresh} isRefreshing={false} />)
    fireEvent.click(screen.getByText('Refresh'))
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('hides error section when no errors', () => {
    const project = makeProject({ statusJson: makeStatus({ errors: [] }) })
    render(<ProjectDetail project={project} onRefresh={noop} isRefreshing={false} />)
    expect(screen.queryByText(/Errors/)).not.toBeInTheDocument()
  })

  it('shows errors when present', () => {
    const project = makeProject({
      statusJson: makeStatus({
        errors: [{ message: 'Build failed', file: 'src/index.ts', line: 42 }],
      }),
    })
    render(<ProjectDetail project={project} onRefresh={noop} isRefreshing={false} />)
    expect(screen.getByText('Errors (1)')).toBeInTheDocument()
    expect(screen.getByText('Build failed')).toBeInTheDocument()
    expect(screen.getByText('src/index.ts:42')).toBeInTheDocument()
  })
})
