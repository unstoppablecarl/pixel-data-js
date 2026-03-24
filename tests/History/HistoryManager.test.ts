import { type HistoryAction, HistoryManager } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('HistoryManager', () => {
  let manager: HistoryManager

  beforeEach(() => {
    manager = new HistoryManager(10)
  })

  it('should initialize correctly', () => {
    expect(manager.undoStack).toEqual([])
    expect(manager.redoStack).toEqual([])
    expect(manager.canUndo).toBe(false)
    expect(manager.canRedo).toBe(false)
    expect(manager.maxSteps).toBe(10)
  })

  it('should commit an action', () => {
    const action: HistoryAction = {
      undo: vi.fn(),
      redo: vi.fn(),
    }

    manager.commit(action)

    expect(manager.undoStack).toHaveLength(1)
    expect(manager.undoStack[0]).toBe(action)
    expect(manager.canUndo).toBe(true)
    expect(manager.canRedo).toBe(false)
  })

  it('should clear redo stack on commit', () => {
    const action1: HistoryAction = { undo: vi.fn(), redo: vi.fn() }
    const action2: HistoryAction = { undo: vi.fn(), redo: vi.fn() }

    manager.commit(action1)
    manager.undo()

    expect(manager.redoStack).toHaveLength(1)
    expect(manager.canRedo).toBe(true)

    manager.commit(action2)

    expect(manager.redoStack).toHaveLength(0)
    expect(manager.canRedo).toBe(false)
    expect(manager.undoStack).toHaveLength(1)
    expect(manager.undoStack[0]).toBe(action2)
  })

  it('should dispose items when clearing redo stack', () => {
    const dispose = vi.fn()
    const action: HistoryAction = {
      undo: vi.fn(),
      redo: vi.fn(),
      dispose,
    }

    manager.commit(action)
    manager.undo()

    // Committing a new action should clear the redo stack and dispose the old action
    manager.commit({ undo: vi.fn(), redo: vi.fn() })

    expect(dispose).toHaveBeenCalledTimes(1)
  })

  it('should undo an action', () => {
    const undo = vi.fn()
    const redo = vi.fn()
    const action: HistoryAction = { undo, redo }

    manager.commit(action)
    manager.undo()

    expect(undo).toHaveBeenCalledTimes(1)
    expect(manager.undoStack).toHaveLength(0)
    expect(manager.redoStack).toHaveLength(1)
    expect(manager.canUndo).toBe(false)
    expect(manager.canRedo).toBe(true)
  })

  it('should redo an action', () => {
    const undo = vi.fn()
    const redo = vi.fn()
    const action: HistoryAction = { undo, redo }

    manager.commit(action)
    manager.undo()
    manager.redo()

    expect(redo).toHaveBeenCalledTimes(1)
    expect(manager.undoStack).toHaveLength(1)
    expect(manager.redoStack).toHaveLength(0)
    expect(manager.canUndo).toBe(true)
    expect(manager.canRedo).toBe(false)
  })

  it('should not undo if stack is empty', () => {
    const notifySpy = vi.spyOn(manager, 'notify')
    manager.undo()
    expect(notifySpy).not.toHaveBeenCalled()
  })

  it('should not redo if stack is empty', () => {
    const notifySpy = vi.spyOn(manager, 'notify')
    manager.redo()
    expect(notifySpy).not.toHaveBeenCalled()
  })

  it('should enforce maxSteps', () => {
    const limit = 3
    manager = new HistoryManager(limit)
    const disposeSpy = vi.fn()

    const actions: HistoryAction[] = []
    for (let i = 0; i < limit + 1; i++) {
      const action = {
        undo: vi.fn(),
        redo: vi.fn(),
        dispose: i === 0 ? disposeSpy : undefined,
      }
      actions.push(action)
      manager.commit(action)
    }

    expect(manager.undoStack).toHaveLength(limit)
    // The first action should have been pushed out
    expect(manager.undoStack[0]).toBe(actions[1])
    expect(manager.undoStack[limit - 1]).toBe(actions[limit])

    // Verify dispose was called on the oldest action
    expect(disposeSpy).toHaveBeenCalledTimes(1)
  })

  it('should notify listeners on change', () => {
    const listener = vi.fn()
    const unsubscribe = manager.subscribe(listener)

    const action: HistoryAction = { undo: vi.fn(), redo: vi.fn() }

    manager.commit(action)
    expect(listener).toHaveBeenCalledTimes(1)

    manager.undo()
    expect(listener).toHaveBeenCalledTimes(2)

    manager.redo()
    expect(listener).toHaveBeenCalledTimes(3)

    unsubscribe()
    manager.commit(action)
    expect(listener).toHaveBeenCalledTimes(3) // No new calls
  })
})
