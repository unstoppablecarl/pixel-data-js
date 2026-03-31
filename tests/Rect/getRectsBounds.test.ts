import { getRectsBounds } from '@/index'
import { describe, expect, it } from 'vitest'

describe('getRectsBounds', () => {
  it('returns a shallow copy of the rectangle if only one is provided', () => {
    const rect = {
      x: 10,
      y: 10,
      w: 50,
      h: 50,
    }

    const result = getRectsBounds([rect])

    expect(result).toEqual(rect)
    expect(result).not.toBe(rect)
  })

  it('calculates the bounding box for two disjoint rectangles', () => {
    const r1 = {
      x: 0,
      y: 0,
      w: 10,
      h: 10,
    }
    const r2 = {
      x: 20,
      y: 20,
      w: 10,
      h: 10,
    }

    const result = getRectsBounds([r1, r2])

    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(30)
    expect(result.h).toBe(30)
  })

  it('calculates the bounding box for overlapping rectangles', () => {
    const r1 = {
      x: -10,
      y: -10,
      w: 20,
      h: 20,
    }
    const r2 = {
      x: 0,
      y: 0,
      w: 20,
      h: 20,
    }

    const result = getRectsBounds([r1, r2])

    expect(result.x).toBe(-10)
    expect(result.y).toBe(-10)
    expect(result.w).toBe(30)
    expect(result.h).toBe(30)
  })

  it('handles completely negative coordinate spaces', () => {
    const r1 = {
      x: -50,
      y: -50,
      w: 10,
      h: 10,
    }
    const r2 = {
      x: -20,
      y: -20,
      w: 5,
      h: 5,
    }

    const result = getRectsBounds([r1, r2])

    expect(result.x).toBe(-50)
    expect(result.y).toBe(-50)
    expect(result.w).toBe(35)
    expect(result.h).toBe(35)
  })

  it('calculates bounds correctly when a rectangle is fully contained within another', () => {
    const r1 = {
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    }
    const r2 = {
      x: 25,
      y: 25,
      w: 50,
      h: 50,
    }

    const result = getRectsBounds([r1, r2])

    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(100)
    expect(result.h).toBe(100)
  })
})
