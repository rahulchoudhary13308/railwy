/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RegisterProject } from '@/components/RegisterProject'

describe('RegisterProject', () => {
  const onSuccess = vi.fn()

  beforeEach(() => {
    onSuccess.mockReset()
    vi.restoreAllMocks()
  })

  it('renders register button', () => {
    render(<RegisterProject onSuccess={onSuccess} />)
    expect(screen.getByText('Register Project')).toBeInTheDocument()
  })

  it('clicking Register Project opens form with URL input and submit', () => {
    render(<RegisterProject onSuccess={onSuccess} />)
    fireEvent.click(screen.getByText('Register Project'))
    expect(screen.getByLabelText('GitHub Repository URL')).toBeInTheDocument()
    expect(screen.getByText('Submit')).toBeInTheDocument()
  })

  it('submitting valid URL calls API and shows success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 1, name: 'repo' } }),
    }) as unknown as typeof fetch

    render(<RegisterProject onSuccess={onSuccess} />)
    fireEvent.click(screen.getByText('Register Project'))
    fireEvent.change(screen.getByLabelText('GitHub Repository URL'), {
      target: { value: 'https://github.com/user/repo' },
    })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByText('Project registered successfully!')).toBeInTheDocument()
    })
    expect(onSuccess).toHaveBeenCalled()
  })

  it('submitting invalid URL shows error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Invalid GitHub URL format' } }),
    }) as unknown as typeof fetch

    render(<RegisterProject onSuccess={onSuccess} />)
    fireEvent.click(screen.getByText('Register Project'))
    fireEvent.change(screen.getByLabelText('GitHub Repository URL'), {
      target: { value: 'bad-url' },
    })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByText('Invalid GitHub URL format')).toBeInTheDocument()
    })
  })

  it('duplicate URL shows "already registered" message', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Project already registered' } }),
    }) as unknown as typeof fetch

    render(<RegisterProject onSuccess={onSuccess} />)
    fireEvent.click(screen.getByText('Register Project'))
    fireEvent.change(screen.getByLabelText('GitHub Repository URL'), {
      target: { value: 'https://github.com/user/repo' },
    })
    fireEvent.click(screen.getByText('Submit'))

    await waitFor(() => {
      expect(screen.getByText('Project already registered')).toBeInTheDocument()
    })
  })
})
