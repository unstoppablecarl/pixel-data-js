import {
  type BinaryMask,
  makeBinaryMask,
  mergeBinaryMaskSelectionRects,
  type SelectionRect
} from '@/index'
import { describe, expect, it } from 'vitest'

function createRect(
  x: number,
  y: number,
  w: number,
  h: number,
  maskData?: number[]
): SelectionRect<BinaryMask | null> {
  const rect: SelectionRect<BinaryMask | null> = {
    x,
    y,
    w,
    h,
    mask: null
  }

  if (maskData) {
    const mask = makeBinaryMask(w, h)

    mask.data.set(maskData)
    rect.mask = mask
  }

  return rect
}

describe('mergeBinaryMaskSelectionRects', () => {
  it('merges two fully selected rectangles and generates a mask for empty bounding corners', () => {
    const a = createRect(0, 0, 2, 2)
    const b = createRect(1, 1, 2, 2)

    const result = mergeBinaryMaskSelectionRects(a, b)

    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(3)
    expect(result.h).toBe(3)
    expect(result.mask).not.toBeNull()

    const expectedData = [
      1,
      1,
      0,
      1,
      1,
      1,
      0,
      1,
      1
    ]
    const actualData = Array.from(result.mask!.data)

    expect(actualData).toEqual(expectedData)
  })

  it('merges a null mask with a defined binary mask', () => {
    const a = createRect(
      0,
      0,
      2,
      2
    )
    const maskData = [
      1,
      0
    ]
    const b = createRect(
      2,
      0,
      2,
      1,
      maskData
    )

    const result = mergeBinaryMaskSelectionRects(a, b)

    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(4)
    expect(result.h).toBe(2)
    expect(result.mask).not.toBeNull()

    const expectedData = [
      1,
      1,
      1,
      0,
      1,
      1,
      0,
      0
    ]
    const actualData = Array.from(result.mask!.data)

    expect(actualData).toEqual(expectedData)
  })

  it('merges two defined binary masks with an overlap', () => {
    const dataA = [
      1,
      0
    ]
    const a = createRect(
      0,
      0,
      2,
      1,
      dataA
    )
    const dataB = [
      0,
      1
    ]
    const b = createRect(
      1,
      0,
      2,
      1,
      dataB
    )

    const result = mergeBinaryMaskSelectionRects(a, b)

    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(3)
    expect(result.h).toBe(1)
    expect(result.mask).not.toBeNull()

    const expectedData = [
      1,
      0,
      1
    ]
    const actualData = Array.from(result.mask!.data)

    expect(actualData).toEqual(expectedData)
  })

  it('handles completely disjoint rectangles with defined masks', () => {
    const dataA = [
      1
    ]
    const a = createRect(
      0,
      0,
      1,
      1,
      dataA
    )
    const dataB = [
      1
    ]
    const b = createRect(
      2,
      0,
      1,
      1,
      dataB
    )

    const result = mergeBinaryMaskSelectionRects(a, b)

    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(3)
    expect(result.h).toBe(1)
    expect(result.mask).not.toBeNull()

    const expectedData = [
      1,
      0,
      1
    ]
    const actualData = Array.from(result.mask!.data)

    expect(actualData).toEqual(expectedData)
  })

  it('generates a mask when merging disjoint rectangles with null masks to preserve empty space', () => {
    const a = createRect(
      0,
      0,
      1,
      1
    )
    const b = createRect(
      2,
      0,
      1,
      1
    )

    const result = mergeBinaryMaskSelectionRects(a, b)

    // The bounding box covers x:0 to x:3
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(3)
    expect(result.h).toBe(1)

    // Because there is a gap at x:1, the mask CANNOT be null.
    // It must explicitly map the gap.
    expect(result.mask).not.toBeNull()

    const expectedData = [
      1,
      0,
      1
    ]
    const actualData = Array.from(result.mask!.data)

    expect(actualData).toEqual(expectedData)
  })

  it('returns a null mask when two adjacent rectangles combine into a gapless bounding box', () => {
    // Two 10x10 squares sitting perfectly side-by-side
    const a = createRect(
      0,
      0,
      10,
      10
    )
    const b = createRect(
      10,
      0,
      10,
      10
    )

    const result = mergeBinaryMaskSelectionRects(a, b)

    // Bounding Box Area: 200. Area A (100) + Area B (100) - Overlap (0) = 200.
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(20)
    expect(result.h).toBe(10)

    // Because they form a perfect rectangle, it safely skips mask generation
    expect(result.mask).toBeNull()
  })

  it('returns a null mask when overlapping rectangles form a gapless bounding box', () => {
    // Two 20x10 rectangles overlapping by 10 pixels in the middle
    const a = createRect(
      0,
      0,
      20,
      10
    )
    const b = createRect(
      10,
      0,
      20,
      10
    )

    const result = mergeBinaryMaskSelectionRects(a, b)

    // Bounding Box Area: 300. Area A (200) + Area B (200) - Overlap (100) = 300.
    expect(result.x).toBe(0)
    expect(result.y).toBe(0)
    expect(result.w).toBe(30)
    expect(result.h).toBe(10)

    // Because the overlap math perfectly accounts for the bounding box, mask is null
    expect(result.mask).toBeNull()
  })
})
