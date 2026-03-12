import { describe, expect, it, vi } from 'vitest'
import { applyCircleBrushToPixelData, getCircleBrushBounds, PixelData } from '../../src'

describe('applyCircleBrushToPixelData', () => {
  const createMockPixelData = (width: number, height: number) => {
    const buffer = new Uint8ClampedArray(width * height * 4)

    const imageData = {
      data: buffer,
      width: width,
      height: height,
    } as ImageData

    return new PixelData(imageData)
  }

  it('colors the correct pixels for a solid brush', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xff0000ff as any // Red

    applyCircleBrushToPixelData(target, color, 5, 5, 4, 255)

    const centerIdx = 5 * 10 + 5
    const cornerIdx = 0

    expect(target.data32[centerIdx]).toBe(0xff0000ff)
    expect(target.data32[cornerIdx]).toBe(0)
  })

  it('applies fallOff correctly when provided', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any
    const fallOff = vi.fn(() => 0.5)

    applyCircleBrushToPixelData(target, color, 5, 5, 2, 255, fallOff)

    expect(fallOff).toHaveBeenCalled()
    const centerIdx = 5 * 10 + 5
    // 0.5 * 255 = 127.5 -> 127
    expect(target.data32[centerIdx] >>> 24).toBe(127)
  })

  it('handles even brush sizes with center offset', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any

    // Size 2 brush at 5,5 should color 4 pixels if it hits the corners
    applyCircleBrushToPixelData(target, color, 5, 5, 2, 255)

    const count = target.data32.filter(p => p !== 0).length
    expect(count).toBeGreaterThan(0)
  })

  it('clips correctly when brush is partially off-screen (Top-Left)', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any

    // Center at 0,0 size 10 covers top left quadrant
    applyCircleBrushToPixelData(target, color, 0, 0, 10, 255)

    expect(target.data32[0]).toBe(0xffffffff)
  })

  it('clips correctly when brush is partially off-screen (Bottom-Right)', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any

    applyCircleBrushToPixelData(target, color, 9, 9, 10, 255)

    expect(target.data32[99]).toBe(0xffffffff)
  })

  it('does nothing if the brush is entirely outside the target', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any

    applyCircleBrushToPixelData(target, color, 50, 50, 5, 255)

    const hasData = target.data32.some(p => p !== 0)
    expect(hasData).toBe(false)
  })

  it('applies the alpha parameter to the final color', () => {
    const target = createMockPixelData(10, 10)
    const color = 0x0000ff00 as any // Green base
    const customAlpha = 128

    applyCircleBrushToPixelData(target, color, 5, 5, 2, customAlpha)

    const centerIdx = 5 * 10 + 5
    expect(target.data32[centerIdx] >>> 24).toBe(128)
  })

  describe('getCircleBrushBounds', () => {
    it('calculates bounds for an even-sized circle at an integer center', () => {
      // brushSize 4, r = 2. Center (5, 5)
      // start = ceil(5 - 2) = 3
      // end = floor(5 + 2) + 1 = 8
      const result = getCircleBrushBounds(5, 5, 4)

      expect(result).toEqual({
        x: 3,
        y: 3,
        w: 4,
        h: 4,
      })
    })

    it('calculates bounds for a small circle', () => {
      // brushSize 1, r = 0.5. Center (5, 5)
      // start = ceil(4.5) = 5
      // end = floor(5.5) + 1 = 6
      const result = getCircleBrushBounds(5, 5, 1)

      expect(result).toEqual({
        x: 5,
        y: 5,
        w: 1,
        h: 1,
      })
    })

    it('clamps to target dimensions correctly', () => {
      // 10px diameter at (0, 0)
      // r = 5. start = -5, end = 6
      const result = getCircleBrushBounds(0, 0, 10, 100, 100)

      expect(result).toEqual({
        x: 0,
        y: 0,
        w: 5,
        h: 5,
      })
    })

    it('handles fractional centers', () => {
      // 2px diameter at (5.5, 5.5)
      // r = 1. start = ceil(4.5) = 5. end = floor(6.5) + 1 = 7.
      const result = getCircleBrushBounds(5.5, 5.5, 2)

      expect(result).toEqual({
        x: 4,
        y: 4,
        w: 2,
        h: 2,
      })
    })

    it('returns zero dimensions when entirely off-canvas', () => {
      const result = getCircleBrushBounds(-50, -50, 10, 10, 10)

      expect(result.w).toBe(0)
      expect(result.h).toBe(0)
    })

    it('returns raw bounds when target dimensions are omitted', () => {
      const result = getCircleBrushBounds(-10, -10, 10)

      expect(result.x).toBeLessThan(0)
      expect(result.w).toBe(10)
    })
  })

  describe('applyCircleBrushToPixelData with bounds', () => {
    it('should only paint within the provided bounds, even if the circle is larger', () => {
      const target = createMockPixelData(10, 10)
      const color = 0xFFFFFFFF as any

      // 10px diameter brush at (5, 5).
      // We pass a 2x2 bounds rect specifically at the center (5, 5).
      const restrictiveBounds = {
        x: 5,
        y: 5,
        w: 2,
        h: 2,
      }

      applyCircleBrushToPixelData(
        target,
        color,
        5,
        5,
        10,
        255,
        undefined,
        undefined,
        restrictiveBounds,
      )

      // This pixel is inside both the bounds and the circle radius
      expect(target.data32[5 * 10 + 5]).toBe(0xFFFFFFFF)

      // This pixel is inside the theoretical 10px circle radius,
      // but OUTSIDE the restrictive 2x2 bounds we passed.
      expect(target.data32[4 * 10 + 4]).toBe(0)
    })
  })

  describe('applyCircleBrushToPixelData centerOffset parity', () => {
    it('should center a 1x1 (odd) brush exactly on the integer coordinate', () => {
      const target = createMockPixelData(10, 10)
      const color = 0xFFFFFFFF as any

      // Center at (5, 5), size 1. Offset should be 0.
      // Only pixel (5, 5) should be colored.
      applyCircleBrushToPixelData(target, color, 5, 5, 1)

      expect(target.data32[5 * 10 + 5]).toBe(0xFFFFFFFF)
      expect(target.data32[4 * 10 + 5]).toBe(0)
      expect(target.data32[5 * 10 + 4]).toBe(0)
    })

    it('should center a 2x2 (even) brush equally across 4 pixels', () => {
      const target = createMockPixelData(10, 10)
      const color = 0xFFFFFFFF as any

      // Center at (5, 5), size 2. Offset should be 0.5.
      // Because the center is 5.0 and the offset is 0.5,
      // pixels 4 and 5 are equidistant from the math center.
      applyCircleBrushToPixelData(target, color, 5, 5, 2)

      // A 2x2 brush centered at 5.0 covers (4,4), (4,5), (5,4), (5,5)
      expect(target.data32[4 * 10 + 4]).toBe(0xFFFFFFFF)
      expect(target.data32[4 * 10 + 5]).toBe(0xFFFFFFFF)
      expect(target.data32[5 * 10 + 4]).toBe(0xFFFFFFFF)
      expect(target.data32[5 * 10 + 5]).toBe(0xFFFFFFFF)

      // Boundary check
      expect(target.data32[3 * 10 + 5]).toBe(0)
      expect(target.data32[6 * 10 + 5]).toBe(0)
    })
  })
})
