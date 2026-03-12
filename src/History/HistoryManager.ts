export interface HistoryAction {
  undo: () => void
  redo: () => void
  dispose?: () => void
}

export class HistoryManager {
  public undoStack: HistoryAction[]
  public redoStack: HistoryAction[]
  public listeners: Set<() => void>

  constructor(
    public maxSteps = 50,
  ) {
    this.undoStack = []
    this.redoStack = []
    this.listeners = new Set()
  }

  get canUndo() {
    return this.undoStack.length > 0
  }

  get canRedo() {
    return this.redoStack.length > 0
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  notify() {
    this.listeners.forEach((fn) => fn())
  }

  commit(action: HistoryAction) {
    this.undoStack.push(action)
    this.clearRedoStack()

    if (this.undoStack.length > this.maxSteps) {
      this.undoStack.shift()?.dispose?.()
    }

    this.notify()
  }

  undo() {
    let action = this.undoStack.pop()

    if (!action) return

    this.redoStack.push(action)
    action.undo()

    this.notify()
  }

  redo() {
    let action = this.redoStack.pop()

    if (!action) return

    this.undoStack.push(action)
    action.redo()

    this.notify()
  }

  clearRedoStack() {
    let length = this.redoStack.length

    for (let i = 0; i < length; i++) {
      let action = this.redoStack[i]

      if (action) {
        action.dispose?.()
      }
    }

    this.redoStack.length = 0
  }
}
