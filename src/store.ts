import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Block {
  id: string
  text: string
}

export type AIProvider = 'openai' | 'anthropic' | 'groq' | 'google'

export interface AISettings {
  provider: AIProvider
  apiKey: string
  model: string
}

export interface Toast {
  id: string
  message: string
  type: 'error' | 'success' | 'info'
}

const PROVIDER_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-haiku-20240307',
  groq: 'llama-3.3-70b-versatile',
  google: 'gemini-1.5-flash',
}

const MAX_UNDO = 50

let nextId = 1
let nextToastId = 1

function genId() {
  return `block-${nextId++}`
}

export interface Store {
  blocks: Block[]
  settings: AISettings
  selectedBlockIds: string[]
  loading: boolean
  streamingBlockId: string | null
  darkMode: boolean
  toasts: Toast[]
  undoStack: Block[][]
  focusedBlockId: string | null
  setFocusedBlockId: (id: string | null) => void
  addBlock: (afterId?: string) => void
  removeBlock: (id: string) => void
  updateBlock: (id: string, text: string) => void
  moveBlock: (fromIndex: number, toIndex: number) => void
  toggleSelectBlock: (id: string) => void
  clearSelection: () => void
  setLoading: (v: boolean) => void
  setStreamingBlockId: (id: string | null) => void
  updateSettings: (s: Partial<AISettings>) => void
  toggleDarkMode: () => void
  addToast: (message: string, type: Toast['type']) => void
  removeToast: (id: string) => void
  pushUndo: () => void
  undo: () => void
}

export const useStore = create<Store>()(
  persist(
    (set) => ({
      blocks: [{ id: genId(), text: '' }],
      settings: { provider: 'openai', apiKey: '', model: PROVIDER_MODELS.openai },
      selectedBlockIds: [],
      loading: false,
      streamingBlockId: null,
      darkMode: false,
      toasts: [],
      undoStack: [],
      focusedBlockId: null,

      setFocusedBlockId: (id) => set({ focusedBlockId: id }),

      addBlock: (afterId) =>
        set((s) => {
          const idx = afterId
            ? s.blocks.findIndex((b) => b.id === afterId)
            : s.blocks.length - 1
          const newBlock = { id: genId(), text: '' }
          const blocks = [...s.blocks]
          blocks.splice(idx + 1, 0, newBlock)
          return {
            blocks,
            undoStack: [s.blocks, ...s.undoStack].slice(0, MAX_UNDO),
            focusedBlockId: newBlock.id,
          }
        }),

      removeBlock: (id) =>
        set((s) => ({
          blocks: s.blocks.filter((b) => b.id !== id),
          selectedBlockIds: s.selectedBlockIds.filter((bid) => bid !== id),
          undoStack: [s.blocks, ...s.undoStack].slice(0, MAX_UNDO),
        })),

      updateBlock: (id, text) =>
        set((s) => ({
          blocks: s.blocks.map((b) => (b.id === id ? { ...b, text } : b)),
        })),

      moveBlock: (fromIndex, toIndex) =>
        set((s) => {
          const blocks = [...s.blocks]
          const [moved] = blocks.splice(fromIndex, 1)
          blocks.splice(toIndex, 0, moved)
          return {
            blocks,
            undoStack: [s.blocks, ...s.undoStack].slice(0, MAX_UNDO),
          }
        }),

      toggleSelectBlock: (id) =>
        set((s) => {
          const exists = s.selectedBlockIds.includes(id)
          const selectedBlockIds = exists
            ? s.selectedBlockIds.filter((bid) => bid !== id)
            : [...s.selectedBlockIds, id]
          return { selectedBlockIds }
        }),

      clearSelection: () => set({ selectedBlockIds: [] }),

      setLoading: (loading) => set({ loading }),

      setStreamingBlockId: (id) => set({ streamingBlockId: id }),

      updateSettings: (partial) =>
        set((s) => {
          const settings = { ...s.settings, ...partial }
          if (partial.provider && !partial.model) {
            settings.model = PROVIDER_MODELS[partial.provider]
          }
          return { settings }
        }),

      toggleDarkMode: () =>
        set((s) => ({ darkMode: !s.darkMode })),

      addToast: (message, type) => {
        const id = `toast-${nextToastId++}`
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
      },

      removeToast: (id) =>
        set((s) => ({
          toasts: s.toasts.filter((t) => t.id !== id),
        })),

      pushUndo: () =>
        set((s) => ({
          undoStack: [s.blocks, ...s.undoStack].slice(0, MAX_UNDO),
        })),

      undo: () =>
        set((s) => {
          if (s.undoStack.length === 0) return {}
          const [restore, ...rest] = s.undoStack
          return { blocks: restore, undoStack: rest, selectedBlockIds: [] }
        }),
    }),
    {
      name: 'editor-blocos-storage',
      partialize: (state) => ({
        blocks: state.blocks,
        settings: state.settings,
        darkMode: state.darkMode,
      }),
    },
  ),
)
