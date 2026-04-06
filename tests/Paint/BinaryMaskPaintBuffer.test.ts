import type { Color32, PaintBinaryMask } from '@/_types'
import type { BinaryMaskTile, PixelAccumulator, PixelEngineConfig } from '@/index'
import { BinaryMaskPaintBuffer, TilePool } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestBinaryMask, makeTestPixelData } from '../_helpers'

describe('BinaryMaskPaintBuffer', () => {
  let mockConfig: PixelEngineConfig
  let mockPool: TilePool<BinaryMaskTile>
  let mockAccumulator: PixelAccumulator
  let buffer: BinaryMaskPaintBuffer

  beforeEach(() => {
    mockConfig = {
      target: makeTestPixelData(100, 100),
      tileShift: 4,
      tileMask: 15,
      tileSize: 16,
      tileArea: 256,
    } as unknown as PixelEngineConfig

    mockPool = {
      releaseTiles: vi.fn(),
    } as unknown as TilePool<BinaryMaskTile>

    mockAccumulator = {
      storeTileBeforeState: vi.fn(() => vi.fn()),
    } as unknown as PixelAccumulator

    buffer = new BinaryMaskPaintBuffer(mockConfig, mockPool)

    // --- Dependency Injection for Testing ---
    ;(buffer as any).forEachLinePointFn = vi.fn((x0, y0, x1, y1, cb) => {
      // Simulate a single stamp at the origin
      cb(x0, y0)
    })

    ;(buffer as any).trimRectBoundsFn = vi.fn((x, y, w, h, tW, tH, scratch) => {
      scratch.w = w
      scratch.h = h
    })

    ;(buffer as any).eachTileInBoundsFn = vi.fn((config, lookup, pool, scratch, cb) => {
      // Inject a fake 16x16 tile into the lookup if empty
      let tile = lookup[0]
      if (!tile) {
        tile = {
          data: new Uint8Array(256),
          id: 1,
          tx: 0,
          ty: 0,
          w: 16,
          h: 16,
        }
        lookup[0] = tile
      }
      // Execute the buffer's inner loops over the fake tile
      cb(tile, 0, 0, 16, 16)
    })

    ;(buffer as any).blendColorPixelDataBinaryMaskFn = vi.fn(() => true)
  })

  describe('paintRect', () => {
    it('should return false instantly if trimmed bounds are out of canvas area (w/h <= 0)', () => {
      ;(buffer as any).trimRectBoundsFn = vi.fn((x, y, w, h, tW, tH, scratch) => {
        scratch.w = 0
        scratch.h = 10
      })

      // Note: No alpha arg for Binary buffer's paintRect
      const changed = buffer.paintRect(16, 16, -100, -100)

      expect(changed).toBe(false)
      expect((buffer as any).eachTileInBoundsFn).not.toHaveBeenCalled()
    })

    it('should correctly assign binary 1 values using injected loops', () => {
      const changed = buffer.paintRect(16, 16, 0, 0)
      const tile = buffer.lookup[0]

      expect((buffer as any).forEachLinePointFn).toHaveBeenCalled()
      expect((buffer as any).eachTileInBoundsFn).toHaveBeenCalled()
      expect(changed).toBe(true)
      expect(tile?.data[0]).toBe(1)
    })

    it('should not mutate tile or return true if the pixel is already on', () => {
      // Setup: Pre-fill with 1
      buffer.paintRect(16, 16, 0, 0)
      const tile = buffer.lookup[0]!

      expect(tile.data[0]).toBe(1)

      // Act: Try to paint the exact same area again
      const changedAgain = buffer.paintRect(16, 16, 0, 0)

      // Assert: Should recognize no pixels were flipped
      expect(changedAgain).toBe(false)
      expect(tile.data[0]).toBe(1)
    })
  })

  describe('paintBinaryMask', () => {
    it('should return false instantly if trimmed bounds are out of canvas area (w/h <= 0)', () => {
      ;(buffer as any).trimRectBoundsFn = vi.fn((x, y, w, h, tW, tH, scratch) => {
        scratch.w = 10
        scratch.h = 0
      })

      const mockBrush: PaintBinaryMask = {
        ...makeTestBinaryMask(16, 16),
        centerOffsetX: 0,
        centerOffsetY: 0,
      }

      const changed = buffer.paintBinaryMask(mockBrush, -100, -100)

      expect(changed).toBe(false)
      expect((buffer as any).eachTileInBoundsFn).not.toHaveBeenCalled()
    })

    it('should map binary 1s from the brush to the tile data', () => {
      const mockBrush: PaintBinaryMask = {
        ...makeTestBinaryMask(16, 16, [1, 0]), // 'On' then 'Off'
        centerOffsetX: 0,
        centerOffsetY: 0,
      }

      const changed = buffer.paintBinaryMask(mockBrush, 0, 0)
      const tile = buffer.lookup[0]!

      expect(changed).toBe(true)
      expect(tile.data[0]).toBe(1) // Brush was 1, turned tile on
      expect(tile.data[1]).toBe(0) // Brush was 0, left tile off
    })

    it('should return false if brush only overlaps already-on pixels', () => {
      // Pre-fill tile area
      buffer.paintRect(16, 16, 0, 0)

      const mockBrush: PaintBinaryMask = {
        ...makeTestBinaryMask(16, 16, [1, 1]),
        centerOffsetX: 0,
        centerOffsetY: 0,
      }

      const changed = buffer.paintBinaryMask(mockBrush, 0, 0)
      const tile = buffer.lookup[0]!

      // Assert it didn't change anything because the tile was already filled with 1s
      expect(changed).toBe(false)
      expect(tile.data[0]).toBe(1)
    })
  })

  describe('commit', () => {
    it('should push history, blend to target, and clear lookup', () => {
      buffer.paintRect(16, 16, 0, 0) // Dirty the buffer

      const color = 0xff0000ff as Color32
      const alpha = 128
      const mockBlendFn = vi.fn()

      buffer.commit(mockAccumulator, color, alpha, mockBlendFn)

      // 1. History tracking fired
      expect(mockAccumulator.storeTileBeforeState).toHaveBeenCalledWith(1, 0, 0)

      // 2. The injected blend function was called with correct opts
      const injectedBlendSpy = (buffer as any).blendColorPixelDataBinaryMaskFn
      expect(injectedBlendSpy).toHaveBeenCalledTimes(1)

      const passedOpts = injectedBlendSpy.mock.calls[0][3]
      expect(passedOpts.alpha).toBe(alpha)
      expect(passedOpts.w).toBe(16)
      expect(passedOpts.h).toBe(16)
      expect(passedOpts.blendFn).toBe(mockBlendFn)

      // 3. Buffer cleared
      expect(mockPool.releaseTiles).toHaveBeenCalledWith(buffer.lookup)
    })
  })

  describe('clear', () => {
    it('should release all active tiles to the pool', () => {
      buffer.paintRect(16, 16, 0, 0)
      expect(buffer.lookup.length).toBeGreaterThan(0)

      buffer.clear()

      expect(mockPool.releaseTiles).toHaveBeenCalledWith(buffer.lookup)
    })
  })
})
