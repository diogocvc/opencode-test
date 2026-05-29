import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './store'

beforeEach(() => {
  localStorage.clear()
  useStore.setState({
    blocks: [{ id: 'block-1', text: '' }],
    settings: { provider: 'openai', apiKey: '', model: 'gpt-4o-mini' },
    selectedBlockIds: [],
    loading: false,
    undoStack: [],
  })
})

describe('store', () => {
  it('starts with one empty block', () => {
    const { blocks } = useStore.getState()
    expect(blocks).toHaveLength(1)
    expect(blocks[0].text).toBe('')
  })

  it('adds a block after a given block', () => {
    useStore.getState().addBlock('block-1')
    const { blocks } = useStore.getState()
    expect(blocks).toHaveLength(2)
  })

  it('adds a block at the end when no afterId', () => {
    useStore.getState().addBlock()
    const { blocks } = useStore.getState()
    expect(blocks).toHaveLength(2)
  })

  it('removes a block', () => {
    useStore.getState().addBlock('block-1')
    useStore.getState().removeBlock('block-1')
    const { blocks } = useStore.getState()
    expect(blocks).toHaveLength(1)
  })

  it('removes block from selection when deleted', () => {
    useStore.getState().addBlock('block-1')
    const secondId = useStore.getState().blocks[1].id
    useStore.getState().toggleSelectBlock(secondId)
    useStore.getState().removeBlock(secondId)
    const { selectedBlockIds } = useStore.getState()
    expect(selectedBlockIds).not.toContain(secondId)
  })

  it('updates block text', () => {
    useStore.getState().updateBlock('block-1', 'new text')
    const { blocks } = useStore.getState()
    expect(blocks[0].text).toBe('new text')
  })

  it('moves a block', () => {
    useStore.getState().addBlock('block-1')
    const secondId = useStore.getState().blocks[1].id
    useStore.getState().moveBlock(1, 0)
    const { blocks } = useStore.getState()
    expect(blocks[0].id).toBe(secondId)
  })

  it('toggles block selection', () => {
    useStore.getState().toggleSelectBlock('block-1')
    expect(useStore.getState().selectedBlockIds).toContain('block-1')
    useStore.getState().toggleSelectBlock('block-1')
    expect(useStore.getState().selectedBlockIds).not.toContain('block-1')
  })

  it('clears selection', () => {
    useStore.getState().toggleSelectBlock('block-1')
    useStore.getState().clearSelection()
    expect(useStore.getState().selectedBlockIds).toHaveLength(0)
  })

  it('sets loading', () => {
    useStore.getState().setLoading(true)
    expect(useStore.getState().loading).toBe(true)
  })

  it('updates settings and auto-selects model when provider changes', () => {
    useStore.getState().updateSettings({ provider: 'anthropic' })
    const { settings } = useStore.getState()
    expect(settings.provider).toBe('anthropic')
    expect(settings.model).toBe('claude-3-haiku-20240307')
  })

  it('keeps custom model when only apiKey changes', () => {
    useStore.getState().updateSettings({ apiKey: 'sk-test' })
    const { settings } = useStore.getState()
    expect(settings.model).toBe('gpt-4o-mini')
  })

  it('sets streaming block id', () => {
    expect(useStore.getState().streamingBlockId).toBeNull()
    useStore.getState().setStreamingBlockId('block-1')
    expect(useStore.getState().streamingBlockId).toBe('block-1')
    useStore.getState().setStreamingBlockId(null)
    expect(useStore.getState().streamingBlockId).toBeNull()
  })

  it('toggles dark mode', () => {
    expect(useStore.getState().darkMode).toBe(false)
    useStore.getState().toggleDarkMode()
    expect(useStore.getState().darkMode).toBe(true)
    useStore.getState().toggleDarkMode()
    expect(useStore.getState().darkMode).toBe(false)
  })

  it('adds a toast', () => {
    useStore.getState().addToast('test error', 'error')
    const { toasts } = useStore.getState()
    expect(toasts).toHaveLength(1)
    expect(toasts[0].message).toBe('test error')
    expect(toasts[0].type).toBe('error')
  })

  it('removes a toast', () => {
    useStore.setState({ toasts: [{ id: 't1', message: 'test', type: 'info' }] })
    useStore.getState().removeToast('t1')
    expect(useStore.getState().toasts).toHaveLength(0)
  })

  describe('undo', () => {
    it('pushes undo stack with current blocks', () => {
      useStore.getState().pushUndo()
      expect(useStore.getState().undoStack).toHaveLength(1)
      expect(useStore.getState().undoStack[0]).toHaveLength(1)
    })

    it('restores blocks on undo', () => {
      useStore.getState().addBlock('block-1')
      useStore.getState().pushUndo()
      useStore.getState().addBlock('block-1')
      useStore.getState().undo()
      expect(useStore.getState().blocks).toHaveLength(2)
    })

    it('clears selection on undo', () => {
      useStore.getState().pushUndo()
      useStore.getState().toggleSelectBlock('block-1')
      useStore.getState().undo()
      expect(useStore.getState().selectedBlockIds).toHaveLength(0)
    })

    it('does nothing when stack is empty', () => {
      const before = useStore.getState().blocks.length
      useStore.getState().undo()
      expect(useStore.getState().blocks).toHaveLength(before)
    })

    it('addBlock auto-pushes undo', () => {
      useStore.getState().addBlock('block-1')
      expect(useStore.getState().undoStack).toHaveLength(1)
    })

    it('removeBlock auto-pushes undo', () => {
      useStore.getState().addBlock('block-1')
      useStore.getState().removeBlock('block-1')
      expect(useStore.getState().undoStack).toHaveLength(2)
      useStore.getState().undo()
      expect(useStore.getState().blocks).toHaveLength(2)
    })

    it('moveBlock auto-pushes undo', () => {
      useStore.getState().addBlock('block-1')
      useStore.getState().moveBlock(0, 1)
      expect(useStore.getState().undoStack).toHaveLength(2)
    })
  })
})
