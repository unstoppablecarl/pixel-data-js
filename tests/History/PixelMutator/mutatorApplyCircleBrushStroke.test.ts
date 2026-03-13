import { describe, expect, it, vi } from 'vitest'
import { mutatorApplyCircleBrushStroke, PixelData, PixelWriter } from '../../../src'

describe('mutatorApplyCircleBrushStroke', () => {
  const createMockWriter = (w: number, h: number) => {
    const target = new PixelData(new ImageData(w, h))
    const accumulator = {
      storeRegionBeforeState: vi.fn(),
    }
    return {
      target,
      accumulator,
    } as unknown as PixelWriter<any>
  }

  it('should paint a uniform line without overlap darkening (alpha parity)', () => {
    const writer = createMockWriter(20, 20)
    const mutator = mutatorApplyCircleBrushStroke(writer)
    const color = 0xFF0000FF as any // Red
    const alpha = 128 // ~50% opacity

    // Draw a horizontal line.
    // If masking fails, the overlapping circles would double the alpha.
    mutator.applyCircleBrushStroke(color, 5, 5, 10, 5, 5, alpha)

    const pixelValue = writer.target.data32[5 * 20 + 7]
    const pixelAlpha = (pixelValue >>> 24) & 0xFF

    // Should be approximately the global alpha, not a summed value
    expect(pixelAlpha).toBeCloseTo(128, -1)
    expect(writer.accumulator.storeRegionBeforeState).toHaveBeenCalled()
  })

  it('should apply falloff correctly when provided', () => {
    const writer = createMockWriter(20, 20)
    const mutator = mutatorApplyCircleBrushStroke(writer)
    const color = 0xFFFFFFFF as any

    // Linear falloff: center is 1, edge is 0
    const fallOff = (dist: number) => 1 - dist

    mutator.applyCircleBrushStroke(color, 10, 10, 10, 10, 10, 255, fallOff)

    const centerAlpha = (writer.target.data32[10 * 20 + 10] >>> 24) & 0xFF
    const edgeAlpha = (writer.target.data32[10 * 20 + 14] >>> 24) & 0xFF

    expect(centerAlpha).toBeGreaterThan(200)
    expect(edgeAlpha).toBeLessThan(100)
  })

  it('should only snapshot tiles touched by the brush stamps', () => {
    const writer = createMockWriter(100, 100)
    const mutator = mutatorApplyCircleBrushStroke(writer)

    mutator.applyCircleBrushStroke(0xFFFFFFFF as any, 10, 10, 12, 10, 2)

    // forEachLinePoint for (10,10) to (12,10) will hit (10,10), (11,10), (12,10)
    expect(writer.accumulator.storeRegionBeforeState).toHaveBeenCalledTimes(3)
  })

  describe('mutatorApplyCircleBrushStroke early returns', () => {
    it('should return early if brush size is 0', () => {
      const writer = createMockWriter(10, 10)
      const mutator = mutatorApplyCircleBrushStroke(writer)
      const storeSpy = vi.spyOn(writer.accumulator, 'storeRegionBeforeState')

      // Brush size 0 results in bw: 0, bh: 0
      mutator.applyCircleBrushStroke(0xFFFFFFFF as any, 5, 5, 5, 5, 0)

      expect(storeSpy).not.toHaveBeenCalled()
      expect(writer.target.data32[55]).toBe(0)
    })

    it('should return early if coordinates are completely off-canvas', () => {
      const writer = createMockWriter(10, 10)
      const mutator = mutatorApplyCircleBrushStroke(writer)

      // Position far outside 10x10 bounds
      mutator.applyCircleBrushStroke(0xFFFFFFFF as any, 100, 100, 105, 105, 1)

      // The pixel data should remain untouched
      const hasData = writer.target.data32.some(p => p !== 0)
      expect(hasData).toBe(false)
    })
  })
})
