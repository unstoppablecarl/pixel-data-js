import { merge2BinaryMaskRects } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestBinaryMaskRect } from '../_helpers'

describe('merge2BinaryMaskRects', () => {
  it('merges two fully selected rectangles and generates a mask for empty bounding corners', () => {
    const a = {
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    }

    const b = {
      x: 1,
      y: 1,
      w: 2,
      h: 2,
    }

    const result = merge2BinaryMaskRects(a, b)

    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(3)
    expect(result.h).toBe(3)
    expect(result.data).not.toBeNull()

    const expectedData = [
      1,
      1,
      0,
      1,
      1,
      1,
      0,
      1,
      1,
    ]
    const actualData = Array.from(result.data!)

    expect(actualData).toEqual(expectedData)
  })

  it('merges a null mask with a defined binary mask', () => {
    const a = {
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    }
    const maskData = [
      1,
      0,
    ]
    const b = makeTestBinaryMaskRect(
      2,
      0,
      2,
      1,
      maskData,
    )

    const result = merge2BinaryMaskRects(a, b)

    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(4)
    expect(result.h).toBe(2)
    expect(result.data).not.toBeNull()

    const expectedData = [
      1,
      1,
      1,
      0,
      1,
      1,
      0,
      0,
    ]
    const actualData = Array.from(result.data!)

    expect(actualData).toEqual(expectedData)
  })

  it('merges two defined binary masks with an overlap', () => {
    const dataA = [
      1,
      0,
    ]
    const a = makeTestBinaryMaskRect(
      0,
      0,
      2,
      1,
      dataA,
    )
    const dataB = [
      0,
      1,
    ]
    const b = makeTestBinaryMaskRect(
      1,
      0,
      2,
      1,
      dataB,
    )

    const result = merge2BinaryMaskRects(a, b)

    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(3)
    expect(result.h).toBe(1)
    expect(result.data).not.toBeNull()

    const expectedData = [
      1,
      0,
      1,
    ]
    const actualData = Array.from(result.data!)

    expect(actualData).toEqual(expectedData)
  })

  it('handles completely disjoint rectangles with defined masks', () => {
    const dataA = [
      1,
    ]
    const a = makeTestBinaryMaskRect(
      0,
      0,
      1,
      1,
      dataA,
    )
    const dataB = [
      1,
    ]
    const b = makeTestBinaryMaskRect(
      2,
      0,
      1,
      1,
      dataB,
    )

    const result = merge2BinaryMaskRects(a, b)

    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(3)
    expect(result.h).toBe(1)
    expect(result.data).not.toBeNull()

    const expectedData = [
      1,
      0,
      1,
    ]
    const actualData = Array.from(result.data!)

    expect(actualData).toEqual(expectedData)
  })

  it('generates a mask when merging disjoint rectangles with null masks to preserve empty space', () => {
    const a = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }

    const b = {
      x: 2,
      y: 0,
      w: 1,
      h: 1,
    }

    const result = merge2BinaryMaskRects(a, b)

    // The bounding box covers x:0 to x:3
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(3)
    expect(result.h).toBe(1)

    // Because there is a gap at x:1, the mask CANNOT be null.
    // It must explicitly map the gap.
    expect(result.data).not.toBeNull()

    const expectedData = [
      1,
      0,
      1,
    ]
    const actualData = Array.from(result.data!)

    expect(actualData).toEqual(expectedData)
  })

  it('returns a null mask when two adjacent rectangles combine into a gapless bounding box', () => {
    // Two 10x10 squares sitting perfectly side-by-side

    const a = {
      x: 0,
      y: 0,
      w: 10,
      h: 10,
    }
    const b = {
      x: 10,
      y: 0,
      w: 10,
      h: 10,
    }

    const result = merge2BinaryMaskRects(a, b)

    // Bounding Box Area: 200. Area A (100) + Area B (100) - Overlap (0) = 200.
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(20)
    expect(result.h).toBe(10)

    // Because they form a perfect rectangle, it safely skips mask generation
    expect(result.data).toBeNull()
  })

  it('returns a null mask when overlapping rectangles form a gapless bounding box', () => {
    // Two 20x10 rectangles overlapping by 10 pixels in the middle
    const a = {
      x: 0,
      y: 0,
      w: 20,
      h: 10,
    }
    const b = {
      x: 10,
      y: 0,
      w: 20,
      h: 10,
    }

    const result = merge2BinaryMaskRects(a, b)

    // Bounding Box Area: 300. Area A (200) + Area B (200) - Overlap (100) = 300.
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(30)
    expect(result.h).toBe(10)

    // Because the overlap math perfectly accounts for the bounding box, mask is null
    expect(result.data).toBeNull()
  })
})
