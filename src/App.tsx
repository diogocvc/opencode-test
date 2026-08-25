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
import { useStore, type Block as BlockType } from './store'
import { callAIStream, bridgePrompt, correctPrompt, rewritePrompt } from './ai'
import { saveMarkdown, openMarkdown, isMarkdownFile, readMarkdownFile } from './io'
import { copyRichText, exportRichText } from './richText'
import Block from './components/Block'
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
      const fullText = await callAIStream(
        settings.provider,
        settings.apiKey,
        settings.model,
        system,
        user,
        (delta) => {
          const current = useStore.getState().blocks.find((b) => b.id === blockId)
          useStore.getState().updateBlock(blockId, (current?.text ?? '') + delta)
        },
      )
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
      (a, b) =>
        blocks.findIndex((blk) => blk.id === a) - blocks.findIndex((blk) => blk.id === b),
    )
    const [idA, idB] = sorted
    const blockA = blocks.find((b) => b.id === idA)
    const blockB = blocks.find((b) => b.id === idB)
    if (!blockA || !blockB) return

    useStore.getState().pushUndo()
    const newBlock: BlockType = { id: `block-${Date.now()}`, text: '' }
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
      setStreamingBlockId(null)
      setLoading(false)
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
        setStreamingBlockId(null)
        setLoading(false)
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
        setStreamingBlockId(null)
        setLoading(false)
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

  const loadBlocks = useCallback((texts: string[]) => {
    useStore.getState().pushUndo()
    const newBlocks: BlockType[] = texts.map((text, i) => ({
      id: `block-${Date.now()}-${i}`,
      text,
    }))
    useStore.setState({ blocks: newBlocks, selectedBlockIds: [] })
  }, [])

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
  const bridgeMode = selectedBlockIds.length === 2

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink">
      <header className="border-b border-divider">
        <div className="flex h-10 items-center justify-between px-5 sm:px-9">
          <h1 className="font-display text-[12px] font-semibold uppercase tracking-[0.22em] text-ink-secondary">
            TEXTRIS
          </h1>
          <div className="flex items-center gap-3">
            {!settings.apiKey && (
              <span className="text-[11px] text-ink-muted">API Key não configurada</span>
            )}
            <button
              onClick={toggleDarkMode}
              className="flex h-7 w-7 items-center justify-center rounded-md text-ink-secondary transition-colors hover:bg-ink/5 hover:text-ink"
              title={darkMode ? 'Modo claro' : 'Modo escuro'}
              aria-label={darkMode ? 'Ativar modo claro' : 'Ativar modo escuro'}
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
              className="text-[12px] text-ink-secondary transition-colors hover:text-ink"
            >
              Configurar IA
            </button>
          </div>
        </div>
      </header>

      {loading && (
        <div className="fixed left-1/2 top-3 z-20 -translate-x-1/2 rounded-md border border-divider bg-canvas px-3 py-1.5 text-[12px] text-accent shadow-md">
          IA processando...
        </div>
      )}

      <main className="mx-auto w-full px-5 pb-28 pt-20 min-[1067px]:w-[60vw]">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            {blocks.map((block, index) => (
              <div key={block.id}>
                <Block
                  block={block}
                  index={index}
                  total={blocks.length}
                  isSelected={selectedBlockIds.includes(block.id)}
                  eligibleForBridge={
                    firstSelectedId !== null &&
                    block.id !== firstSelectedId &&
                    Math.abs(blockIndices.get(block.id)! - firstIdx) === 1
                  }
                  onCorrect={handleCorrect}
                  onRewriteToggle={(id) => setRewriteId(id)}
                  rewriteOpen={rewriteId === block.id}
                  onRewriteSubmit={handleRewrite}
                  onRewriteCancel={() => {
                    setRewriteId(null)
                    setRewriteInstruction('')
                  }}
                  rewriteInstruction={rewriteInstruction}
                  onRewriteChange={setRewriteInstruction}
                  loading={loading}
                />

                {index < blocks.length - 1 &&
                  bridgeMode &&
                  selectedBlockIds.includes(block.id) &&
                  selectedBlockIds.includes(blocks[index + 1].id) && (
                    <div className="mb-7 flex items-center gap-2 pl-8 sm:pl-14">
                      <button
                        onClick={handleBridge}
                        disabled={loading}
                        className="inline-flex h-8 items-center rounded-[4px] border border-divider bg-canvas px-3 text-[12px] font-medium text-ink-secondary transition-colors hover:text-ink disabled:opacity-50"
                      >
                        Ligar blocos
                      </button>
                      <button
                        onClick={clearSelection}
                        className="inline-flex h-8 items-center rounded-[4px] border border-divider bg-canvas px-3 text-[12px] font-medium text-ink-secondary transition-colors hover:text-ink"
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

      <footer className="fixed inset-x-0 bottom-0 border-t border-divider bg-canvas">
        <div className="flex h-12 items-center gap-6 overflow-x-auto px-5 sm:px-9">
          <button
            onClick={() => addBlock()}
            className="h-8 shrink-0 whitespace-nowrap rounded-[4px] bg-ink px-4 text-[12px] font-medium text-canvas transition-opacity hover:opacity-90"
          >
            + Novo bloco
          </button>
          <div className="flex shrink-0 items-center gap-4 whitespace-nowrap text-[12px] text-ink-secondary">
            <button
              onClick={handleCopyExport}
              className="rounded-[4px] px-2 py-1 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              Copiar
            </button>
            <button
              onClick={handleOpenClick}
              className="rounded-[4px] px-2 py-1 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              Abrir .md
            </button>
            <button
              onClick={handleSave}
              className="rounded-[4px] px-2 py-1 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              Salvar
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-4 whitespace-nowrap text-[12px] text-ink-secondary">
            <button
              onClick={handleDownloadMd}
              className="rounded-[4px] px-2 py-1 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              Exportar .md
            </button>
            <button
              onClick={handleDownloadHtml}
              className="rounded-[4px] px-2 py-1 transition-colors hover:bg-ink/5 hover:text-ink"
            >
              Exportar .html
            </button>
          </div>
          <span className="ml-auto shrink-0 text-[11px] text-ink-muted">
            {blocks.length} bloco{blocks.length === 1 ? '' : 's'}
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,text/markdown"
          className="hidden"
          onChange={handleFileChange}
        />
      </footer>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <Toast />
    </div>
  )
}
