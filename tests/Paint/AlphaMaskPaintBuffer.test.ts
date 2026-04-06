import type { Color32 } from '@/_types'
import type { AlphaMaskTile, PixelAccumulator, PixelEngineConfig } from '@/index'
import { AlphaMaskPaintBuffer, TilePool } from '@/index'
import type { PaintAlphaMask, PaintBinaryMask } from '@/Paint/_paint-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestAlphaMask, makeTestBinaryMask, makeTestPixelData } from '../_helpers'

describe('AlphaMaskPaintBuffer', () => {
  let mockConfig: PixelEngineConfig
  let mockPool: TilePool<AlphaMaskTile>
  let mockAccumulator: PixelAccumulator
  let buffer: AlphaMaskPaintBuffer

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
    } as unknown as TilePool<AlphaMaskTile>

    mockAccumulator = {
      storeTileBeforeState: vi.fn(() => vi.fn()),
    } as unknown as PixelAccumulator

    buffer = new AlphaMaskPaintBuffer(mockConfig, mockPool)

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

    ;(buffer as any).blendColorPixelDataAlphaMaskFn = vi.fn(() => true)
  })

  describe('paintRect', () => {
    it('should return false instantly if trimmed bounds are out of canvas area (w/h <= 0)', () => {
      // Override the mock to simulate an off-canvas trim
      ;(buffer as any).trimRectBoundsFn = vi.fn((x, y, w, h, tW, tH, scratch) => {
        scratch.w = 0
        scratch.h = 10
      })

      const changed = buffer.paintRect(255, 16, 16, -100, -100)

      expect(changed).toBe(false)
      // Verify it bailed out before ever reaching the tile loop
      expect((buffer as any).eachTileInBoundsFn).not.toHaveBeenCalled()
    })

    it('should correctly assign alpha values using injected loops', () => {
      const changed = buffer.paintRect(200, 16, 16, 0, 0)
      const tile = buffer.lookup[0]

      expect((buffer as any).forEachLinePointFn).toHaveBeenCalled()
      expect((buffer as any).eachTileInBoundsFn).toHaveBeenCalled()
      expect(changed).toBe(true)
      expect(tile?.data[0]).toBe(200)
    })

    it('should overwrite existing data ONLY if new alpha is greater', () => {
      // Setup: Pre-fill with 100
      buffer.paintRect(100, 16, 16, 0, 0)
      const tile = buffer.lookup[0]!

      // Act: Try to write weaker alpha
      const changedWeak = buffer.paintRect(50, 16, 16, 0, 0)

      // Assert: Should remain 100
      expect(changedWeak).toBe(false)
      expect(tile.data[0]).toBe(100)

      // Act: Try to write stronger alpha
      const changedStrong = buffer.paintRect(255, 16, 16, 0, 0)

      // Assert: Should overwrite
      expect(changedStrong).toBe(true)
      expect(tile.data[0]).toBe(255)
    })
  })

  describe('paintAlphaMask', () => {
    it('should return false instantly if trimmed bounds are out of canvas area (w/h <= 0)', () => {
      // Override the mock to simulate an off-canvas trim
      ;(buffer as any).trimRectBoundsFn = vi.fn((x, y, w, h, tW, tH, scratch) => {
        scratch.w = 10
        scratch.h = -5
      })

      const mockBrush: PaintAlphaMask = {
        ...makeTestAlphaMask(16, 16),
        centerOffsetX: 0,
        centerOffsetY: 0,
      }

      const changed = buffer.paintAlphaMask(mockBrush, -100, -100)

      expect(changed).toBe(false)
      expect((buffer as any).eachTileInBoundsFn).not.toHaveBeenCalled()
    })

    it('should correctly map brush alpha to the tile data', () => {
      const mockBrush: PaintAlphaMask = {
        ...makeTestAlphaMask(16, 16, [128, 255]),
        centerOffsetX: 0,
        centerOffsetY: 0,
      }

      const changed = buffer.paintAlphaMask(mockBrush, 0, 0)
      const tile = buffer.lookup[0]!

      expect(changed).toBe(true)
      expect(tile.data[0]).toBe(128)
      expect(tile.data[1]).toBe(255)
      expect(tile.data[2]).toBe(0) // Mask was 0, untouched
    })

    it('should ignore brush pixels with 0 alpha', () => {
      buffer.paintRect(100, 16, 16, 0, 0)

      const mockBrush: PaintAlphaMask = {
        ...makeTestAlphaMask(16, 16, [0, 200]),
        centerOffsetX: 0,
        centerOffsetY: 0,
      }

      buffer.paintAlphaMask(mockBrush, 0, 0)
      const tile = buffer.lookup[0]!

      expect(tile.data[0]).toBe(100) // Ignored
      expect(tile.data[1]).toBe(200) // Overwritten
    })
  })

  describe('paintBinaryMask', () => {
    it('should return false instantly if trimmed bounds are out of canvas area (w/h <= 0)', () => {
      ;(buffer as any).trimRectBoundsFn = vi.fn((x, y, w, h, tW, tH, scratch) => {
        scratch.w = 0
        scratch.h = 0
      })

      const mockBrush: PaintBinaryMask = {
        ...makeTestBinaryMask(16, 16),
        centerOffsetX: 0,
        centerOffsetY: 0,
      }

      const changed = buffer.paintBinaryMask(mockBrush, 255, -100, -100)

      expect(changed).toBe(false)
      expect((buffer as any).eachTileInBoundsFn).not.toHaveBeenCalled()
    })

    it('should map binary 1s to the provided alpha value', () => {
      const mockBrush: PaintBinaryMask = {
        ...makeTestBinaryMask(16, 16, [1, 0]),
        centerOffsetX: 0,
        centerOffsetY: 0,
      }

      const changed = buffer.paintBinaryMask(mockBrush, 150, 0, 0)
      const tile = buffer.lookup[0]!

      expect(changed).toBe(true)
      expect(tile.data[0]).toBe(150)
      expect(tile.data[1]).toBe(0)
    })

    it('should return false instantly if provided alpha is 0', () => {
      const mockBrush: PaintBinaryMask = {
        ...makeTestBinaryMask(16, 16),
        centerOffsetX: 0,
        centerOffsetY: 0,
      }

      const changed = buffer.paintBinaryMask(mockBrush, 0, 0, 0)

      expect(changed).toBe(false)
      // verify the injected loop was never reached due to early exit
      expect((buffer as any).forEachLinePointFn).not.toHaveBeenCalled()
    })
  })

  describe('commit', () => {
    it('should push history, blend to target, and clear lookup', () => {
      buffer.paintRect(255, 16, 16, 0, 0) // Dirty the buffer

      const color = 0xff0000ff as Color32
      const alpha = 128
      const mockBlendFn = vi.fn()

      buffer.commit(mockAccumulator, color, alpha, mockBlendFn)

      // 1. History tracking fired
      expect(mockAccumulator.storeTileBeforeState).toHaveBeenCalledWith(1, 0, 0)

      // 2. The injected blend function was called with correct opts
      const injectedBlendSpy = (buffer as any).blendColorPixelDataAlphaMaskFn
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
      buffer.paintRect(255, 16, 16, 0, 0)
      expect(buffer.lookup.length).toBeGreaterThan(0)

      buffer.clear()

      expect(mockPool.releaseTiles).toHaveBeenCalledWith(buffer.lookup)
    })
  })
})
