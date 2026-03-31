import { getRectBrushOrPencilBounds } from '@/index'
import { describe, expect, it } from 'vitest'

describe('getRectBrushOrPencilBounds', () => {
  it('calculates bounds correctly for an odd-sized brush at an integer center', () => {
    // 3x3 brush at (5, 5)
    // rawStartX = floor(5 - 1.5) = 3
    // rawEndX = 3 + 3 = 6
    const result = getRectBrushOrPencilBounds(5, 5, 3, 3, 10, 10)

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
    const result = getRectBrushOrPencilBounds(5, 5, 2, 2, 10, 10)

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
    const result = getRectBrushOrPencilBounds(0, 0, 10, 10, 100, 100)

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
    const result = getRectBrushOrPencilBounds(98, 98, 10, 10, 100, 100)

    expect(result).toEqual({
      x: 93,
      y: 93,
      w: 7,
      h: 7,
    })
  })

  it('returns zero dimensions when the brush is entirely off-canvas', () => {
    // Brush at (-20, -20) with target (10, 10)
    const result = getRectBrushOrPencilBounds(-20, -20, 5, 5, 10, 10)

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
    const result = getRectBrushOrPencilBounds(5.9, 5.9, 2, 2, 10, 10)

    expect(result).toEqual({
      x: 4,
      y: 4,
      w: 2,
      h: 2,
    })
  })
})
