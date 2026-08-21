import { Marked } from 'marked'
import type { Block } from './store'

const marked = new Marked()

function markdownToHtmlBody(md: string): string {
  return marked.parse(md) as string
}

export function markdownToHtml(md: string): string {
  const body = markdownToHtmlBody(md)
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TEXTRIS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', -apple-system, system-ui, sans-serif;
      max-width: 720px;
      margin: 0 auto;
      padding: 2rem;
      color: #171717;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      line-height: 1.3;
    }
    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }
    h4 { font-size: 1.125rem; }
    h5 { font-size: 1rem; }
    h6 { font-size: 0.875rem; }
    p { margin: 0.75rem 0; }
    blockquote {
      border-left: 3px solid #dcdee0;
      padding-left: 1rem;
      color: #60646c;
      margin: 1rem 0;
    }
    ul, ol { padding-left: 1.5rem; margin: 0.75rem 0; }
    li { margin: 0.25rem 0; }
    b, strong { font-weight: 600; }
    i, em { font-style: italic; }
    del, s { text-decoration: line-through; }
    a { color: #0d74ce; text-decoration: underline; }
    code {
      font-family: 'JetBrains Mono', monospace;
      background: #f0f0f3;
      padding: 0.125rem 0.25rem;
      border-radius: 4px;
      font-size: 0.875em;
    }
    pre {
      background: #f0f0f3;
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
    }
    pre code { background: none; padding: 0; }
    hr { border: none; border-top: 1px solid #dcdee0; margin: 1.5rem 0; }
    img { max-width: 100%; border-radius: 8px; }
  </style>
</head>
<body>
${body}
</body>
</html>`
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
}

export function markdownToPlainText(md: string): string {
  const html = markdownToHtmlBody(md)
  return stripHtml(html).trim()
}

function joinBlocks(blocks: Block[]): string {
  return blocks.map((b) => b.text).join('\n\n')
}

export async function copyRichText(blocks: Block[]): Promise<boolean> {
  const plain = joinBlocks(blocks)
  const html = markdownToHtml(joinBlocks(blocks))

  if (navigator.clipboard && 'ClipboardItem' in window) {
    try {
      const plainBlob = new Blob([plain], { type: 'text/plain' })
      const htmlBlob = new Blob([html], { type: 'text/html' })
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/plain': plainBlob,
          'text/html': htmlBlob,
        }),
      ])
      return true
    } catch {
      // fallback
    }
  }

  try {
    await navigator.clipboard.writeText(plain)
    return true
  } catch {
    return false
  }
}

export function exportRichText(blocks: Block[]): void {
  const content = markdownToHtml(joinBlocks(blocks))
  const blob = new Blob([content], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'documento.html'
  a.click()
  URL.revokeObjectURL(url)
}