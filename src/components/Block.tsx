import { useCallback, useRef, useEffect } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useStore, type Block as BlockType } from '../store'

interface Props {
  block: BlockType
  index: number
  isSelected: boolean
  total: number
}

export default function Block({ block, index, isSelected, total }: Props) {
  const { updateBlock, removeBlock, moveBlock, toggleSelectBlock, addBlock, streamingBlockId, focusedBlockId, setFocusedBlockId } = useStore()
  const isStreaming = streamingBlockId === block.id
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  useEffect(() => {
    if (focusedBlockId === block.id && textareaRef.current) {
      textareaRef.current.focus()
      setFocusedBlockId(null)
    }
  }, [focusedBlockId, block.id, setFocusedBlockId])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault()
        addBlock(block.id)
      }
    },
    [block.id, addBlock],
  )

  const handleBlur = useCallback(() => {
    useStore.getState().pushUndo()
  }, [])

  useEffect(() => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${ta.scrollHeight}px`
    }
  }, [block.text])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex gap-2 rounded-lg border p-3 transition-colors ${
        isSelected
          ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-950'
          : isStreaming
            ? 'border-blue-400 bg-white ring-2 ring-blue-200 dark:border-blue-400 dark:bg-gray-800 dark:ring-blue-800'
            : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800'
      }`}
    >
      <div className="flex flex-col items-center gap-1 pt-1">
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 active:cursor-grabbing"
          title="Arrastar"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
          </svg>
        </button>
        {index > 0 && (
          <button
            onClick={() => moveBlock(index, index - 1)}
            className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Mover para cima"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
        )}
        {index < total - 1 && (
          <button
            onClick={() => moveBlock(index, index + 1)}
            className="rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Mover para baixo"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      <textarea
        ref={textareaRef}
        value={block.text}
        onChange={(e) => updateBlock(block.id, e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="Escreva seu texto aqui..."
        className="min-h-[60px] flex-1 resize-none overflow-hidden border-0 bg-transparent p-0 text-gray-800 outline-none placeholder:text-gray-400 dark:text-gray-100 dark:placeholder:text-gray-500"
        rows={1}
      />

      <div className="flex flex-col gap-1 pt-1">
        <button
          onClick={() => toggleSelectBlock(block.id)}
          className={`rounded p-1 ${
            isSelected
              ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
              : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
          }`}
          title="Selecionar para ligar"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </button>
        <button
          onClick={() => removeBlock(block.id)}
          className="rounded p-1 text-gray-400 hover:text-red-500"
          title="Excluir bloco"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  )
}
