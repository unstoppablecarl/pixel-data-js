import { trimRectBounds } from '@/index'
import { describe, expect, it } from 'vitest'

describe('trimRectBounds', () => {
  const TARGET_W = 100
  const TARGET_H = 100

  it('should preserve bounds when they are fully within the target area', () => {
    const result = trimRectBounds(10, 10, 20, 20, TARGET_W, TARGET_H)
    expect(result).toEqual({ x: 10, y: 10, w: 20, h: 20 })
  })

  it('should clip negative x and y coordinates to zero', () => {
    const result = trimRectBounds(-10, -10, 20, 20, TARGET_W, TARGET_H)
    // x/y clamped to 0, width/height reduced by the amount clipped
    expect(result).toEqual({ x: 0, y: 0, w: 10, h: 10 })
  })

  it('should clip width and height if they exceed the target boundaries', () => {
    const result = trimRectBounds(90, 90, 50, 50, TARGET_W, TARGET_H)
    // Should stop at 100, so width and height become 10
    expect(result).toEqual({ x: 90, y: 90, w: 10, h: 10 })
  })

  it('should return zero dimensions for a rectangle entirely outside (negative)', () => {
    const result = trimRectBounds(-50, 10, 20, 20, TARGET_W, TARGET_H)
    expect(result.w).toBe(0)
  })

  it('should return zero dimensions for a rectangle entirely outside (beyond target)', () => {
    const result = trimRectBounds(110, 10, 10, 10, TARGET_W, TARGET_H)
    expect(result.w).toBe(0)
  })

  it('should handle zero-sized input rectangles correctly', () => {
    const result = trimRectBounds(50, 50, 0, 0, TARGET_W, TARGET_H)
    expect(result).toEqual({ x: 50, y: 50, w: 0, h: 0 })
  })

  it('should update and return the provided output object instead of creating a new one', () => {
    const out = { x: 0, y: 0, w: 0, h: 0 }
    const result = trimRectBounds(15, 15, 5, 5, TARGET_W, TARGET_H, out)

    expect(result).toBe(out) // Referential equality
    expect(out).toEqual({ x: 15, y: 15, w: 5, h: 5 })
  })
})
