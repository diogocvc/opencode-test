import type { Block } from './store'

const SEPARATOR = '---'
const BLOCK_SEPARATOR = `\n\n${SEPARATOR}\n\n`

export function serializeBlocks(blocks: Block[]): string {
  return blocks.map((b) => b.text).join(BLOCK_SEPARATOR)
}

export function deserializeBlocks(md: string): string[] {
  const parts = md.split(/\n?---\n?/).map((p) => p.trim())
  return parts.filter((p) => p.length > 0)
}

interface FilePickerOptions {
  suggestedName?: string
  types?: Array<{
    description?: string
    accept: Record<string, string[]>
  }>
  multiple?: boolean
}

type FileSystemHandle = {
  createWritable?: () => Promise<{ write: (data: unknown) => Promise<void>; close: () => Promise<void> }>
  getFile?: () => Promise<File>
  name?: string
}

declare global {
  interface Window {
    showSaveFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemHandle>
    showOpenFilePicker?: (options?: FilePickerOptions) => Promise<FileSystemHandle[]>
  }
}

export async function saveMarkdown(blocks: Block[], suggestedName = 'documento.md'): Promise<boolean> {
  const content = serializeBlocks(blocks)
  const picker = window.showSaveFilePicker
  if (picker) {
    try {
      const handle = await picker({
        suggestedName,
        types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
      })
      const writable = await handle.createWritable?.()
      if (!writable) return false
      await writable.write(content)
      await writable.close()
      return true
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return false
      return false
    }
  }

  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = suggestedName
  a.click()
  URL.revokeObjectURL(url)
  return true
}

export async function openMarkdown(): Promise<string[] | null> {
  const picker = window.showOpenFilePicker
  if (picker) {
    try {
      const [handle] = await picker({
        multiple: false,
        types: [{ description: 'Markdown', accept: { 'text/markdown': ['.md'] } }],
      })
      if (!handle || !handle.name || !isMarkdownFile(handle.name)) return null
      const file = await handle.getFile?.()
      if (!file) return null
      const text = await file.text()
      return deserializeBlocks(text)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      throw err
    }
  }
  return null
}

export function isMarkdownFile(name: string): boolean {
  return name.toLowerCase().endsWith('.md')
}

export function readMarkdownFile(file: File): Promise<string[]> {
  return file.text().then((text) => deserializeBlocks(text))
}
