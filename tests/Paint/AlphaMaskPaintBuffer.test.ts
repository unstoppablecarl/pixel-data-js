import {
  AlphaMaskPaintBuffer,
  type AlphaMaskTile,
  PaintMaskOutline,
  type PixelAccumulator,
  type PixelEngineConfig,
  TilePool,
} from '@/index'
import type { PaintAlphaMask, PaintBinaryMask } from '@/Paint/_paint-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestAlphaMask, makeTestBinaryMask, makeTestPaintRect, makeTestPixelData } from '../_helpers'

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

      const brush = makeTestPaintRect(16, 16)

      const changed = buffer.paintRect(255, brush, -100, -100)

      expect(changed).toBe(false)
      // Verify it bailed out before ever reaching the tile loop
      expect((buffer as any).eachTileInBoundsFn).not.toHaveBeenCalled()
    })

    it('should correctly assign alpha values using injected loops', () => {
      const brush = makeTestPaintRect(16, 16)

      const changed = buffer.paintRect(200, brush, 0, 0)
      const tile = buffer.lookup[0]

      expect((buffer as any).forEachLinePointFn).toHaveBeenCalled()
      expect((buffer as any).eachTileInBoundsFn).toHaveBeenCalled()
      expect(changed).toBe(true)
      expect(tile?.data[0]).toBe(200)
    })

    it('should overwrite existing data ONLY if new alpha is greater', () => {
      const brush = makeTestPaintRect(16, 16)

      // Setup: Pre-fill with 100
      buffer.paintRect(100, brush, 0, 0)
      const tile = buffer.lookup[0]!

      // Act: Try to write weaker alpha
      const changedWeak = buffer.paintRect(50, brush, 0, 0)

      // Assert: Should remain 100
      expect(changedWeak).toBe(false)
      expect(tile.data[0]).toBe(100)

      // Act: Try to write stronger alpha
      const changedStrong = buffer.paintRect(255, brush, 0, 0)

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
        outlineType: PaintMaskOutline.MASKED,
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
        outlineType: PaintMaskOutline.MASKED,
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
      const brush = makeTestPaintRect(16, 16)

      buffer.paintRect(100, brush, 0, 0)

      const mockBrush: PaintAlphaMask = {
        ...makeTestAlphaMask(16, 16, [0, 200]),
        outlineType: PaintMaskOutline.MASKED,
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
        outlineType: PaintMaskOutline.MASKED,
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
        outlineType: PaintMaskOutline.MASKED,
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
        outlineType: PaintMaskOutline.MASKED,
        centerOffsetX: 0,
        centerOffsetY: 0,
      }

      const changed = buffer.paintBinaryMask(mockBrush, 0, 0, 0)

      expect(changed).toBe(false)
      // verify the injected loop was never reached due to early exit
      expect((buffer as any).forEachLinePointFn).not.toHaveBeenCalled()
    })
  })

  describe('clear', () => {
    it('should release all active tiles to the pool', () => {
      const brush = makeTestPaintRect(16, 16)

      buffer.paintRect(255, brush, 0, 0)
      expect(buffer.lookup.length).toBeGreaterThan(0)

      buffer.clear()

      expect(mockPool.releaseTiles).toHaveBeenCalledWith(buffer.lookup)
    })
  })
})
