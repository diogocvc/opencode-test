import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

const mockSaveMarkdown = vi.fn().mockResolvedValue(true)
const mockOpenMarkdown = vi.fn().mockResolvedValue(['Bloco A', 'Bloco B'])
const mockIsMarkdownFile = vi.fn((name: string) => name.toLowerCase().endsWith('.md'))
const mockReadMarkdownFile = vi.fn().mockResolvedValue(['Bloco A', 'Bloco B'])

vi.mock('./io', () => ({
  saveMarkdown: (...args: unknown[]) => mockSaveMarkdown(...args),
  openMarkdown: (...args: unknown[]) => mockOpenMarkdown(...args),
  isMarkdownFile: (...args: unknown[]) => mockIsMarkdownFile(...args),
  readMarkdownFile: (...args: unknown[]) => mockReadMarkdownFile(...args),
}))

const mockCopyRichText = vi.fn().mockResolvedValue(true)
const mockExportRichText = vi.fn()

vi.mock('./richText', () => ({
  copyRichText: (...args: unknown[]) => mockCopyRichText(...args),
  exportRichText: (...args: unknown[]) => mockExportRichText(...args),
}))

beforeEach(() => {
  localStorage.clear()
  mockSaveMarkdown.mockClear()
  mockOpenMarkdown.mockClear()
  mockIsMarkdownFile.mockClear()
  mockReadMarkdownFile.mockClear()
  mockCopyRichText.mockClear()
  mockExportRichText.mockClear()
  delete (window as Window & { showOpenFilePicker?: unknown }).showOpenFilePicker
  useStore.setState({
    blocks: [{ id: 'block-1', text: '' }],
    settings: { provider: 'openai', apiKey: '', model: 'gpt-4o-mini' },
    selectedBlockIds: [],
    loading: false,
    undoStack: [],
    toasts: [],
  })
})

describe('App', () => {
  it('renders the editor title', () => {
    render(<App />)
    expect(screen.getByText('TEXTRIS')).toBeInTheDocument()
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

  it('shows bridge button between two adjacent selected blocks', () => {
    useStore.setState({
      blocks: [
        { id: 'b1', text: 'First' },
        { id: 'b2', text: 'Second' },
      ],
      selectedBlockIds: ['b1', 'b2'],
    })
    render(<App />)
    expect(screen.getByText('Ligar blocos')).toBeInTheDocument()
    expect(screen.getByText('Cancelar')).toBeInTheDocument()
  })

  it('shows new block button', () => {
    render(<App />)
    expect(screen.getByText('+ Novo bloco')).toBeInTheDocument()
  })

  it('shows export buttons', () => {
    render(<App />)
    expect(screen.getByText('Copiar')).toBeInTheDocument()
    expect(screen.getByText('Exportar .md')).toBeInTheDocument()
    expect(screen.getByText('Exportar .html')).toBeInTheDocument()
  })

  it('shows save and open buttons', () => {
    render(<App />)
    expect(screen.getByText('Salvar')).toBeInTheDocument()
    expect(screen.getByText('Abrir .md')).toBeInTheDocument()
  })

  it('saves document on save button click', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('Salvar'))
    expect(mockSaveMarkdown).toHaveBeenCalled()
    expect(screen.getByText('Documento salvo com sucesso!')).toBeInTheDocument()
  })

  it('opens document and replaces blocks on open button click', async () => {
    window.showOpenFilePicker = vi.fn()
    render(<App />)
    await userEvent.click(screen.getByText('Abrir .md'))
    expect(mockOpenMarkdown).toHaveBeenCalled()
    const { blocks } = useStore.getState()
    expect(blocks).toEqual([
      { id: expect.any(String), text: 'Bloco A' },
      { id: expect.any(String), text: 'Bloco B' },
    ])
  })

  it('falls back to file input when showOpenFilePicker is unavailable', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('Abrir .md'))
    const input = document.querySelector('input[type="file"]')
    expect(input).not.toBeNull()
  })

  it('rejects non-md file with error toast', async () => {
    mockIsMarkdownFile.mockReturnValueOnce(false)
    render(<App />)
    await userEvent.click(screen.getByText('Abrir .md'))
    const input = document.querySelector('input[type="file"]')!
    const file = new File(['conteudo'], 'nota.txt', { type: 'text/plain' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(screen.getByText('Apenas arquivos .md são aceitos.')).toBeInTheDocument()
    expect(useStore.getState().blocks).toHaveLength(1)
  })

  it('loads file content from input when md', async () => {
    render(<App />)
    await userEvent.click(screen.getByText('Abrir .md'))
    const input = document.querySelector('input[type="file"]')!
    const file = new File(['A\n\n---\n\nB'], 'nota.md', { type: 'text/markdown' })
    fireEvent.change(input, { target: { files: [file] } })
    expect(mockReadMarkdownFile).toHaveBeenCalled()
    await waitFor(() => {
      const { blocks } = useStore.getState()
      expect(blocks).toHaveLength(2)
    })
    expect(screen.getByText('Documento aberto com sucesso!')).toBeInTheDocument()
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
