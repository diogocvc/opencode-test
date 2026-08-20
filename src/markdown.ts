export type FormatAction =
  | 'bold'
  | 'italic'
  | 'strikethrough'
  | 'heading'
  | 'blockquote'
  | 'bullet'
  | 'number'

export interface FormatResult {
  text: string
  selStart: number
  selEnd: number
}

const HEADING_RE = /^(#{1,6})\s+/

const INLINE_MARKERS: Record<'bold' | 'italic' | 'strikethrough', string> = {
  bold: '**',
  italic: '*',
  strikethrough: '~~',
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

export function toggleInline(
  text: string,
  selStart: number,
  selEnd: number,
  action: 'bold' | 'italic' | 'strikethrough',
): FormatResult {
  const marker = INLINE_MARKERS[action]
  const markerLen = marker.length
  const before = text.slice(0, selStart)
  const after = text.slice(selEnd)
  const selected = text.slice(selStart, selEnd)

  if (selStart === selEnd) {
    const newText = before + marker + marker + after
    const cursor = selStart + markerLen
    return { text: newText, selStart: cursor, selEnd: cursor }
  }

  const wrapped = selected.startsWith(marker) && selected.endsWith(marker)
  if (wrapped) {
    const inner = selected.slice(markerLen, selected.length - markerLen)
    const newText = before + inner + after
    return { text: newText, selStart: selStart, selEnd: selEnd - markerLen * 2 }
  }

  const newText = before + marker + selected + marker + after
  return { text: newText, selStart: selStart + markerLen, selEnd: selEnd + markerLen }
}

export function setHeading(text: string, selStart: number, selEnd: number, level: number): FormatResult {
  const match = text.match(HEADING_RE)
  const current = match ? match[1].length : 0
  const body = match ? text.slice(match[0].length) : text
  const oldPrefixLen = current === 0 ? 0 : current + 1
  const newPrefixLen = current === level ? 0 : level + 1

  const newText = current === level ? body : '#'.repeat(level) + ' ' + body
  const delta = newPrefixLen - oldPrefixLen
  return {
    text: newText,
    selStart: clamp(selStart + delta, 0, newText.length),
    selEnd: clamp(selEnd + delta, 0, newText.length),
  }
}

function lineRange(text: string, selStart: number, selEnd: number): { first: number; last: number } {
  const lines = text.split('\n')
  const lineAt = (target: number) => {
    let count = 0
    for (let i = 0; i < lines.length; i++) {
      if (target <= count + lines[i].length) return i
      count += lines[i].length + 1
    }
    return lines.length - 1
  }
  return { first: lineAt(selStart), last: lineAt(selEnd) }
}

export function toggleLinePrefix(
  text: string,
  selStart: number,
  selEnd: number,
  prefix: string,
): FormatResult {
  const lines = text.split('\n')
  const { first, last } = lineRange(text, selStart, selEnd)

  const allPrefixed = lines
    .slice(first, last + 1)
    .every((l) => l.startsWith(prefix))

  const newLines = [...lines]
  let delta = 0
  for (let i = first; i <= last; i++) {
    const line = lines[i]
    if (allPrefixed) {
      newLines[i] = line.slice(prefix.length)
      delta -= prefix.length
    } else {
      newLines[i] = prefix + line
      delta += prefix.length
    }
  }
  const newText = newLines.join('\n')

  return {
    text: newText,
    selStart: clamp(selStart + delta, 0, newText.length),
    selEnd: clamp(selEnd + delta, 0, newText.length),
  }
}

export function toggleNumberedList(text: string, selStart: number, selEnd: number): FormatResult {
  const lines = text.split('\n')
  const { first, last } = lineRange(text, selStart, selEnd)

  const numberedRe = /^\d+\.\s+/
  const allNumbered = lines
    .slice(first, last + 1)
    .every((l) => numberedRe.test(l))

  const newLines = [...lines]
  let delta = 0
  for (let i = first; i <= last; i++) {
    const line = lines[i]
    if (allNumbered) {
      newLines[i] = line.replace(numberedRe, '')
      delta -= line.length - newLines[i].length
    } else {
      const num = i - first + 1
      const prefix = `${num}. `
      newLines[i] = prefix + line
      delta += prefix.length
    }
  }
  const newText = newLines.join('\n')

  return {
    text: newText,
    selStart: clamp(selStart + delta, 0, newText.length),
    selEnd: clamp(selEnd + delta, 0, newText.length),
  }
}

export interface BlockStyle {
  heading: number | null
  blockquote: boolean
  bullet: boolean
  numbered: boolean
}

export function detectBlockStyle(text: string): BlockStyle {
  const lines = text.split('\n')
  const firstLine = lines[0]
  const headingMatch = firstLine.match(HEADING_RE)
  const has = (re: RegExp) => lines.length > 0 && lines.every((l) => re.test(l))
  return {
    heading: headingMatch ? headingMatch[1].length : null,
    blockquote: has(/^>\s+/),
    bullet: has(/^-\s+/),
    numbered: has(/^\d+\.\s+/),
  }
}

export function formatBlock(
  text: string,
  selStart: number,
  selEnd: number,
  action: FormatAction,
  level?: number,
): FormatResult {
  switch (action) {
    case 'bold':
    case 'italic':
    case 'strikethrough':
      return toggleInline(text, selStart, selEnd, action)
    case 'heading':
      return setHeading(text, selStart, selEnd, level ?? 1)
    case 'blockquote':
      return toggleLinePrefix(text, selStart, selEnd, '> ')
    case 'bullet':
      return toggleLinePrefix(text, selStart, selEnd, '- ')
    case 'number':
      return toggleNumberedList(text, selStart, selEnd)
  }
}