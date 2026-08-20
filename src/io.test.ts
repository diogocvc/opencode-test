import { describe, it, expect, vi, beforeEach } from 'vitest'
import { serializeBlocks, deserializeBlocks, saveMarkdown, openMarkdown, isMarkdownFile, readMarkdownFile } from './io'
import type { Block } from './store'

describe('serializeBlocks', () => {
  it('joins blocks with --- separator', () => {
    const blocks: Block[] = [
      { id: '1', text: 'Primeiro bloco' },
      { id: '2', text: 'Segundo bloco' },
    ]
    expect(serializeBlocks(blocks)).toBe('Primeiro bloco\n\n---\n\nSegundo bloco')
  })

  it('returns empty string for no blocks', () => {
    expect(serializeBlocks([])).toBe('')
  })
})

describe('deserializeBlocks', () => {
  it('splits blocks on --- separator', () => {
    const md = 'Primeiro bloco\n\n---\n\nSegundo bloco'
    expect(deserializeBlocks(md)).toEqual(['Primeiro bloco', 'Segundo bloco'])
  })

  it('handles multiple separators', () => {
    const md = 'A\n\n---\n\nB\n\n---\n\nC'
    expect(deserializeBlocks(md)).toEqual(['A', 'B', 'C'])
  })

  it('returns single block when no separator present', () => {
    expect(deserializeBlocks('apenas um bloco')).toEqual(['apenas um bloco'])
  })

  it('drops empty segments', () => {
    const md = 'A\n\n---\n\n---\n\nB'
    expect(deserializeBlocks(md)).toEqual(['A', 'B'])
  })

  it('roundtrips serialize -> deserialize', () => {
    const blocks: Block[] = [
      { id: '1', text: 'Hello' },
      { id: '2', text: 'World' },
    ]
    expect(deserializeBlocks(serializeBlocks(blocks))).toEqual(['Hello', 'World'])
  })
})

describe('isMarkdownFile', () => {
  it('accepts .md files', () => {
    expect(isMarkdownFile('doc.md')).toBe(true)
    expect(isMarkdownFile('DOC.MD')).toBe(true)
  })

  it('rejects non-md files', () => {
    expect(isMarkdownFile('doc.txt')).toBe(false)
    expect(isMarkdownFile('doc')).toBe(false)
    expect(isMarkdownFile('doc.md.txt')).toBe(false)
  })
})

describe('saveMarkdown', () => {
  beforeEach(() => {
    delete (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker
  })

  it('uses showSaveFilePicker and returns true', async () => {
    const write = vi.fn().mockResolvedValue(undefined)
    const close = vi.fn().mockResolvedValue(undefined)
    const createWritable = vi.fn().mockResolvedValue({ write, close })
    window.showSaveFilePicker = vi.fn().mockResolvedValue({ createWritable })

    const blocks: Block[] = [{ id: '1', text: 'A' }]
    const ok = await saveMarkdown(blocks, 'meu-doc.md')

    expect(ok).toBe(true)
    expect(window.showSaveFilePicker).toHaveBeenCalled()
    expect(createWritable).toHaveBeenCalled()
    expect(write).toHaveBeenCalledWith('A')
    expect(close).toHaveBeenCalled()
  })

  it('returns false when user cancels', async () => {
    window.showSaveFilePicker = vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError'))
    const ok = await saveMarkdown([{ id: '1', text: 'A' }])
    expect(ok).toBe(false)
  })
})

describe('openMarkdown', () => {
  beforeEach(() => {
    delete (window as Window & { showOpenFilePicker?: unknown }).showOpenFilePicker
  })

  it('reads file and returns blocks split on ---', async () => {
    const file = { text: vi.fn().mockResolvedValue('Bloco A\n\n---\n\nBloco B'), name: 'doc.md' }
    window.showOpenFilePicker = vi.fn().mockResolvedValue([
      { getFile: () => Promise.resolve(file), name: 'doc.md' },
    ])
    const blocks = await openMarkdown()
    expect(blocks).toEqual(['Bloco A', 'Bloco B'])
  })

  it('returns null when user cancels', async () => {
    window.showOpenFilePicker = vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError'))
    expect(await openMarkdown()).toBeNull()
  })

  it('returns null when file is not .md', async () => {
    const file = { text: vi.fn().mockResolvedValue('x'), name: 'doc.txt' }
    window.showOpenFilePicker = vi.fn().mockResolvedValue([
      { getFile: () => Promise.resolve(file), name: 'doc.txt' },
    ])
    expect(await openMarkdown()).toBeNull()
  })
})

describe('readMarkdownFile', () => {
  it('splits file content on ---', async () => {
    const file = { text: () => Promise.resolve('A\n\n---\n\nB') } as File
    expect(await readMarkdownFile(file)).toEqual(['A', 'B'])
  })
})
