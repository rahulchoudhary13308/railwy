/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ErrorPanel } from '@/components/ErrorPanel'
import { StatsBar } from '@/components/StatsBar'

describe('ErrorPanel', () => {
  it('renders list of errors', () => {
    render(
      <ErrorPanel
        errors={[
          { message: 'Build failed', file: 'src/index.ts', line: 42 },
          { message: 'Lint error' },
        ]}
      />
    )
    expect(screen.getByText('Build failed')).toBeInTheDocument()
    expect(screen.getByText('Lint error')).toBeInTheDocument()
  })

  it('shows file and line number', () => {
    render(<ErrorPanel errors={[{ message: 'err', file: 'app.ts', line: 10 }]} />)
    expect(screen.getByText('app.ts:10')).toBeInTheDocument()
  })

  it('shows "No errors" when empty', () => {
    render(<ErrorPanel errors={[]} />)
    expect(screen.getByText('No errors')).toBeInTheDocument()
  })

  it('handles error missing file/line without crash', () => {
    render(<ErrorPanel errors={[{ message: 'Unknown error' }]} />)
    expect(screen.getByText('Unknown error')).toBeInTheDocument()
  })
})

describe('StatsBar', () => {
  const stats = {
    totalProjects: 5,
    activeProjects: 2,
    completedProjects: 2,
    erroredProjects: 1,
    totalTasksCompleted: 87,
    totalTasksRemaining: 18,
  }

  it('renders all stat values', () => {
    render(<StatsBar stats={stats} />)
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('87')).toBeInTheDocument()
    expect(screen.getByText('18')).toBeInTheDocument()
  })

  it('shows correct color for active (blue)', () => {
    render(<StatsBar stats={stats} />)
    const active = screen.getByText('2', { selector: '.text-blue-400' })
    expect(active).toBeInTheDocument()
  })

  it('shows correct color for errored (red)', () => {
    render(<StatsBar stats={stats} />)
    const errored = screen.getByText('1')
    expect(errored.className).toContain('text-red-400')
  })

  it('handles zero values gracefully', () => {
    render(
      <StatsBar
        stats={{
          totalProjects: 0,
          activeProjects: 0,
          completedProjects: 0,
          erroredProjects: 0,
          totalTasksCompleted: 0,
          totalTasksRemaining: 0,
        }}
      />
    )
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBeGreaterThan(0)
  })
})
