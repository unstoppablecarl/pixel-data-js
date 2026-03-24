import { describe, expect, it } from 'vitest'
import { getRectBrushOrPencilBounds, getRectBrushOrPencilStrokeBounds, type Rect } from '@/index'

describe('getRectBrushOrPencilStrokeBounds', () => {
  const createResult = (): Rect => ({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  })

  it('calculates bounds for a single point (x0=x1, y0=y1) with an odd brush', () => {
    const result = createResult()
    // 3x3 brush at (10, 10)
    // halfW = 1.5. minX = 10 - 1.5 = 8.5. maxX = 10 + 1.5 = 11.5.
    // x = floor(8.5) = 8.
    // w = ceil(11.5 - 8.5) = ceil(3) = 3.
    getRectBrushOrPencilStrokeBounds(10, 10, 10, 10, 3, 3, result)

    expect(result).toEqual({
      x: 8,
      y: 8,
      w: 3,
      h: 3,
    })
  })

  it('calculates bounds for a single point with an even brush', () => {
    const result = createResult()
    // 2x2 brush at (10, 10)
    // halfW = 1. minX = 9. maxX = 11.
    // x = floor(9) = 9.
    // w = ceil(11 - 9) = 2.
    getRectBrushOrPencilStrokeBounds(10, 10, 10, 10, 2, 2, result)

    expect(result).toEqual({
      x: 9,
      y: 9,
      w: 2,
      h: 2,
    })
  })

  it('calculates bounds for a horizontal stroke', () => {
    const result = createResult()
    // 2x2 brush from (10, 10) to (20, 10)
    // minX = 10 - 1 = 9. maxX = 20 + 1 = 21.
    // x = 9. w = ceil(21 - 9) = 12.
    getRectBrushOrPencilStrokeBounds(10, 10, 20, 10, 2, 2, result)

    expect(result).toEqual({
      x: 9,
      y: 9,
      w: 12,
      h: 2,
    })
  })

  it('calculates bounds for a diagonal stroke', () => {
    const result = createResult()
    // 4x4 brush from (0, 0) to (10, 10)
    // minX = 0 - 2 = -2. maxX = 10 + 2 = 12.
    getRectBrushOrPencilStrokeBounds(0, 0, 10, 10, 4, 4, result)

    expect(result).toEqual({
      x: -2,
      y: -2,
      w: 14,
      h: 14,
    })
  })

  it('handles floating point coordinates correctly', () => {
    const result = createResult()
    // 1x1 brush from (0.1, 0.1) to (0.9, 0.9)
    // minX = 0.1 - 0.5 = -0.4. maxX = 0.9 + 0.5 = 1.4.
    // x = floor(-0.4) = -1.
    // w = ceil(1.4 - (-0.4)) = ceil(1.8) = 2.
    getRectBrushOrPencilStrokeBounds(0.1, 0.1, 0.9, 0.9, 1, 1, result)

    expect(result).toEqual({
      x: -1,
      y: -1,
      w: 2,
      h: 2,
    })
  })

  it('is order-independent for start and end points', () => {
    const resA = createResult()
    const resB = createResult()

    getRectBrushOrPencilStrokeBounds(0, 0, 10, 20, 5, 5, resA)
    getRectBrushOrPencilStrokeBounds(10, 20, 0, 0, 5, 5, resB)

    expect(resA).toEqual(resB)
  })

  it('returns the passed result object for chaining', () => {
    const result = createResult()
    const returned = getRectBrushOrPencilStrokeBounds(0, 0, 0, 0, 1, 1, result)

    expect(returned).toBe(result)
  })

  describe('Coordinate Alignment: Bounds vs StrokeBounds', () => {
    const createResult = (): Rect => ({
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    })

    const LARGE_W = 1000
    const LARGE_H = 1000

    it('behaves identically when the brush is fully on-canvas', () => {
      const strokeResult = createResult()
      const cx = 50
      const cy = 50
      const bw = 10
      const bh = 10

      getRectBrushOrPencilStrokeBounds(cx, cy, cx, cy, bw, bh, strokeResult)
      const boundsResult = getRectBrushOrPencilBounds(cx, cy, bw, bh, LARGE_W, LARGE_H)

      // In the middle of the canvas, both return { x: 45, y: 45, w: 10, h: 10 }
      expect(strokeResult).toEqual(boundsResult)
    })

    it('diverges at (0,0) due to intended canvas clamping', () => {
      const strokeResult = createResult()
      const cx = 0
      const cy = 0
      const bw = 10
      const bh = 10

      getRectBrushOrPencilStrokeBounds(cx, cy, cx, cy, bw, bh, strokeResult)
      const boundsResult = getRectBrushOrPencilBounds(cx, cy, bw, bh, LARGE_W, LARGE_H)

      // StrokeResult is the raw math: x = floor(0 - 5) = -5
      expect(strokeResult.x).toBe(-5)
      expect(strokeResult.w).toBe(10)

      // BoundsResult is the canvas-clamped result: x = max(0, -5) = 0
      expect(boundsResult.x).toBe(0)
      expect(boundsResult.w).toBe(5)
    })
  })
})


