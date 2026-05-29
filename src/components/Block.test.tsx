import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Block from './Block'
import { useStore } from '../store'

vi.mock('@dnd-kit/sortable', () => ({
  useSortable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: () => {},
    transform: null,
    transition: null,
    isDragging: false,
  }),
}))

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Transform: { toString: () => '' } },
}))

beforeEach(() => {
  localStorage.clear()
  useStore.setState({
    blocks: [{ id: 'block-1', text: 'hello' }],
    settings: { provider: 'openai', apiKey: '', model: 'gpt-4o-mini' },
    selectedBlockIds: [],
    loading: false,
    undoStack: [],
  })
})

describe('Block', () => {
  it('renders block text', () => {
    render(<Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={false} total={1} />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toHaveValue('hello')
  })

  it('calls updateBlock on text change', () => {
    const updateBlock = vi.spyOn(useStore.getState(), 'updateBlock')
    render(<Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={false} total={1} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'hello world' } })
    expect(updateBlock).toHaveBeenCalledWith('block-1', 'hello world')
  })

  it('calls addBlock on Enter', () => {
    const { blocks } = useStore.getState()
    render(<Block block={blocks[0]} index={0} isSelected={false} total={1} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.keyDown(textarea, { key: 'Enter' })
    expect(useStore.getState().blocks).toHaveLength(2)
  })

  it('does not call addBlock on Cmd+Enter', () => {
    render(<Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={false} total={1} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.keyDown(textarea, { key: 'Enter', metaKey: true })
    expect(useStore.getState().blocks).toHaveLength(1)
  })

  it('calls removeBlock on delete click', async () => {
    const removeBlock = vi.spyOn(useStore.getState(), 'removeBlock')
    render(<Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={false} total={1} />)
    const deleteBtn = screen.getByTitle('Excluir bloco')
    await userEvent.click(deleteBtn)
    expect(removeBlock).toHaveBeenCalledWith('block-1')
  })

  it('calls toggleSelectBlock on select click', async () => {
    const toggleSelectBlock = vi.spyOn(useStore.getState(), 'toggleSelectBlock')
    render(<Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={false} total={1} />)
    const selectBtn = screen.getByTitle('Selecionar para ligar')
    await userEvent.click(selectBtn)
    expect(toggleSelectBlock).toHaveBeenCalledWith('block-1')
  })

  it('shows up button when not first', () => {
    render(<Block block={{ id: 'block-2', text: 'hello' }} index={1} isSelected={false} total={2} />)
    expect(screen.getByTitle('Mover para cima')).toBeInTheDocument()
  })

  it('hides up button when first', () => {
    render(<Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={false} total={2} />)
    expect(screen.queryByTitle('Mover para cima')).not.toBeInTheDocument()
  })

  it('shows down button when not last', () => {
    render(<Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={false} total={2} />)
    expect(screen.getByTitle('Mover para baixo')).toBeInTheDocument()
  })

  it('hides down button when last', () => {
    render(<Block block={{ id: 'block-2', text: 'hello' }} index={1} isSelected={false} total={2} />)
    expect(screen.queryByTitle('Mover para baixo')).not.toBeInTheDocument()
  })

  it('applies selected styles', () => {
    const { container } = render(
      <Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={true} total={1} />,
    )
    expect(container.firstChild).toHaveClass('border-blue-400')
  })

  it('calls moveBlock on up button click', async () => {
    const moveBlock = vi.spyOn(useStore.getState(), 'moveBlock')
    render(<Block block={{ id: 'block-2', text: 'hello' }} index={1} isSelected={false} total={2} />)
    await userEvent.click(screen.getByTitle('Mover para cima'))
    expect(moveBlock).toHaveBeenCalledWith(1, 0)
  })

  it('calls moveBlock on down button click', async () => {
    const moveBlock = vi.spyOn(useStore.getState(), 'moveBlock')
    render(<Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={false} total={2} />)
    await userEvent.click(screen.getByTitle('Mover para baixo'))
    expect(moveBlock).toHaveBeenCalledWith(0, 1)
  })

  it('shows streaming indicator when block is being streamed to', () => {
    useStore.setState({ streamingBlockId: 'block-1' })
    const { container } = render(
      <Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={false} total={1} />,
    )
    expect(container.firstChild).toHaveClass('ring-2')
  })

  it('does not show streaming indicator for non-streaming block', () => {
    useStore.setState({ streamingBlockId: 'block-2' })
    const { container } = render(
      <Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={false} total={1} />,
    )
    expect(container.firstChild).not.toHaveClass('ring-2')
  })

  it('pushes undo on textarea blur', () => {
    render(<Block block={{ id: 'block-1', text: 'hello' }} index={0} isSelected={false} total={1} />)
    const textarea = screen.getByRole('textbox')
    fireEvent.blur(textarea)
    expect(useStore.getState().undoStack).toHaveLength(1)
  })
})
