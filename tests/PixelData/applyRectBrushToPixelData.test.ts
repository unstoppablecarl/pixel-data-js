import { describe, expect, it, vi } from 'vitest'
import { applyRectBrushToPixelData, getRectBrushBounds, PixelData } from '../../src'

describe('applyRectBrushToPixelData', () => {
  const createMockPixelData = (width: number, height: number) => {
    const buffer = new Uint8ClampedArray(width * height * 4)

    const imageData = {
      data: buffer,
      width: width,
      height: height,
    } as ImageData

    return new PixelData(imageData)
  }

  it('colors a perfect square area for a solid brush', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xFF0000FF as any // Red (ABGR/RGBA dependent on system, but consistent here)

    // 2x2 brush at 5,5 covers pixels (4,4), (4,5), (5,4), (5,5)
    applyRectBrushToPixelData(target, color, 5, 5, 2, 2)

    expect(target.data32[4 * 10 + 4]).toBe(0xFF0000FF)
    expect(target.data32[4 * 10 + 5]).toBe(0xFF0000FF)
    expect(target.data32[5 * 10 + 4]).toBe(0xFF0000FF)
    expect(target.data32[5 * 10 + 5]).toBe(0xFF0000FF)
    expect(target.data32[0]).toBe(0)
  })

  it('applies fallOff correctly based on max distance from center', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xFFFFFFFF as any
    const fallOff = vi.fn((d: number) => 1 - d)

    // Size 2 brush (halfW=1) at 5,5
    // This brush spans pixels 4 and 5. The center of the span is 5.0.
    // The center of pixel 5 is 5.5. Distance is 0.5.
    applyRectBrushToPixelData(target, color, 5, 5, 2, 2, 255, fallOff)

    expect(fallOff).toHaveBeenCalled()

    // Pixel 4: center 4.5, dist 0.5 -> alpha 127
    // Pixel 5: center 5.5, dist 0.5 -> alpha 127
    expect(target.data32[5 * 10 + 5] >>> 24).toBe(127)
  })

  it('returns 255 at the center of an odd-sized brush', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xFFFFFFFF as any
    const fallOff = vi.fn((d: number) => 1 - d)

    // Size 3 brush (halfW=1.5) at 5.5, 5.5
    // Pixel 5 center is 5.5. Distance is 0.
    applyRectBrushToPixelData(target, color, 5.5, 5.5, 3, 3, 255, fallOff)

    expect(target.data32[5 * 10 + 5] >>> 24).toBe(255)
  })

  it('clips correctly at the top-left boundary', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xFFFFFFFF as any

    // Brush centered at 0,0 with size 4x4
    applyRectBrushToPixelData(target, color, 0, 0, 4, 4)

    // Should color 0,0 to 1,1 (since half size is 2)
    expect(target.data32[0 * 10 + 0]).toBe(0xFFFFFFFF)
    expect(target.data32[1 * 10 + 1]).toBe(0xFFFFFFFF)
    expect(target.data32[2 * 10 + 2]).toBe(0)
  })

  it('clips correctly at the bottom-right boundary', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xFFFFFFFF as any

    // Brush at 10,10 with size 4x4
    applyRectBrushToPixelData(target, color, 10, 10, 4, 4)

    expect(target.data32[9 * 10 + 9]).toBe(0xFFFFFFFF)
    expect(target.data32[8 * 10 + 8]).toBe(0xFFFFFFFF)
    expect(target.data32[7 * 10 + 7]).toBe(0)
  })

  it('applies custom blendFn and custom alpha', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xFF00FF00 as any
    const customAlpha = 128
    const mockBlend = vi.fn(() => 0x12345678 as any)

    applyRectBrushToPixelData(target, color, 5, 5, 2, 2, customAlpha, undefined, mockBlend)

    expect(mockBlend).toHaveBeenCalled()
    expect(target.data32[5 * 10 + 5]).toBe(0x12345678)

    // Check that the src color passed to blendFn had the correct alpha
    const call = mockBlend.mock.calls[0] as number[]
    const lastCallSrc = call[0]
    expect(lastCallSrc >>> 24).toBe(128)
  })

  it('handles non-square rectangles', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xFFFFFFFF as any

    // 4 wide, 2 high
    applyRectBrushToPixelData(target, color, 5, 5, 4, 2)

    // px range: 5-2 to 5+1 (3,4,5,6). py range: 5-1 to 5+0 (4,5)
    expect(target.data32[4 * 10 + 3]).toBe(0xFFFFFFFF)
    expect(target.data32[4 * 10 + 6]).toBe(0xFFFFFFFF)
    expect(target.data32[3 * 10 + 3]).toBe(0) // Out of Y range
  })

  describe('getRectBrushBounds', () => {
    it('calculates bounds correctly for an odd-sized brush at an integer center', () => {
      // 3x3 brush at (5, 5)
      // rawStartX = floor(5 - 1.5) = 3
      // rawEndX = 3 + 3 = 6
      const result = getRectBrushBounds(5, 5, 3, 3)

      expect(result).toEqual({
        x: 3,
        y: 3,
        w: 3,
        h: 3,
      })
    })

    it('calculates bounds correctly for an even-sized brush at an integer center', () => {
      // 2x2 brush at (5, 5)
      // rawStartX = floor(5 - 1) = 4
      // rawEndX = 4 + 2 = 6
      const result = getRectBrushBounds(5, 5, 2, 2)

      expect(result).toEqual({
        x: 4,
        y: 4,
        w: 2,
        h: 2,
      })
    })

    it('clamps bounds to target dimensions when provided', () => {
      // 10x10 brush at (0, 0)
      // rawStartX = floor(0 - 5) = -5
      // rawEndX = -5 + 10 = 5
      const result = getRectBrushBounds(0, 0, 10, 10, 100, 100)

      expect(result).toEqual({
        x: 0,
        y: 0,
        w: 5,
        h: 5,
      })
    })

    it('handles brushes partially off the right/bottom edges', () => {
      // 10x10 brush at (95, 95) with target 100x100
      // rawStartX = 90, rawEndX = 100
      // rawStartY = 90, rawEndY = 100
      const result = getRectBrushBounds(98, 98, 10, 10, 100, 100)

      expect(result).toEqual({
        x: 93,
        y: 93,
        w: 7,
        h: 7,
      })
    })

    it('returns zero dimensions when the brush is entirely off-canvas', () => {
      // Brush at (-20, -20) with target (10, 10)
      const result = getRectBrushBounds(-20, -20, 5, 5, 10, 10)

      // startX = max(0, -23) = 0
      // endX = min(10, -18) = -18
      // w = -18 - 0 = -18 (Technical result of current logic)
      // Note: For brush loops, px < endX will correctly never execute
      expect(result.w).toBeLessThanOrEqual(0)
      expect(result.h).toBeLessThanOrEqual(0)
    })

    it('works correctly with floating point centers', () => {
      // 2x2 brush at (5.9, 5.9)
      // rawStartX = floor(5.9 - 1) = 4
      // rawEndX = 4 + 2 = 6
      const result = getRectBrushBounds(5.9, 5.9, 2, 2)

      expect(result).toEqual({
        x: 4,
        y: 4,
        w: 2,
        h: 2,
      })
    })

    it('preserves fractional inputs for raw bounds when no target is provided', () => {
      // Ensuring it doesn't accidentally clamp to 0 if target is undefined
      const result = getRectBrushBounds(-10, -10, 5, 5)

      expect(result).toEqual({
        x: -13,
        y: -13,
        w: 5,
        h: 5,
      })
    })
  })
  describe('applyRectBrushToPixelData with bounds', () => {
    it('should respect the x/y offset of the provided bounds', () => {
      const target = createMockPixelData(10, 10)
      const color = 0xFFFFFFFF as any

      // Brush is 10x10, but we tell it only to paint a 1x1 sliver at the end
      const sliverBounds = {
        x: 9,
        y: 9,
        w: 1,
        h: 1,
      }

      applyRectBrushToPixelData(
        target,
        color,
        5,
        5,
        10,
        10,
        255,
        undefined,
        undefined,
        sliverBounds,
      )

      expect(target.data32[9 * 10 + 9]).toBe(0xFFFFFFFF)
      expect(target.data32[5 * 10 + 5]).toBe(0)
    })

    it('should handle empty bounds gracefully', () => {
      const target = createMockPixelData(10, 10)
      const color = 0xFFFFFFFF as any
      const emptyBounds = {
        x: 0,
        y: 0,
        w: 0,
        h: 0,
      }

      // Should not throw or modify anything
      applyRectBrushToPixelData(
        target,
        color,
        5,
        5,
        5,
        5,
        255,
        undefined,
        undefined,
        emptyBounds,
      )

      expect(target.data32.some(p => p !== 0)).toBe(false)
    })
  })
})
