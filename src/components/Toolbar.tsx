import { useEffect, useRef, useState } from 'react'
import { type FormatAction, type BlockStyle } from '../markdown'

interface Props {
  style: BlockStyle
  onApply: (action: FormatAction, level?: number) => void
}

const HEADINGS = [1, 2, 3, 4, 5, 6]

const btnClass =
  'flex h-6 w-6 items-center justify-center rounded-md text-ink-muted transition-colors hover:text-ink'

const activeClass = 'bg-accent/15 text-accent'

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
      className="inline-flex items-center gap-0.5"
    >
      <ToolbarButton label="Negrito" onClick={() => onApply('bold')}>
        <span className="text-[13px] font-bold">B</span>
      </ToolbarButton>
      <ToolbarButton label="Itálico" onClick={() => onApply('italic')}>
        <span className="text-[13px] italic">I</span>
      </ToolbarButton>
      <ToolbarButton label="Tachado" onClick={() => onApply('strikethrough')}>
        <span className="text-[13px] line-through">S</span>
      </ToolbarButton>

      <div className="relative" ref={menuRef}>
        <ToolbarButton
          label="Cabeçalho"
          active={style.heading !== null}
          onClick={() => setHeadingOpen((v) => !v)}
        >
          <span className="text-[12px] font-semibold">H</span>
        </ToolbarButton>
        {headingOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 flex w-28 flex-col overflow-hidden rounded-md border border-divider bg-canvas py-1">
            {HEADINGS.map((level) => (
              <button
                key={level}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onApply('heading', level)
                  setHeadingOpen(false)
                }}
                className={`flex items-center gap-2 px-3 py-1.5 text-left text-[12px] transition-colors hover:bg-ink/5 ${
                  style.heading === level ? 'text-accent' : 'text-ink-secondary'
                }`}
              >
                <span className="font-semibold">H{level}</span>
                <span className="text-[11px] text-ink-muted">{"#".repeat(level)} Título</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-0.5 h-4 w-px bg-divider" />

      <ToolbarButton label="Citação" active={style.blockquote} onClick={() => onApply('blockquote')}>
        <span className="text-[14px] leading-none">❝</span>
      </ToolbarButton>
      <ToolbarButton label="Lista com marcadores" active={style.bullet} onClick={() => onApply('bullet')}>
        <span className="text-[14px] leading-none">•</span>
      </ToolbarButton>
      <ToolbarButton label="Lista numerada" active={style.numbered} onClick={() => onApply('number')}>
        <span className="text-[12px] font-medium">1.</span>
      </ToolbarButton>
    </div>
  )
}
