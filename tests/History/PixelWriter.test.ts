import {
  HistoryManager,
  makePixelData,
  PaintBuffer,
  PixelAccumulator,
  type PixelData,
  PixelWriter,
  sourceOverPerfect,
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
        target.data32[idx] = color
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
      expect(pixelData.data32[10 * 100 + 10]).toBe(0xFF0000FF)
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
      expect(pixelData.data32[0]).toBe(0)
      expect(pixelData.data32[50 * 100 + 50]).toBe(0)

      historyManager.redo()
      expect(pixelData.data32[0]).toBe(0xFF0000FF)
      expect(pixelData.data32[50 * 100 + 50]).toBe(0x00FF00FF)
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
  })

  it('getPaintBuffer', () => {
    const imageData = new ImageData(16, 16)
    const target = makePixelData(imageData)
    const writer = new PixelWriter(target, () => ({}))

    const buffer = writer.paintBuffer

    expect(buffer).toBeInstanceOf(PaintBuffer)
    expect(buffer.config).toBe(writer.config)
    expect(buffer.tilePool).toBe(writer.pixelTilePool)
  })

  describe('commitPaintBuffer', () => {
    let imageData: ImageData
    let target: PixelData
    let writer: PixelWriter<any>
    let mockDidChange: any
    let mockBlendPixelData: any
    let customBlendFn: any

    beforeEach(() => {
      imageData = new ImageData(32, 32)
      target = makePixelData(imageData)

      const options = {
        tileSize: 8,
      }

      writer = new PixelWriter(target, () => ({}), options)

      mockDidChange = vi.fn()
      vi.spyOn(writer.accumulator, 'storeTileBeforeState').mockReturnValue(mockDidChange)
      vi.spyOn(writer.paintBuffer, 'clear')

      mockBlendPixelData = vi.fn()
      customBlendFn = vi.fn()
    })

    it('should immediately clear the buffer and do nothing if lookup is empty', () => {
      writer.commitPaintBuffer(255, sourceOverPerfect, mockBlendPixelData)

      expect(writer.accumulator.storeTileBeforeState).not.toHaveBeenCalled()
      expect(mockBlendPixelData).not.toHaveBeenCalled()
      expect(writer.paintBuffer.clear).toHaveBeenCalledTimes(1)
    })

    it('should skip undefined tiles in a sparse lookup array', () => {
      const tile = {
        id: 5,
        tx: 1,
        ty: 1,
        width: 8,
        height: 8,
      }

      writer.paintBuffer.lookup[0] = undefined
      writer.paintBuffer.lookup[1] = tile as any

      writer.commitPaintBuffer(255, sourceOverPerfect, mockBlendPixelData)

      expect(writer.accumulator.storeTileBeforeState).toHaveBeenCalledTimes(1)
      expect(mockBlendPixelData).toHaveBeenCalledTimes(1)
    })

    it('should calculate accurate coordinates using tileShift and propagate the didChange result', () => {
      const tile = {
        id: 10,
        tx: 2,
        ty: 3,
        w: 8,
        h: 8,
      }

      const mockBlendResult = true

      writer.paintBuffer.lookup[10] = tile as any
      mockBlendPixelData.mockReturnValue(mockBlendResult)

      writer.commitPaintBuffer(128, customBlendFn, mockBlendPixelData)

      expect(writer.accumulator.storeTileBeforeState).toHaveBeenCalledWith(10, 2, 3)

      const expectedOpts = {
        alpha: 128,
        blendFn: customBlendFn,
        x: 16,
        y: 24,
        w: 8,
        h: 8,
      }

      expect(mockBlendPixelData).toHaveBeenCalledWith(target, tile, expectedOpts)
      expect(mockDidChange).toHaveBeenCalledWith(mockBlendResult)
      expect(writer.paintBuffer.clear).toHaveBeenCalledTimes(1)
    })

    it('should reuse the exact same shared options object across multiple tiles to avoid GC pressure', () => {
      const tile1 = {
        id: 1,
        tx: 1,
        ty: 0,
        width: 8,
        height: 8,
      }

      const tile2 = {
        id: 2,
        tx: 2,
        ty: 0,
        width: 8,
        height: 8,
      }

      writer.paintBuffer.lookup[1] = tile1 as any
      writer.paintBuffer.lookup[2] = tile2 as any

      writer.commitPaintBuffer(255, sourceOverPerfect, mockBlendPixelData)

      const call1Opts = mockBlendPixelData.mock.calls[0][2]
      const call2Opts = mockBlendPixelData.mock.calls[1][2]

      // Strict referential equality ensures we aren't creating new objects in the loop
      expect(call1Opts).toBe(call2Opts)
    })
  })
})
