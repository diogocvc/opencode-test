import { describe, it, expect, vi, beforeEach } from 'vitest'
import { markdownToHtml, markdownToPlainText, copyRichText, exportRichText } from './richText'
import type { Block } from './store'

describe('markdownToHtml', () => {
  it('wraps content in a full HTML document', () => {
    const html = markdownToHtml('hello')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="pt-BR">')
    expect(html).toContain('hello')
  })

  it('converts bold markdown', () => {
    const html = markdownToHtml('**bold**')
    expect(html).toContain('<strong>bold</strong>')
  })

  it('converts italic markdown', () => {
    const html = markdownToHtml('*italic*')
    expect(html).toContain('<em>italic</em>')
  })

  it('converts strikethrough markdown', () => {
    const html = markdownToHtml('~~text~~')
    expect(html).toContain('<del>text</del>')
  })

  it('converts headings', () => {
    expect(markdownToHtml('# H1')).toContain('<h1')
    expect(markdownToHtml('## H2')).toContain('<h2')
    expect(markdownToHtml('### H3')).toContain('<h3')
  })

  it('converts blockquote', () => {
    const html = markdownToHtml('> quote')
    expect(html).toContain('<blockquote>')
  })

  it('converts bullet list', () => {
    const html = markdownToHtml('- item')
    expect(html).toContain('<li>item</li>')
  })

  it('converts numbered list', () => {
    const html = markdownToHtml('1. item')
    expect(html).toContain('<li>item</li>')
  })

  it('converts multiple blocks separated by blank lines', () => {
    const html = markdownToHtml('**bold**\n\n*italic*')
    expect(html).toContain('<strong>bold</strong>')
    expect(html).toContain('<em>italic</em>')
  })
})

describe('markdownToPlainText', () => {
  it('strips bold markers', () => {
    expect(markdownToPlainText('**bold**')).toBe('bold')
  })

  it('strips italic markers', () => {
    expect(markdownToPlainText('*italic*')).toBe('italic')
  })

  it('strips strikethrough markers', () => {
    expect(markdownToPlainText('~~text~~')).toBe('text')
  })

  it('strips heading markers', () => {
    expect(markdownToPlainText('## Title')).toBe('Title')
  })

  it('strips blockquote markers', () => {
    expect(markdownToPlainText('> quote')).toBe('quote')
  })

  it('strips bullet list markers', () => {
    expect(markdownToPlainText('- item')).toBe('item')
  })

  it('strips numbered list markers', () => {
    expect(markdownToPlainText('1. item')).toBe('item')
  })

  it('preserves plain text', () => {
    expect(markdownToPlainText('just text')).toBe('just text')
  })
})

describe('copyRichText', () => {
  const blocks: Block[] = [
    { id: '1', text: '**bold**' },
    { id: '2', text: '*italic*' },
  ]

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('copies rich text when ClipboardItem is available', async () => {
    const writeSpy = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { write: writeSpy, writeText: vi.fn() } })
    vi.stubGlobal('ClipboardItem', class {})

    const ok = await copyRichText(blocks)
    expect(ok).toBe(true)
    expect(writeSpy).toHaveBeenCalled()
  })

  it('falls back to writeText when clipboard.write fails', async () => {
    const writeTextSpy = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error('not supported')),
        writeText: writeTextSpy,
      },
    })

    const ok = await copyRichText(blocks)
    expect(ok).toBe(true)
    expect(writeTextSpy).toHaveBeenCalled()
  })

  it('returns false when all clipboard methods fail', async () => {
    Object.assign(navigator, {
      clipboard: {
        write: vi.fn().mockRejectedValue(new Error('fail')),
        writeText: vi.fn().mockRejectedValue(new Error('fail')),
      },
    })

    const ok = await copyRichText(blocks)
    expect(ok).toBe(false)
  })
})

describe('exportRichText', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a download link with .html extension', () => {
    const clickSpy = vi.fn()
    const createObjectURLSpy = vi.fn().mockReturnValue('blob:mock')
    const revokeObjectURLSpy = vi.fn()

    vi.stubGlobal('URL', { createObjectURL: createObjectURLSpy, revokeObjectURL: revokeObjectURLSpy })
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      if (tag === 'a') {
        return { href: '', download: '', click: clickSpy } as unknown as HTMLAnchorElement
      }
      return document.createElement(tag)
    })

    const blocks: Block[] = [{ id: '1', text: '**hello**' }]
    exportRichText(blocks)

    expect(createObjectURLSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURLSpy).toHaveBeenCalled()
  })
})