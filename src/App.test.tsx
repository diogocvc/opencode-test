import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'
import { useStore } from './store'

vi.mock('./components/Block', () => ({
  default: ({ block }: { block: { id: string; text: string } }) => (
    <div data-testid="block-component" data-block-id={block.id}>
      {block.text}
    </div>
  ),
}))

vi.mock('./components/SettingsModal', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? <div data-testid="settings-modal"><button onClick={onClose}>Close</button></div> : null,
}))

vi.mock('./ai', () => ({
  callAI: vi.fn(),
  callAIStream: vi.fn().mockResolvedValue(''),
  bridgePrompt: vi.fn(() => ({ system: '', user: '' })),
  correctPrompt: vi.fn(() => ({ system: '', user: '' })),
  rewritePrompt: vi.fn(() => ({ system: '', user: '' })),
}))

beforeEach(() => {
  localStorage.clear()
  useStore.setState({
    blocks: [{ id: 'block-1', text: '' }],
    settings: { provider: 'openai', apiKey: '', model: 'gpt-4o-mini' },
    selectedBlockIds: [],
    loading: false,
    undoStack: [],
  })
})

describe('App', () => {
  it('renders the editor title', () => {
    render(<App />)
    expect(screen.getByText('Editor de Blocos')).toBeInTheDocument()
  })

  it('shows API Key warning when not configured', () => {
    render(<App />)
    expect(screen.getByText('API Key não configurada')).toBeInTheDocument()
  })

  it('hides API Key warning when configured', () => {
    useStore.setState({
      settings: { provider: 'openai', apiKey: 'sk-test', model: 'gpt-4o-mini' },
    })
    render(<App />)
    expect(screen.queryByText('API Key não configurada')).not.toBeInTheDocument()
  })

  it('shows loading indicator when loading', () => {
    useStore.setState({ loading: true })
    render(<App />)
    expect(screen.getByText('IA processando...')).toBeInTheDocument()
  })

  it('shows selection toolbar when blocks selected', () => {
    useStore.setState({ selectedBlockIds: ['block-1'] })
    render(<App />)
    expect(screen.getByText('1 bloco(s) selecionado(s)')).toBeInTheDocument()
  })

  it('shows new block button', () => {
    render(<App />)
    expect(screen.getByText('+ Novo bloco')).toBeInTheDocument()
  })

  it('shows export buttons', () => {
    render(<App />)
    expect(screen.getByText('Copiar')).toBeInTheDocument()
    expect(screen.getByText('Exportar .md')).toBeInTheDocument()
  })

  it('opens settings modal on config button click', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('Configurar IA'))
    expect(screen.getByTestId('settings-modal')).toBeInTheDocument()
  })

  it('adds a block on new block button click', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('+ Novo bloco'))
    const { blocks } = useStore.getState()
    expect(blocks).toHaveLength(2)
  })

  it('renders block components', () => {
    render(<App />)
    const blocks = screen.getAllByTestId('block-component')
    expect(blocks).toHaveLength(1)
  })

  it('renders dark mode toggle button', () => {
    render(<App />)
    expect(screen.getByTitle('Modo escuro')).toBeInTheDocument()
  })

  it('toggles dark mode on button click', async () => {
    render(<App />)
    await userEvent.click(screen.getByTitle('Modo escuro'))
    expect(useStore.getState().darkMode).toBe(true)
    expect(screen.getByTitle('Modo claro')).toBeInTheDocument()
  })

  it('renders toast notification when toasts exist', () => {
    useStore.setState({ toasts: [{ id: 't1', message: 'Test toast', type: 'info' }] })
    render(<App />)
    expect(screen.getByText('Test toast')).toBeInTheDocument()
  })

  it('calls bridge with 2 selected blocks and inserts new block', async () => {
    const { callAIStream } = await import('./ai')
    useStore.setState({
      blocks: [
        { id: 'b1', text: 'First block' },
        { id: 'b2', text: 'Second block' },
      ],
      selectedBlockIds: ['b1', 'b2'],
      settings: { provider: 'openai', apiKey: 'sk-test', model: 'gpt-4o-mini' },
    })
    render(<App />)
    await userEvent.click(screen.getByText('Ligar blocos'))

    expect(callAIStream).toHaveBeenCalled()
    const { blocks, selectedBlockIds } = useStore.getState()
    expect(blocks).toHaveLength(3)
    expect(selectedBlockIds).toHaveLength(0)
  })
})
