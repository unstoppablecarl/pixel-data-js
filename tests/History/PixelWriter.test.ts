import { HistoryManager, PixelAccumulator, PixelData, PixelWriter } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('PixelWriter', () => {
  let pixelData: PixelData
  let historyManager: HistoryManager
  let writer: PixelWriter<SimpleMutator>

  // Define a simple mutator for testing
  interface SimpleMutator {
    setPixel: (x: number, y: number, color: number) => void
    doNothing: () => void
  }

  const createMutator = (w: PixelWriter<SimpleMutator>): SimpleMutator => {
    return {
      setPixel: (x: number, y: number, color: number) => {
        // Must notify accumulator before changing
        w.accumulator.storeTileBeforeState(x, y)

        // Simple manual pixel set
        const idx = y * w.config.target.width + x
        w.config.target.data32[idx] = color
      },
      doNothing: () => {
        // Does not touch accumulator or data
      },
    }
  }

  beforeEach(() => {
    const imageData = new ImageData(100, 100)
    pixelData = new PixelData(imageData)
    historyManager = new HistoryManager(50)
    writer = new PixelWriter(pixelData, createMutator, { historyManager })
  })

  it('should be instantiated correctly', () => {
    expect(writer).toBeInstanceOf(PixelWriter)
    expect(writer.config.target).toBe(pixelData)
    expect(writer.historyManager).toBe(historyManager)
    expect(writer.accumulator).toBeInstanceOf(PixelAccumulator)
  })

  describe('withHistory', () => {
    it('should execute the callback with the mutator', () => {
      const callback = vi.fn()
      writer.withHistory(callback)
      expect(callback).toHaveBeenCalledTimes(1)
      // The first argument should be the mutator object
      expect(callback.mock.calls[0][0]).toHaveProperty('setPixel')
    })

    it('should commit a history action when pixels are modified', () => {
      const commitSpy = vi.spyOn(historyManager, 'commit')

      writer.withHistory((mutator) => {
        mutator.setPixel(10, 10, 0xFF0000FF) // Red
      })

      expect(commitSpy).toHaveBeenCalledTimes(1)
      expect(pixelData.data32[10 * 100 + 10]).toBe(0xFF0000FF)
    })

    it('should NOT commit a history action if no pixels are modified', () => {
      const commitSpy = vi.spyOn(historyManager, 'commit')

      writer.withHistory((mutator) => {
        mutator.doNothing()
      })

      expect(commitSpy).not.toHaveBeenCalled()
    })

    it('should correctly undo a modification', () => {
      // Set initial state (transparent/black)
      expect(pixelData.data32[0]).toBe(0)

      writer.withHistory((mutator) => {
        mutator.setPixel(0, 0, 0xFFFFFFFF) // White
      })

      expect(pixelData.data32[0]).toBe(0xFFFFFFFF)
      expect(historyManager.canUndo).toBe(true)

      historyManager.undo()

      expect(pixelData.data32[0]).toBe(0)
    })

    it('should correctly redo a modification', () => {
      writer.withHistory((mutator) => {
        mutator.setPixel(0, 0, 0xFFFFFFFF)
      })

      historyManager.undo()
      expect(pixelData.data32[0]).toBe(0)

      historyManager.redo()
      expect(pixelData.data32[0]).toBe(0xFFFFFFFF)
    })

    it('should handle multiple disjoint modifications in one history step', () => {
      writer.withHistory((mutator) => {
        mutator.setPixel(0, 0, 0xFF0000FF)
        mutator.setPixel(50, 50, 0x00FF00FF)
      })

      expect(pixelData.data32[0]).toBe(0xFF0000FF)
      expect(pixelData.data32[50 * 100 + 50]).toBe(0x00FF00FF)

      historyManager.undo()

      expect(pixelData.data32[0]).toBe(0)
      expect(pixelData.data32[50 * 100 + 50]).toBe(0)

      historyManager.redo()

      expect(pixelData.data32[0]).toBe(0xFF0000FF)
      expect(pixelData.data32[50 * 100 + 50]).toBe(0x00FF00FF)
    })

    it('should recycle patches when history action is disposed due to stack limit', () => {
      // Create a writer with small history limit (1)
      const manager = new HistoryManager(1)
      const localWriter = new PixelWriter(pixelData, createMutator, { historyManager: manager })

      // We spy on the accumulator instance attached to this writer
      const recycleSpy = vi.spyOn(localWriter.accumulator, 'recyclePatch')

      // 1. Commit first action
      localWriter.withHistory(m => m.setPixel(0, 0, 0xFFFFFFFF))
      expect(manager.undoStack.length).toBe(1)
      expect(recycleSpy).not.toHaveBeenCalled()

      // 2. Commit second action. This should push out the first one because maxSteps=1
      localWriter.withHistory(m => m.setPixel(0, 0, 0x00000000))

      // The first action should have been disposed, triggering recyclePatch
      expect(recycleSpy).toHaveBeenCalledTimes(1)
    })

    it('should rollback after exception', () => {
      const manager = new HistoryManager(1)
      const localWriter = new PixelWriter(pixelData, createMutator, { historyManager: manager })

      const rollbackSpy = vi.spyOn(localWriter.accumulator, 'rollback')

      expect(() => {
        localWriter.withHistory(_m => {
          throw new Error('foo')
        })
      }).toThrow(/foo/)

      expect(rollbackSpy).toHaveBeenCalledTimes(1)
    })
  })
})
