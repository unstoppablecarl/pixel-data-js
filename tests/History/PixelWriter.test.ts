import {
  HistoryManager,
  makePixelData,
  PixelAccumulator,
  type PixelData,
  type PixelPatchTiles,
  PixelWriter,
} from '@/index'
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

      writer.resize(200, 200, 0, 0, undefined, undefined, mockResize)

      expect(pixelData.w).toBe(200)
      expect(pixelData.h).toBe(200)
      expect(commitSpy).toHaveBeenCalledTimes(1)
    })

    it('should correctly undo and redo a resize operation', () => {
      const mockResize = vi.fn(() => {
        return new ImageData(10, 10)
      })

      writer.resize(10, 10, 0, 0, undefined, undefined, mockResize)
      expect(pixelData.w).toBe(10)

      historyManager.undo()
      expect(pixelData.w).toBe(100)

      historyManager.redo()
      expect(pixelData.w).toBe(10)
    })

    it('should execute callbacks during undo/redo', () => {
      const afterUndo = vi.fn()
      const afterRedo = vi.fn()
      const resized = new ImageData(10, 10)
      const mockResize = vi.fn(() => {
        return resized
      })

      writer.resize(10, 10, 0, 0, afterUndo, afterRedo, mockResize)

      historyManager.undo()
      expect(afterUndo).toHaveBeenCalledExactlyOnceWith(writer.config.target.imageData)

      historyManager.redo()
      expect(afterRedo).toHaveBeenCalledExactlyOnceWith(resized)
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

  it('should call the historyActionFactory correctly', () => {
    const afterUndo = vi.fn()
    const afterRedo = vi.fn()
    const patch = {
      test: 'patch',
    }
    writer.accumulator.extractPatch = vi.fn().mockReturnValue(patch)

    const factorySpy = vi.spyOn(writer, 'historyActionFactory')

    writer.withHistory(
      (m) => {
        m.setPixel(0, 0, 1)
      },
      afterUndo,
      afterRedo,
    )

    expect(factorySpy).toHaveBeenCalledWith(
      writer.config,
      writer.accumulator,
      patch,
      afterUndo,
      afterRedo,
    )
  })

  it('should use the "after" callbacks', () => {
    const afterUndo = vi.fn()
    const afterRedo = vi.fn()
    const patch: PixelPatchTiles = {
      beforeTiles: [],
      afterTiles: [],
    }

    writer.accumulator.extractPatch = vi.fn().mockReturnValue(patch)

    writer.withHistory(
      (m) => {
        m.setPixel(0, 0, 1)
      },
      afterUndo,
      afterRedo,
    )

    expect(afterUndo).not.toHaveBeenCalled()
    expect(afterRedo).not.toHaveBeenCalled()

    historyManager.undo()
    expect(afterUndo).toHaveBeenCalledExactlyOnceWith(patch)
    expect(afterRedo).not.toHaveBeenCalled()

    historyManager.redo()
    expect(afterRedo).toHaveBeenCalledExactlyOnceWith(patch)
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
