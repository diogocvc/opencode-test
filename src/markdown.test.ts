import { describe, it, expect } from 'vitest'
import {
  toggleInline,
  setHeading,
  toggleLinePrefix,
  toggleNumberedList,
  detectBlockStyle,
  formatBlock,
} from './markdown'

describe('toggleInline', () => {
  it('wraps selected text with bold', () => {
    const r = toggleInline('texto importante', 0, 5, 'bold')
    expect(r.text).toBe('**texto** importante')
    expect(r.selStart).toBe(2)
    expect(r.selEnd).toBe(7)
  })

  it('wraps with italic', () => {
    const r = toggleInline('abc', 1, 2, 'italic')
    expect(r.text).toBe('a*b*c')
  })

  it('wraps with strikethrough', () => {
    const r = toggleInline('texto', 0, 5, 'strikethrough')
    expect(r.text).toBe('~~texto~~')
  })

  it('unwraps already-formatted selection', () => {
    const r = toggleInline('**texto** ok', 0, 9, 'bold')
    expect(r.text).toBe('texto ok')
    expect(r.selStart).toBe(0)
    expect(r.selEnd).toBe(5)
  })

  it('inserts empty markers when no selection and places cursor between', () => {
    const r = toggleInline('ola', 1, 1, 'bold')
    expect(r.text).toBe('o****la')
    expect(r.selStart).toBe(3)
    expect(r.selEnd).toBe(3)
  })
})

describe('setHeading', () => {
  it('prepends heading to plain text', () => {
    const r = setHeading('Titulo', 0, 6, 2)
    expect(r.text).toBe('## Titulo')
  })

  it('changes heading level preserving inline formatting', () => {
    const r = setHeading('## Meu **título** importante', 0, 27, 3)
    expect(r.text).toBe('### Meu **título** importante')
  })

  it('removes heading when toggling same level', () => {
    const r = setHeading('## Titulo', 0, 9, 2)
    expect(r.text).toBe('Titulo')
  })

  it('supports H1 to H6', () => {
    expect(setHeading('x', 0, 1, 1).text).toBe('# x')
    expect(setHeading('x', 0, 1, 6).text).toBe('###### x')
  })

  it('does not duplicate markers', () => {
    const r = setHeading('## ## Titulo', 0, 12, 2)
    expect(r.text).toBe('## ## Titulo'.replace(/^## /, ''))
    expect(r.text).not.toBe('## ## ## Titulo')
  })
})

describe('toggleLinePrefix', () => {
  it('adds blockquote prefix', () => {
    const r = toggleLinePrefix('Este é um parágrafo.', 0, 21, '> ')
    expect(r.text).toBe('> Este é um parágrafo.')
  })

  it('removes existing blockquote prefix', () => {
    const r = toggleLinePrefix('> citação', 0, 9, '> ')
    expect(r.text).toBe('citação')
  })

  it('adds bullet prefix preserving content', () => {
    const r = toggleLinePrefix('Meu item', 0, 8, '- ')
    expect(r.text).toBe('- Meu item')
  })

  it('removes bullet prefix', () => {
    const r = toggleLinePrefix('- item', 0, 6, '- ')
    expect(r.text).toBe('item')
  })

  it('does not duplicate bullet markers', () => {
    const r = toggleLinePrefix('- - Item', 0, 8, '- ')
    expect(r.text).toBe('- Item')
  })

  it('applies prefix to multiple selected lines', () => {
    const r = toggleLinePrefix('linha um\nlinha dois', 0, 17, '> ')
    expect(r.text).toBe('> linha um\n> linha dois')
  })

  it('removes prefix from all selected lines when all prefixed', () => {
    const r = toggleLinePrefix('> a\n> b', 0, 6, '> ')
    expect(r.text).toBe('a\nb')
  })
})

describe('toggleNumberedList', () => {
  it('numbers lines incrementally', () => {
    const r = toggleNumberedList('um\ndois', 0, 8)
    expect(r.text).toBe('1. um\n2. dois')
  })

  it('removes numbering when already numbered', () => {
    const r = toggleNumberedList('1. um\n2. dois', 0, 14)
    expect(r.text).toBe('um\ndois')
  })

  it('numbers a single line', () => {
    const r = toggleNumberedList('item', 0, 4)
    expect(r.text).toBe('1. item')
  })
})

describe('detectBlockStyle', () => {
  it('detects heading level', () => {
    expect(detectBlockStyle('### T').heading).toBe(3)
    expect(detectBlockStyle('T').heading).toBeNull()
  })

  it('detects blockquote', () => {
    expect(detectBlockStyle('> a').blockquote).toBe(true)
    expect(detectBlockStyle('a').blockquote).toBe(false)
  })

  it('detects bullet list', () => {
    expect(detectBlockStyle('- a').bullet).toBe(true)
  })

  it('detects numbered list', () => {
    expect(detectBlockStyle('1. a').numbered).toBe(true)
  })
})

describe('formatBlock', () => {
  it('dispatches inline actions', () => {
    expect(formatBlock('ab', 0, 1, 'bold').text).toBe('**a**b')
  })

  it('dispatches blockquote', () => {
    expect(formatBlock('x', 0, 1, 'blockquote').text).toBe('> x')
  })

  it('dispatches bullet', () => {
    expect(formatBlock('x', 0, 1, 'bullet').text).toBe('- x')
  })

  it('dispatches numbered list', () => {
    expect(formatBlock('x', 0, 1, 'number').text).toBe('1. x')
  })

  it('dispatches heading with level', () => {
    expect(formatBlock('x', 0, 1, 'heading', 4).text).toBe('#### x')
  })
})