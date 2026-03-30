import { extractMask, makeAlphaMask, MaskType } from '@/index'
import { describe, expect, it } from 'vitest'

describe('extractMask', () => {
  // 4x4 Mask filled with values 0-15
  const input = new Uint8Array(Array.from({ length: 16 }, (_, i) => i))
  const fullMask = makeAlphaMask(4, 4, input)
  it('extracts a 2x2 center region using coordinates', () => {
    // Extract center 2x2 (starting at 1,1)
    const result = extractMask(fullMask, 1, 1, 2, 2)

    const { data, ...rest } = result

    // Expected values: row 1 (5,6), row 2 (9,10)
    expect(Array.from(data)).toEqual([
      5,
      6,
      9,
      10,
    ])

    expect(rest).toEqual({
      type: MaskType.ALPHA,
      w: 2,
      h: 2,
    })

  })

  it('extracts a region using a Rect object', () => {
    const rect = {
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    }
    const result = extractMask(fullMask, rect)
    const { data, ...rest } = result

    expect(Array.from(data)).toEqual([
      0, 1, 4, 5,
    ])

    expect(rest).toEqual({
      type: MaskType.ALPHA,
      w: 2,
      h: 2,
    })
  })

  it('handles regions partially out of bounds (clipping)', () => {
    // 2x2 region starting at the very bottom right (3,3)
    // Only (3,3) is valid; others should stay 0
    const result = extractMask(fullMask, 3, 3, 2, 2)

    const { data, ...rest } = result

    expect(Array.from(data)).toEqual([
      15,
      0,
      0,
      0,
    ])
  })

  it('returns an empty array if completely out of bounds', () => {
    const result = extractMask(fullMask, 10, 10, 2, 2)

    const isZeroed = result.data.every((v) => v === 0)
    expect(isZeroed).toBe(true)
    expect(result.data.length).toBe(4)
  })
})
