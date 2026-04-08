import { HistoryManager, makePixelData, PixelAccumulator, type PixelData, PixelWriter } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('PixelWriter', () => {
  let pixelData: PixelData
  let historyManager: HistoryManager
  let writer: PixelWriter<SimpleMutator>

  interface SimpleMutator {
    setPixel: (x: number, y: number, color: number) => void
    doNothing: () => void
  }

  const createMutator = (w: PixelWriter<SimpleMutator>): SimpleMutator => {
    return {
      setPixel: (x: number, y: number, color: number) => {
        w.accumulator.storePixelBeforeState(x, y)
        const target = w.config.target
        const idx = y * target.w + x
        target.data[idx] = color
      },
      doNothing: () => {
        // No-op
      },
    }
  }

  beforeEach(() => {
    const imageData = new ImageData(100, 100)
    pixelData = makePixelData(imageData)
    historyManager = new HistoryManager(50)
    writer = new PixelWriter(pixelData, createMutator, {
      historyManager: historyManager,
    })
  })

  it('should be instantiated correctly', () => {
    const config = writer.config
    expect(writer).toBeInstanceOf(PixelWriter)
    expect(config.target).toBe(pixelData)
    expect(writer.historyManager).toBe(historyManager)
    expect(writer.accumulator).toBeInstanceOf(PixelAccumulator)
  })

  describe('withHistory', () => {
    it('should execute the callback with the mutator', () => {
      const callback = vi.fn()
      writer.withHistory(callback)
      expect(callback).toHaveBeenCalledTimes(1)
      expect(callback.mock.calls[0][0]).toHaveProperty('setPixel')
    })

    it('should throw if called re-entrantly', () => {
      expect(() => {
        writer.withHistory(() => {
          writer.withHistory(() => {
            // Nested call
          })
        })
      }).toThrow(/not re-entrant/)
    })

    it('should commit a history action when pixels are modified', () => {
      const commitSpy = vi.spyOn(historyManager, 'commit')
      writer.withHistory((mutator) => {
        mutator.setPixel(10, 10, 0xFF0000FF)
      })

      expect(commitSpy).toHaveBeenCalledTimes(1)
      expect(pixelData.data[10 * 100 + 10]).toBe(0xFF0000FF)
    })

    it('should NOT commit a history action if no pixels are modified', () => {
      const commitSpy = vi.spyOn(historyManager, 'commit')
      writer.withHistory((mutator) => {
        mutator.doNothing()
      })

      expect(commitSpy).not.toHaveBeenCalled()
    })

    it('should handle multiple disjoint modifications in one history step', () => {
      writer.withHistory((mutator) => {
        mutator.setPixel(0, 0, 0xFF0000FF)
        mutator.setPixel(50, 50, 0x00FF00FF)
      })

      historyManager.undo()
      expect(pixelData.data[0]).toBe(0)
      expect(pixelData.data[50 * 100 + 50]).toBe(0)

      historyManager.redo()
      expect(pixelData.data[0]).toBe(0xFF0000FF)
      expect(pixelData.data[50 * 100 + 50]).toBe(0x00FF00FF)
    })

    it('should rollback after exception', () => {
      const rollbackSpy = vi.spyOn(writer.accumulator, 'rollbackAfterError')

      expect(() => {
        writer.withHistory(() => {
          throw new Error('fail')
        })
      }).toThrow('fail')

      expect(rollbackSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('resize', () => {
    it('should update dimensions and commit to history', () => {
      const commitSpy = vi.spyOn(historyManager, 'commit')
      const mockResize = vi.fn(() => {
        return new ImageData(200, 200)
      })

      writer.resize(200, 200, 0, 0, undefined, undefined, undefined, mockResize)

      expect(pixelData.w).toBe(200)
      expect(pixelData.h).toBe(200)
      expect(commitSpy).toHaveBeenCalledTimes(1)
    })

    it('should correctly undo and redo a resize operation', () => {
      const mockResize = vi.fn(() => {
        return new ImageData(10, 10)
      })

      writer.resize(10, 10, 0, 0, undefined, undefined, undefined, mockResize)
      expect(pixelData.w).toBe(10)

      historyManager.undo()
      expect(pixelData.w).toBe(100)

      historyManager.redo()
      expect(pixelData.w).toBe(10)
    })

    it('should execute callbacks during undo/redo', () => {
      const afterUndo = vi.fn()
      const afterRedo = vi.fn()
      const mockResize = vi.fn(() => {
        return new ImageData(10, 10)
      })

      writer.resize(10, 10, 0, 0, undefined, afterUndo, afterRedo, mockResize)

      historyManager.undo()
      expect(afterUndo).toHaveBeenCalled()

      historyManager.redo()
      expect(afterRedo).toHaveBeenCalled()
    })

    it('should throw if called inside withHistory', () => {
      expect(() => {
        writer.withHistory(() => {
          writer.resize(50, 50)
        })
      }).toThrow(/Cannot resize inside/)
    })

    it('should throw if accumulator has uncommitted tiles', () => {
      // Manually dirty the accumulator
      writer.accumulator.beforeTiles.push({} as any)

      expect(() => {
        writer.resize(50, 50)
      }).toThrow(/open accumulator/)
    })
  })

  describe('PixelWriter after callback', () => {
    it('should trigger the "after" callback for resize on undo and redo', () => {
      const after = vi.fn()
      const afterImageData = new ImageData(10, 10)
      const beforeImageData = pixelData.imageData
      const mockResize = vi.fn(() => {
        return afterImageData
      })

      // resize has 8 arguments (>= 4), so each goes on a new line
      writer.resize(
        10,
        10,
        0,
        0,
        after,
        undefined,
        undefined,
        mockResize,
      )

      // Verify undo trigger
      historyManager.undo()
      expect(after).toHaveBeenCalledTimes(1)
      expect(after).toHaveBeenCalledWith(beforeImageData)

      // Verify redo trigger
      historyManager.redo()
      expect(after).toHaveBeenCalledTimes(2)
      expect(after).toHaveBeenCalledWith(afterImageData)
    })

    it('should pass the "after" callback to the history action factory in withHistory', () => {
      const after = vi.fn()
      const factorySpy = vi.spyOn(writer, 'historyActionFactory')

      writer.withHistory(
        (m) => {
          m.setPixel(0, 0, 1)
        },
        after,
      )

      // The factory is called with (writer, patch, after, afterUndo, afterRedo)
      // 5 arguments means they must be on separate lines
      expect(factorySpy).toHaveBeenCalledWith(
        writer.config,
        writer.accumulator,
        expect.anything(),
        after,
        undefined,
        undefined,
      )
    })

    it('should create History Manager by default', () => {

      const target = {} as any

      const writer = new PixelWriter(target, () => {
        return {}
      }, {
        maxHistorySteps: 99,
      })

      expect(writer.historyManager.maxSteps).toEqual(99)

    })
  })
})
