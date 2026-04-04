/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { SearchFilter } from '@/components/SearchFilter'

describe('SearchFilter', () => {
  const defaults = {
    search: '',
    onSearchChange: vi.fn(),
    stageFilter: 'all',
    onStageFilterChange: vi.fn(),
  }

  it('renders search input and stage dropdown', () => {
    render(<SearchFilter {...defaults} />)
    expect(screen.getByPlaceholderText('Search by name...')).toBeInTheDocument()
    expect(screen.getByDisplayValue('All stages')).toBeInTheDocument()
  })

  it('typing in search calls onSearchChange', () => {
    const onChange = vi.fn()
    render(<SearchFilter {...defaults} onSearchChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('Search by name...'), {
      target: { value: 'task' },
    })
    expect(onChange).toHaveBeenCalledWith('task')
  })

  it('selecting stage calls onStageFilterChange', () => {
    const onChange = vi.fn()
    render(<SearchFilter {...defaults} onStageFilterChange={onChange} />)
    fireEvent.change(screen.getByDisplayValue('All stages'), {
      target: { value: 'building' },
    })
    expect(onChange).toHaveBeenCalledWith('building')
  })
})
