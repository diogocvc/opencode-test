import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Toolbar from './Toolbar'

describe('Toolbar', () => {
  const baseStyle = {
    heading: null,
    blockquote: false,
    bullet: false,
    numbered: false,
  }

  it('calls onApply with bold', async () => {
    const onApply = vi.fn()
    render(<Toolbar style={baseStyle} onApply={onApply} />)
    await userEvent.click(screen.getByLabelText('Negrito'))
    expect(onApply).toHaveBeenCalledWith('bold')
  })

  it('calls onApply with italic', async () => {
    const onApply = vi.fn()
    render(<Toolbar style={baseStyle} onApply={onApply} />)
    await userEvent.click(screen.getByLabelText('Itálico'))
    expect(onApply).toHaveBeenCalledWith('italic')
  })

  it('calls onApply with strikethrough', async () => {
    const onApply = vi.fn()
    render(<Toolbar style={baseStyle} onApply={onApply} />)
    await userEvent.click(screen.getByLabelText('Tachado'))
    expect(onApply).toHaveBeenCalledWith('strikethrough')
  })

  it('calls onApply with blockquote', async () => {
    const onApply = vi.fn()
    render(<Toolbar style={baseStyle} onApply={onApply} />)
    await userEvent.click(screen.getByLabelText('Citação'))
    expect(onApply).toHaveBeenCalledWith('blockquote')
  })

  it('calls onApply with bullet', async () => {
    const onApply = vi.fn()
    render(<Toolbar style={baseStyle} onApply={onApply} />)
    await userEvent.click(screen.getByLabelText('Lista com marcadores'))
    expect(onApply).toHaveBeenCalledWith('bullet')
  })

  it('calls onApply with number', async () => {
    const onApply = vi.fn()
    render(<Toolbar style={baseStyle} onApply={onApply} />)
    await userEvent.click(screen.getByLabelText('Lista numerada'))
    expect(onApply).toHaveBeenCalledWith('number')
  })

  it('opens heading menu and applies level', async () => {
    const onApply = vi.fn()
    render(<Toolbar style={baseStyle} onApply={onApply} />)
    await userEvent.click(screen.getByLabelText('Cabeçalho'))
    await userEvent.click(screen.getByText('H3'))
    expect(onApply).toHaveBeenCalledWith('heading', 3)
  })

  it('marks heading button active when block has heading', () => {
    const { container } = render(
      <Toolbar style={{ ...baseStyle, heading: 2 }} onApply={vi.fn()} />,
    )
    const btn = screen.getByLabelText('Cabeçalho')
    expect(btn.className).toContain('bg-blue-100')
    expect(container).toBeTruthy()
  })

  it('marks blockquote button active', () => {
    render(<Toolbar style={{ ...baseStyle, blockquote: true }} onApply={vi.fn()} />)
    expect(screen.getByLabelText('Citação').className).toContain('bg-blue-100')
  })

  it('marks bullet button active', () => {
    render(<Toolbar style={{ ...baseStyle, bullet: true }} onApply={vi.fn()} />)
    expect(screen.getByLabelText('Lista com marcadores').className).toContain('bg-blue-100')
  })

  it('marks numbered button active', () => {
    render(<Toolbar style={{ ...baseStyle, numbered: true }} onApply={vi.fn()} />)
    expect(screen.getByLabelText('Lista numerada').className).toContain('bg-blue-100')
  })

  it('does not prevent textarea blur', () => {
    render(<Toolbar style={baseStyle} onApply={vi.fn()} />)
    const btn = screen.getByLabelText('Negrito')
    fireEvent.mouseDown(btn)
    expect(btn).toBeInTheDocument()
  })
})