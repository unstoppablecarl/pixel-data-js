import { describe, expect, it, vi } from 'vitest'
import { mutatorApplyRectBrushStroke, PixelData, PixelWriter } from '../../../src'

describe('mutatorApplyRectBrushStroke', () => {
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

  it('should draw a perfectly rectangular path', () => {
    const writer = createMockWriter(10, 10)
    const mutator = mutatorApplyRectBrushStroke(writer)
    const color = 0xFFFFFFFF as any

    // 2x2 brush at (2,2)
    mutator.applyRectBrushStroke(color, 2, 2, 2, 2, 2, 2)

    // Check 2x2 cluster
    expect(writer.target.data32[1 * 10 + 1]).toBe(color)
    expect(writer.target.data32[1 * 10 + 2]).toBe(color)
    expect(writer.target.data32[2 * 10 + 1]).toBe(color)
    expect(writer.target.data32[2 * 10 + 2]).toBe(color)

    // Check neighbor is empty
    expect(writer.target.data32[0 * 10 + 0]).toBe(0)
  })

  it('should handle asymmetrical brush sizes', () => {
    const writer = createMockWriter(20, 20)
    const mutator = mutatorApplyRectBrushStroke(writer)
    const color = 0xFFFFFFFF as any

    // Width 4, Height 2
    mutator.applyRectBrushStroke(color, 10, 10, 10, 10, 4, 2)

    // Check width (should cover 4 pixels horizontally)
    expect(writer.target.data32[10 * 20 + 8]).toBe(color)
    expect(writer.target.data32[10 * 20 + 11]).toBe(color)
    expect(writer.target.data32[10 * 20 + 12]).toBe(0)
  })

  it('should respect the provided blend function', () => {
    const writer = createMockWriter(10, 10)
    const mutator = mutatorApplyRectBrushStroke(writer)

    // 0xFFFF0000 is Blue in ARGB (Little Endian) or ABGR depending on your system.
    // We use a high-contrast color to be sure.
    const blue = 0xFFFF0000 as any
    const mockBlend = vi.fn(() => blue)

    // Use a 2x2 brush at (5, 5).
    // An even brush size (2) ensures centerOffset (0.5) logic is fully exercised.
    mutator.applyRectBrushStroke(
      0xFFFFFFFF as any,
      5,
      5,
      5,
      5,
      2, // brushWidth
      2, // brushHeight
      255,
      undefined,
      mockBlend,
    )

    // In a 2x2 even brush centered at (5,5), pixel (5,5) is guaranteed to be hit.
    // Center 5.0 + Offset 0.5 = 5.5. Pixel 5 distance is |5 - 5.5| = 0.5.
    // 0.5 <= (2 / 2) is True.
    expect(writer.target.data32[5 * 10 + 5]).toBe(blue)
    expect(mockBlend).toHaveBeenCalled()
  })
  describe('mutatorApplyRectBrushStroke alpha and falloff', () => {
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

    it('should maintain uniform alpha across overlapping rect stamps', () => {
      const writer = createMockWriter(20, 20)
      const mutator = mutatorApplyRectBrushStroke(writer)
      const color = 0xFFFFFFFF as any
      const alpha = 100

      // Draw a short line from (5,5) to (7,5) with a 4x4 brush.
      // The stamps will overlap significantly.
      mutator.applyRectBrushStroke(color, 5, 5, 7, 5, 4, 4, alpha)

      // Check a pixel in the overlap zone
      const overlapPixelAlpha = (writer.target.data32[5 * 20 + 6] >>> 24) & 0xFF

      // If masking works, it should be 100, not darker.
      expect(overlapPixelAlpha).toBe(alpha)
    })
  })
  it('should apply rectangular falloff (Chebyshev distance) safely within bounds', () => {
    const writer = createMockWriter(30, 30)
    const mutator = mutatorApplyRectBrushStroke(writer)
    const color = 0xFFFFFFFF as any

    const fallOff = (dist: number) => 1 - dist

    // 11px size means 5.5px half-extent.
    const brushWidth = 11
    const brushHeight = 11

    mutator.applyRectBrushStroke(
      color,
      15,
      15,
      15,
      15,
      brushWidth,
      brushHeight,
      255,
      fallOff,
    )

    // 1. Center (15, 15) -> dist 0 -> Alpha 255
    const centerAlpha = (writer.target.data32[15 * 30 + 15] >>> 24) & 0xFF
    expect(centerAlpha).toBe(255)

    // 2. Clear Falloff Point (18, 15) -> 3px from center
    // dx = 3. dist = 3 / 5.5 = 0.5454
    // intensity = 1 - 0.5454 = 0.4545
    // alpha = 255 * 0.4545 = 115.9 -> 115
    const midAlpha = (writer.target.data32[15 * 30 + 18] >>> 24) & 0xFF
    expect(midAlpha).toBeCloseTo(115, -1)

    // 3. Near-Edge Point (19, 15) -> 4px from center
    // dx = 4. dist = 4 / 5.5 = 0.727
    // alpha = 255 * (1 - 0.727) = 69.5 -> 69
    const nearEdgeAlpha = (writer.target.data32[15 * 30 + 19] >>> 24) & 0xFF
    expect(nearEdgeAlpha).toBeGreaterThan(0)
    expect(nearEdgeAlpha).toBeCloseTo(69, -1)
  })

  describe('mutatorApplyRectBrushStroke early returns', () => {
    it('should return early if brushWidth or brushHeight is 0', () => {
      const writer = createMockWriter(10, 10)
      const mutator = mutatorApplyRectBrushStroke(writer)
      const storeSpy = vi.spyOn(writer.accumulator, 'storeRegionBeforeState')

      // 0 width brush
      mutator.applyRectBrushStroke(0xFFFFFFFF as any, 5, 5, 5, 5, 0, 5)

      expect(storeSpy).not.toHaveBeenCalled()

      // 0 height brush
      mutator.applyRectBrushStroke(0xFFFFFFFF as any, 5, 5, 5, 5, 5, 0)

      expect(storeSpy).not.toHaveBeenCalled()
    })

    it('should return early if the stroke is clipped entirely', () => {
      const writer = createMockWriter(10, 10)
      const mutator = mutatorApplyRectBrushStroke(writer)

      // Draw at negative coordinates with small brush
      mutator.applyRectBrushStroke(0xFFFFFFFF as any, -20, -20, -15, -15, 2, 2)

      const hasData = writer.target.data32.some(p => p !== 0)
      expect(hasData).toBe(false)
    })
  })
})
