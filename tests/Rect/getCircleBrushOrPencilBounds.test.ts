import { describe, expect, it } from 'vitest'
import { getCircleBrushOrPencilBounds } from '@/index'

describe('getCircleBrushOrPencilBounds', () => {
  it('calculates bounds for an even-sized circle at an integer center', () => {
    // brushSize 4, r = 2. Center (5, 5)
    // start = ceil(5 - 2) = 3
    // end = floor(5 + 2) + 1 = 8
    const result = getCircleBrushOrPencilBounds(5, 5, 4, 10, 10)

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
    const result = getCircleBrushOrPencilBounds(5, 5, 1, 10, 10)

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
    const result = getCircleBrushOrPencilBounds(0, 0, 10, 100, 100)

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
    const result = getCircleBrushOrPencilBounds(5.5, 5.5, 2, 10, 10)

    expect(result).toEqual({
      x: 4,
      y: 4,
      w: 2,
      h: 2,
    })
  })

  it('returns zero dimensions when entirely off-canvas', () => {
    const result = getCircleBrushOrPencilBounds(-50, -50, 10, 10, 10)

    expect(result.w).toBe(0)
    expect(result.h).toBe(0)
  })
})
