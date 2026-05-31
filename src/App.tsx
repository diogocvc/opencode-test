import { useCallback, useEffect, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useStore, type Block } from './store'
import { callAIStream, bridgePrompt, correctPrompt, rewritePrompt } from './ai'
import BlockComponent from './components/Block'
import SettingsModal from './components/SettingsModal'
import Toast from './components/Toast'

export default function App() {
  const {
    blocks,
    selectedBlockIds,
    loading,
    darkMode,
    setLoading,
    setStreamingBlockId,
    updateBlock,
    moveBlock,
    clearSelection,
    addBlock,
    settings,
    toggleDarkMode,
    addToast,
    undo,
  } = useStore()

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rewriteId, setRewriteId] = useState<string | null>(null)
  const [rewriteInstruction, setRewriteInstruction] = useState('')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIdx = blocks.findIndex((b) => b.id === active.id)
      const newIdx = blocks.findIndex((b) => b.id === over.id)
      if (oldIdx !== -1 && newIdx !== -1) moveBlock(oldIdx, newIdx)
    },
    [blocks, moveBlock],
  )

  const streamIntoBlock = useCallback(
    async (blockId: string, system: string, user: string) => {
      setStreamingBlockId(blockId)
      const fullText = await callAIStream(settings.provider, settings.apiKey, settings.model, system, user, (delta) => {
        const current = useStore.getState().blocks.find((b) => b.id === blockId)
        useStore.getState().updateBlock(blockId, (current?.text ?? '') + delta)
      })
      updateBlock(blockId, fullText)
    },
    [settings, setStreamingBlockId, updateBlock],
  )

  const handleBridge = useCallback(async () => {
    if (selectedBlockIds.length !== 2) return
    if (!settings.apiKey) {
      setSettingsOpen(true)
      return
    }
    const sorted = [...selectedBlockIds].sort(
      (a, b) => blocks.findIndex((blk) => blk.id === a) - blocks.findIndex((blk) => blk.id === b),
    )
    const [idA, idB] = sorted
    const blockA = blocks.find((b) => b.id === idA)
    const blockB = blocks.find((b) => b.id === idB)
    if (!blockA || !blockB) return

    useStore.getState().pushUndo()
    const newBlock: Block = { id: `block-${Date.now()}`, text: '' }
    useStore.setState((s) => {
      const idxA = s.blocks.findIndex((b) => b.id === idA)
      const newBlocks = [...s.blocks]
      newBlocks.splice(idxA + 1, 0, newBlock)
      return { blocks: newBlocks, selectedBlockIds: [] }
    })

    setLoading(true)
    try {
      const { system, user } = bridgePrompt(blockA.text, blockB.text)
      await streamIntoBlock(newBlock.id, system, user)
      addToast('Texto de transição gerado com sucesso!', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao comunicar com a IA.'
      addToast(message, 'error')
    } finally {
      setLoading(false)
      setStreamingBlockId(null)
    }
  }, [selectedBlockIds, blocks, settings, setLoading, setStreamingBlockId, addToast, streamIntoBlock])

  const handleCorrect = useCallback(
    async (id: string) => {
      if (!settings.apiKey) {
        setSettingsOpen(true)
        return
      }
      const block = blocks.find((b) => b.id === id)
      if (!block) return
      useStore.getState().pushUndo()
      setLoading(true)
      updateBlock(id, '')
      try {
        const { system, user } = correctPrompt(block.text)
        await streamIntoBlock(id, system, user)
        addToast('Bloco corrigido com sucesso!', 'success')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao comunicar com a IA.'
        addToast(message, 'error')
      } finally {
        setLoading(false)
        setStreamingBlockId(null)
      }
    },
    [blocks, settings, setLoading, setStreamingBlockId, addToast, streamIntoBlock, updateBlock],
  )

  const handleRewrite = useCallback(
    async (id: string) => {
      if (!settings.apiKey) {
        setSettingsOpen(true)
        return
      }
      if (!rewriteInstruction.trim()) return
      const block = blocks.find((b) => b.id === id)
      if (!block) return
      useStore.getState().pushUndo()
      setLoading(true)
      updateBlock(id, '')
      try {
        const { system, user } = rewritePrompt(block.text, rewriteInstruction)
        await streamIntoBlock(id, system, user)
        setRewriteId(null)
        setRewriteInstruction('')
        addToast('Bloco reescrito com sucesso!', 'success')
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao comunicar com a IA.'
        addToast(message, 'error')
      } finally {
        setLoading(false)
        setStreamingBlockId(null)
      }
    },
    [blocks, settings, setLoading, setStreamingBlockId, rewriteInstruction, addToast, streamIntoBlock, updateBlock],
  )

  const exportMarkdown = useCallback(() => {
    return blocks.map((b) => b.text).join('\n\n')
  }, [blocks])

  const handleCopyExport = useCallback(() => {
    const md = exportMarkdown()
    navigator.clipboard.writeText(md)
    addToast('Texto copiado para a área de transferência!', 'success')
  }, [exportMarkdown, addToast])

  const handleDownloadExport = useCallback(() => {
    const md = exportMarkdown()
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'documento.md'
    a.click()
    URL.revokeObjectURL(url)
    addToast('Arquivo .md exportado com sucesso!', 'success')
  }, [exportMarkdown, addToast])

  const hasSelection = selectedBlockIds.length > 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto flex max-w-3xl flex-col px-4">
        <header className="flex items-center justify-between border-b border-gray-200 py-4 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Editor de Blocos
        </h1>
        <div className="flex items-center gap-2">
          {!settings.apiKey && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              API Key não configurada
            </span>
          )}
          <button
            onClick={toggleDarkMode}
            className="rounded-lg border border-gray-300 p-1.5 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            title={darkMode ? 'Modo claro' : 'Modo escuro'}
          >
            {darkMode ? (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Configurar IA
          </button>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm text-blue-600 dark:text-blue-400">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          IA processando...
        </div>
      )}

      {hasSelection && (
        <div className="flex items-center gap-2 py-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {selectedBlockIds.length} bloco(s) selecionado(s)
          </span>
          <button
            onClick={() => {
              if (selectedBlockIds.length === 2) {
                handleBridge()
              } else {
                addToast('Selecione exatamente 2 blocos para ligar.', 'info')
              }
            }}
            disabled={loading || selectedBlockIds.length !== 2}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            Ligar blocos
          </button>
          <button
            onClick={clearSelection}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Limpar seleção
          </button>
        </div>
      )}

      <main className="flex-1 space-y-3 py-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, index) => (
              <div key={block.id}>
                <BlockComponent
                  block={block}
                  index={index}
                  total={blocks.length}
                  isSelected={selectedBlockIds.includes(block.id)}
                />
                {block.id === rewriteId && (
                  <div className="ml-12 mt-1 flex gap-2">
                    <input
                      value={rewriteInstruction}
                      onChange={(e) => setRewriteInstruction(e.target.value)}
                      placeholder="Ex: torne mais formal, resuma em 2 frases..."
                      className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
                    />
                    <button
                      onClick={() => handleRewrite(block.id)}
                      disabled={loading}
                      className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      Ok
                    </button>
                    <button
                      onClick={() => { setRewriteId(null); setRewriteInstruction('') }}
                      className="rounded border border-gray-300 px-3 py-1 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-300"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                <div className="ml-12 mt-1 flex gap-1">
                  <button
                    onClick={() => handleCorrect(block.id)}
                    disabled={loading || !block.text.trim()}
                    className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                  >
                    Corrigir
                  </button>
                  <button
                    onClick={() => setRewriteId(block.id)}
                    disabled={loading}
                    className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:hover:bg-gray-700"
                  >
                    Reescrever
                  </button>
                </div>
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </main>

      <footer className="flex items-center justify-between border-t border-gray-200 py-4 dark:border-gray-700">
        <button
          onClick={() => addBlock()}
          className="rounded-lg border border-dashed border-gray-400 px-4 py-2 text-sm text-gray-500 hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-300"
        >
          + Novo bloco
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleCopyExport}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            Copiar
          </button>
          <button
            onClick={handleDownloadExport}
            className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm text-white hover:bg-gray-700 dark:bg-gray-200 dark:text-gray-800 dark:hover:bg-gray-300"
          >
            Exportar .md
          </button>
        </div>
      </footer>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Toast />
    </div>
  )
}
