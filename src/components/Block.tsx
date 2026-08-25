import { useEffect, useRef } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore } from '../store'
import { formatBlock, detectBlockStyle, type FormatAction } from '../markdown'
import Toolbar from './Toolbar'

interface BlockProps {
  block: { id: string; text: string }
  index: number
  total: number
  isSelected: boolean
  eligibleForBridge: boolean
  bridgeMode?: boolean
  isStreaming?: boolean
  onCorrect?: (id: string) => void
  onRewriteToggle?: (id: string) => void
  rewriteOpen?: boolean
  onRewriteSubmit?: (id: string) => void
  onRewriteCancel?: () => void
  rewriteInstruction?: string
  onRewriteChange?: (value: string) => void
  loading?: boolean
}

export default function Block({
  block,
  index,
  total,
  isSelected,
  eligibleForBridge,
  bridgeMode: bridgeModeProp,
  isStreaming: isStreamingProp,
  onCorrect,
  onRewriteToggle,
  rewriteOpen = false,
  onRewriteSubmit,
  onRewriteCancel,
  rewriteInstruction = '',
  onRewriteChange,
  loading = false,
}: BlockProps) {
  const {
    updateBlock,
    removeBlock,
    addBlock,
    moveBlock,
    pushUndo,
    toggleSelectBlock,
    setActiveBlockId,
    activeBlockId,
    focusedBlockId,
    selectedBlockIds,
    streamingBlockId,
  } = useStore()

  useEffect(() => {
    if (focusedBlockId === block.id && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [focusedBlockId, block.id])

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const textBeforeFocus = useRef(block.text)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  const isActive = activeBlockId === block.id

  const isStreaming = isStreamingProp ?? (streamingBlockId === block.id)

  const bridgeMode = bridgeModeProp ?? (selectedBlockIds.length === 1 && !isSelected)

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  useEffect(() => {
    const ta = textareaRef.current
    if (ta) autoResize(ta)
  }, [block.text])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateBlock(block.id, e.target.value)
    autoResize(e.target)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
      e.preventDefault()
      addBlock(block.id)
    }
    if (e.key === 'Backspace' && block.text === '') {
      e.preventDefault()
      removeBlock(block.id)
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      applyFormatting('bold')
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
      e.preventDefault()
      applyFormatting('italic')
    }
  }

  const applyFormatting = (action: FormatAction, level?: number) => {
    const textarea = textareaRef.current
    if (!textarea) return
    const value = block.text
    const result = formatBlock(
      value,
      textarea.selectionStart,
      textarea.selectionEnd,
      action,
      level,
    )
    updateBlock(block.id, result.text)
    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(result.selStart, result.selEnd)
    })
  }

  const numberColor = isActive
    ? 'text-ink-secondary'
    : isSelected
      ? 'text-accent'
      : isStreaming
        ? 'text-accent'
        : 'text-ink-muted'

  const dividerClass = isSelected ? 'border-accent/40' : 'border-divider'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex gap-4 py-9 ${
        isSelected ? 'is-selected' : ''
      } ${isStreaming ? 'is-streaming' : ''}`}
    >
      <div className="w-8 shrink-0 pt-1 text-right sm:w-10">
        <span
          className={`text-[12px] font-medium tabular-nums transition-colors ${numberColor}`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
      </div>

      <div
        className={`relative flex-1 min-w-0 ${
          index < total - 1 ? `border-b ${dividerClass}` : ''
        }`}
      >
        <div className="absolute right-0 top-0 flex items-center gap-0.5 opacity-30 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
          <button
            {...listeners}
            {...attributes}
            type="button"
            title="Arrastar"
            aria-label="Arrastar"
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
              <circle cx="4" cy="3" r="1.2" />
              <circle cx="10" cy="3" r="1.2" />
              <circle cx="4" cy="7" r="1.2" />
              <circle cx="10" cy="7" r="1.2" />
              <circle cx="4" cy="11" r="1.2" />
              <circle cx="10" cy="11" r="1.2" />
            </svg>
          </button>

          {index > 0 && (
            <button
              type="button"
              onClick={() => moveBlock(index, index - 1)}
              title="Mover para cima"
              aria-label="Mover para cima"
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M7 10V4M7 4L4 7M7 4l3 3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          {index < total - 1 && (
            <button
              type="button"
              onClick={() => moveBlock(index, index + 1)}
              title="Mover para baixo"
              aria-label="Mover para baixo"
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M7 4v6M7 10l-3-3M7 10l3-3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}

          <button
            type="button"
            onClick={() => toggleSelectBlock(block.id)}
            disabled={bridgeMode && !eligibleForBridge}
            title="Selecionar para ligar"
            aria-label="Selecionar para ligar"
            className={`flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
              isSelected
                ? 'text-accent'
                : eligibleForBridge
                  ? 'text-accent animate-pulse'
                  : bridgeMode
                    ? 'cursor-not-allowed text-ink-muted/50'
                    : 'text-ink-muted hover:bg-ink/5 hover:text-ink'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 9l4-4M4 6.5l.5-2.5L7 4m3 4.5L9.5 13 7 11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => removeBlock(block.id)}
            title="Excluir bloco"
            aria-label="Excluir bloco"
            className="flex h-7 w-7 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M3 4h8M5.5 4V3h3v1M4.5 4l.5 7h4l.5-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          value={block.text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            const current =
              useStore.getState().blocks.find((b) => b.id === block.id)?.text ??
              block.text
            if (textBeforeFocus.current !== current) pushUndo()
          }}
          onFocus={() => {
            textBeforeFocus.current = textareaRef.current?.value ?? block.text
            setActiveBlockId(block.id)
          }}
          aria-label={`Bloco ${index + 1}`}
          placeholder="Escreva seu texto aqui..."
          rows={1}
          className={`min-h-[60px] w-full resize-none overflow-hidden border-0 bg-transparent p-0 pr-12 text-[15px] font-normal leading-relaxed outline-none transition-colors placeholder:text-ink-muted ${
            isActive ? 'text-ink' : 'text-ink-secondary'
          }`}
        />

        {isActive && (
          <div className="mt-2 flex animate-toolbar-in flex-wrap items-center gap-2">
            <Toolbar style={detectBlockStyle(block.text)} onApply={applyFormatting} />
            <span className="h-4 w-px bg-divider" />
            <button
              type="button"
              onClick={() => onCorrect?.(block.id)}
              disabled={loading || !block.text.trim()}
              className="text-[11px] text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
            >
              Corrigir
            </button>
            <button
              type="button"
              onClick={() => onRewriteToggle?.(block.id)}
              disabled={loading}
              className="text-[11px] text-ink-muted transition-colors hover:text-ink disabled:opacity-30"
            >
              Reescrever
            </button>
          </div>
        )}

        {rewriteOpen && (
          <div className="mt-2 flex gap-2">
            <input
              value={rewriteInstruction}
              onChange={(e) => onRewriteChange?.(e.target.value)}
              placeholder="Ex: torne mais formal..."
              className="h-9 flex-1 rounded-md border border-divider bg-transparent px-3 text-[13px] text-ink outline-none placeholder:text-ink-muted focus:border-accent"
            />
            <button
              type="button"
              onClick={() => onRewriteSubmit?.(block.id)}
              disabled={loading}
              className="h-9 rounded-md border border-divider px-3 text-[12px] font-medium text-ink-secondary transition-colors hover:text-ink disabled:opacity-50"
            >
              Ok
            </button>
            <button
              type="button"
              onClick={() => onRewriteCancel?.()}
              className="h-9 rounded-md border border-divider px-3 text-[12px] text-ink-secondary transition-colors hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
