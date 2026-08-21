import { useCallback, useEffect, useRef, useState } from 'react'
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
import { saveMarkdown, openMarkdown, isMarkdownFile, readMarkdownFile } from './io'
import { copyRichText, exportRichText } from './richText'
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

  const handleCopyExport = useCallback(async () => {
    const ok = await copyRichText(blocks)
    addToast(ok ? 'Texto copiado com formatação!' : 'Erro ao copiar.', ok ? 'success' : 'error')
  }, [blocks, addToast])

  const handleDownloadHtml = useCallback(() => {
    exportRichText(blocks)
    addToast('Arquivo .html exportado com sucesso!', 'success')
  }, [blocks, addToast])

  const handleDownloadMd = useCallback(() => {
    const md = blocks.map((b) => b.text).join('\n\n')
    const blob = new Blob([md], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'documento.md'
    a.click()
    URL.revokeObjectURL(url)
    addToast('Arquivo .md exportado com sucesso!', 'success')
  }, [blocks, addToast])

  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadBlocks = useCallback(
    (texts: string[]) => {
      useStore.getState().pushUndo()
      const newBlocks: Block[] = texts.map((text, i) => ({ id: `block-${Date.now()}-${i}`, text }))
      useStore.setState({ blocks: newBlocks, selectedBlockIds: [] })
    },
    [],
  )

  const handleSave = useCallback(async () => {
    try {
      const ok = await saveMarkdown(useStore.getState().blocks, 'documento.md')
      if (ok) addToast('Documento salvo com sucesso!', 'success')
    } catch {
      addToast('Erro ao salvar o documento.', 'error')
    }
  }, [addToast])

  const handleOpenClick = useCallback(async () => {
    if (window.showOpenFilePicker) {
      try {
        const texts = await openMarkdown()
        if (texts) {
          loadBlocks(texts)
          addToast('Documento aberto com sucesso!', 'success')
        }
      } catch {
        addToast('Não foi possível abrir o arquivo.', 'error')
      }
      return
    }
    fileInputRef.current?.click()
  }, [loadBlocks, addToast])

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      e.target.value = ''
      if (!file) return
      if (!isMarkdownFile(file.name)) {
        addToast('Apenas arquivos .md são aceitos.', 'error')
        return
      }
      try {
        const texts = await readMarkdownFile(file)
        loadBlocks(texts)
        addToast('Documento aberto com sucesso!', 'success')
      } catch {
        addToast('Não foi possível abrir o arquivo.', 'error')
      }
    },
    [loadBlocks, addToast],
  )

  const firstSelectedId = selectedBlockIds.length === 1 ? selectedBlockIds[0] : null
  const blockIndices = new Map(blocks.map((b, i) => [b.id, i]))
  const firstIdx = firstSelectedId ? blockIndices.get(firstSelectedId)! : -1

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 dark:bg-gray-900 dark:text-gray-100">
      <div className="mx-auto flex max-w-3xl flex-col px-4">
        <header className="flex h-16 items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <h1 className="font-display text-2xl tracking-tight text-gray-900 dark:text-white">
          TEXTRIS
        </h1>
        <div className="flex items-center gap-2">
          {!settings.apiKey && (
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              API Key não configurada
            </span>
          )}
          <button
            onClick={toggleDarkMode}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-800"
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
            className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Configurar IA
          </button>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          IA processando...
        </div>
      )}

      <main className="flex-1 space-y-2 py-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, index) => (
              <div key={block.id}>
                <BlockComponent
                  block={block}
                  index={index}
                  total={blocks.length}
                  isSelected={selectedBlockIds.includes(block.id)}
                  eligibleForBridge={firstSelectedId !== null && block.id !== firstSelectedId && Math.abs(blockIndices.get(block.id)! - firstIdx) === 1}
                />
                {block.id === rewriteId && (
                  <div className="ml-12 mt-2 flex gap-2">
                    <input
                      value={rewriteInstruction}
                      onChange={(e) => setRewriteInstruction(e.target.value)}
                      placeholder="Ex: torne mais formal, resuma em 2 frases..."
                      className="h-11 flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-900 focus:ring-1 focus:ring-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-400 dark:focus:ring-gray-400"
                    />
                    <button
                      onClick={() => handleRewrite(block.id)}
                      disabled={loading}
                      className="inline-flex h-11 items-center rounded-lg bg-black px-4 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
                    >
                      Ok
                    </button>
                    <button
                      onClick={() => { setRewriteId(null); setRewriteInstruction('') }}
                      className="inline-flex h-11 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                <div className="ml-12 mt-2 flex gap-3">
                  <button
                    onClick={() => handleCorrect(block.id)}
                    disabled={loading || !block.text.trim()}
                    className="text-sm font-medium text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-300"
                  >
                    Corrigir
                  </button>
                  <button
                    onClick={() => setRewriteId(block.id)}
                    disabled={loading}
                    className="text-sm font-medium text-gray-400 hover:text-gray-600 disabled:opacity-30 dark:hover:text-gray-300"
                  >
                    Reescrever
                  </button>
                </div>
                {index < blocks.length - 1 &&
                  selectedBlockIds.length === 2 &&
                  selectedBlockIds.includes(block.id) &&
                  selectedBlockIds.includes(blocks[index + 1].id) && (
                  <div className="ml-12 mt-3 flex items-center gap-2">
                    <button
                      onClick={handleBridge}
                      disabled={loading}
                      className="inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50"
                    >
                      Ligar blocos
                    </button>
                    <button
                      onClick={clearSelection}
                      className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-800"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
              </div>
            ))}
          </SortableContext>
        </DndContext>
      </main>

      <footer className="flex items-center justify-between border-t border-gray-100 py-4 dark:border-gray-800">
        <button
          onClick={() => addBlock()}
          className="inline-flex h-10 items-center rounded-lg border border-dashed border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:border-gray-900 hover:text-gray-900 dark:border-gray-600 dark:bg-transparent dark:text-gray-100 dark:hover:border-gray-400"
        >
          + Novo bloco
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleCopyExport}
            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Copiar
          </button>
          <button
            onClick={handleOpenClick}
            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Abrir .md
          </button>
          <button
            onClick={handleSave}
            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Salvar
          </button>
          <button
            onClick={handleDownloadMd}
            className="inline-flex h-10 items-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-100 dark:hover:bg-gray-800"
          >
            Exportar .md
          </button>
          <button
            onClick={handleDownloadHtml}
            className="inline-flex h-10 items-center rounded-lg bg-black px-4 text-sm font-medium text-white hover:bg-gray-900 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-300"
          >
            Exportar .html
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,text/markdown"
          className="hidden"
          onChange={handleFileChange}
        />
      </footer>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Toast />
    </div>
  )
}
