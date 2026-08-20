import { useEffect, useRef, useState } from 'react'
import { type FormatAction, type BlockStyle } from '../markdown'

interface Props {
  style: BlockStyle
  onApply: (action: FormatAction, level?: number) => void
}

const HEADINGS = [1, 2, 3, 4, 5, 6]

const btnClass =
  'flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100'

const activeClass = 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'

function ToolbarButton({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string
  onClick: () => void
  active?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`${btnClass} ${active ? activeClass : ''}`}
    >
      {children}
    </button>
  )
}

export default function Toolbar({ style, onApply }: Props) {
  const [headingOpen, setHeadingOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!headingOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setHeadingOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [headingOpen])

  return (
    <div
      onMouseDown={(e) => e.preventDefault()}
      className="pointer-events-auto inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white p-1 shadow-md dark:border-gray-700 dark:bg-gray-800"
    >
      <ToolbarButton label="Negrito" onClick={() => onApply('bold')}>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 5v14h6.5a4.5 4.5 0 0 0 0-9H9.5V5H7zm2.5 2v5H13a2.5 2.5 0 0 0 0-5H9.5z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton label="Itálico" onClick={() => onApply('italic')}>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 5h9v3h-4.2l-3.4 8H15v3H6v-3h4.2l3.4-8H10V5z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton label="Tachado" onClick={() => onApply('strikethrough')}>
        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 12h10M8.5 8.5A3.5 3.5 0 0 1 12 7c1.6 0 3 1 3 2.6M15.5 15.5A3.5 3.5 0 0 1 12 17c-1.8 0-3-1.2-3-3" />
        </svg>
      </ToolbarButton>

      <div className="relative" ref={menuRef}>
        <ToolbarButton
          label="Cabeçalho"
          active={style.heading !== null}
          onClick={() => setHeadingOpen((v) => !v)}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 4v16m12-16v16M6 12h12" />
          </svg>
        </ToolbarButton>
        {headingOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-md dark:border-gray-700 dark:bg-gray-800">
            {HEADINGS.map((level) => (
              <button
                key={level}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onApply('heading', level)
                  setHeadingOpen(false)
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700 ${
                  style.heading === level ? 'text-blue-600 dark:text-blue-300' : ''
                }`}
              >
                <span className="font-semibold">H{level}</span>
                <span className="text-xs text-gray-400">{"#".repeat(level)} Título</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-0.5 h-6 w-px bg-gray-200 dark:bg-gray-700" />

      <ToolbarButton label="Citação" active={style.blockquote} onClick={() => onApply('blockquote')}>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 7H6a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3v-7zM21 7h-4a3 3 0 0 0-3 3v4a3 3 0 0 0 3 3h2a3 3 0 0 0 3-3V7z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton label="Lista com marcadores" active={style.bullet} onClick={() => onApply('bullet')}>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm0 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM9 6h11a1 1 0 0 0 0-2H9a1 1 0 0 0 0 2zm0 6h11a1 1 0 0 0 0-2H9a1 1 0 0 0 0 2zm0 6h11a1 1 0 0 0 0-2H9a1 1 0 0 0 0 2z" />
        </svg>
      </ToolbarButton>
      <ToolbarButton label="Lista numerada" active={style.numbered} onClick={() => onApply('number')}>
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 4h2v5H4V4zm2 0h2v7H4V9h2V4zm-2 16v-2h8v2H4zm4-8v-2h8v2H8zm-2-4v6H4v-6h2zm4 4h8a1 1 0 0 1 0 2H10a1 1 0 0 1 0-2zM6 6h12a1 1 0 0 1 0 2H6a1 1 0 0 1 0-2z" />
        </svg>
      </ToolbarButton>
    </div>
  )
}