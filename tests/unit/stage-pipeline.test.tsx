/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { StagePipeline } from '@/components/StagePipeline'

describe('StagePipeline', () => {
  it('renders all 5 stages', () => {
    render(<StagePipeline currentStage="building" />)
    expect(screen.getByText('pending')).toBeInTheDocument()
    expect(screen.getByText('plan review')).toBeInTheDocument()
    expect(screen.getByText('building')).toBeInTheDocument()
    expect(screen.getByText('testing')).toBeInTheDocument()
    expect(screen.getByText('complete')).toBeInTheDocument()
  })

  it('current stage is highlighted with blue', () => {
    render(<StagePipeline currentStage="building" />)
    const building = screen.getByText('building').closest('div')!
    expect(building.className).toContain('bg-blue-600')
  })

  it('previous stages show checkmark', () => {
    render(<StagePipeline currentStage="building" />)
    const checkmarks = screen.getAllByText('✓')
    expect(checkmarks.length).toBe(2) // pending + plan_review
  })

  it('future stages are dimmed', () => {
    render(<StagePipeline currentStage="building" />)
    const testing = screen.getByText('testing').closest('div')!
    expect(testing.className).toContain('bg-gray-700')
  })

  it('"pending" shows only first step active', () => {
    render(<StagePipeline currentStage="pending" />)
    const pending = screen.getByText('pending').closest('div')!
    expect(pending.className).toContain('bg-blue-600')
    expect(screen.queryAllByText('✓')).toHaveLength(0)
  })

  it('"complete" shows all steps with checkmarks', () => {
    render(<StagePipeline currentStage="complete" />)
    const checkmarks = screen.getAllByText('✓')
    expect(checkmarks.length).toBe(4) // all except complete itself
  })

  it('"error" stage shows error badge and dims all pipeline stages', () => {
    render(<StagePipeline currentStage="error" />)
    expect(screen.getByText('error')).toBeInTheDocument()
    const errorBadge = screen.getByText('error').closest('div')!
    expect(errorBadge.className).toContain('bg-red-600')
    // All normal stages should be dimmed (gray)
    const pending = screen.getByText('pending').closest('div')!
    expect(pending.className).toContain('bg-gray-700')
  })
})
