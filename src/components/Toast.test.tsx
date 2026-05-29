import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toast from './Toast'
import { useStore } from '../store'

beforeEach(() => {
  localStorage.clear()
  useStore.setState({
    blocks: [{ id: 'block-1', text: '' }],
    settings: { provider: 'openai', apiKey: '', model: 'gpt-4o-mini' },
    selectedBlockIds: [],
    loading: false,
    darkMode: false,
    toasts: [],
  })
})

describe('Toast', () => {
  it('renders nothing when no toasts', () => {
    const { container } = render(<Toast />)
    expect(container.firstChild).toBeNull()
  })

  it('renders toast messages', () => {
    useStore.setState({ toasts: [{ id: 't1', message: 'Hello', type: 'info' }] })
    render(<Toast />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('removes toast on dismiss click', async () => {
    useStore.setState({ toasts: [{ id: 't1', message: 'Dismiss', type: 'error' }] })
    render(<Toast />)
    await userEvent.click(screen.getByRole('button'))
    expect(useStore.getState().toasts).toHaveLength(0)
  })

  it('auto-dismisses after 5 seconds', () => {
    vi.useFakeTimers()
    useStore.setState({ toasts: [{ id: 't1', message: 'Auto', type: 'success' }] })
    render(<Toast />)
    expect(useStore.getState().toasts).toHaveLength(1)
    act(() => { vi.advanceTimersByTime(5000) })
    expect(useStore.getState().toasts).toHaveLength(0)
    vi.useRealTimers()
  })
})
