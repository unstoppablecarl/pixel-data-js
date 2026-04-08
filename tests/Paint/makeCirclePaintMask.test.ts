import { makeCirclePaintAlphaMask, makeCirclePaintBinaryMask } from '@/index'
import { describe, expect, it } from 'vitest'
import { CIRCLE_BINARY_MASK_SIZE_EXPECTATIONS } from '../Mask/_mask_helpers'

describe('makeCirclePaintAlphaMask', () => {
  const cases = CIRCLE_BINARY_MASK_SIZE_EXPECTATIONS.map(({ size, data }) => {
    return {
      size,
      data: data.map((v) => v * 255),
    }
  })
  it.each(cases)('makeCirclePaintAlphaMask: defaults should match binary mask size ($size)', (v) => {
    const mask = makeCirclePaintAlphaMask(v.size, () => 1)
    expect(Array.from(mask.data)).toEqual(v.data)
  })

  it('should handle falloff', () => {
    const size = 10
    const mask = makeCirclePaintAlphaMask(size, (d) => d)

    expect(Array.from(mask.data)).toEqual([
      0, 0, 0, 13, 24, 24, 13, 0, 0, 0,
      0, 2, 35, 60, 74, 74, 60, 35, 2, 0,
      0, 35, 74, 106, 124, 124, 106, 74, 35, 0,
      13, 60, 106, 146, 174, 174, 146, 106, 60, 13,
      24, 74, 124, 174, 218, 218, 174, 124, 74, 24,
      24, 74, 124, 174, 218, 218, 174, 124, 74, 24,
      13, 60, 106, 146, 174, 174, 146, 106, 60, 13,
      0, 35, 74, 106, 124, 124, 106, 74, 35, 0,
      0, 2, 35, 60, 74, 74, 60, 35, 2, 0,
      0, 0, 0, 13, 24, 24, 13, 0, 0, 0,
    ])
  })

  it('should maintain correct metadata properties', () => {
    const size = 10
    const mask = makeCirclePaintAlphaMask(size, () => 1)

    // Using separate assertions to ensure metadata logic remains consistent
    expect(mask.w).toBe(size)
    expect(mask.h).toBe(size)
    expect(mask.centerOffsetX).toBe(-5)
    expect(mask.centerOffsetY).toBe(-5)
  })

  it('should handle odd and even center offset', () => {
    const mask1 = makeCirclePaintBinaryMask(1)
    expect(mask1.centerOffsetX).toBe(-0)
    expect(mask1.centerOffsetY).toBe(-0)
    const mask2 = makeCirclePaintBinaryMask(2)
    expect(mask2.centerOffsetX).toBe(-1)
    expect(mask2.centerOffsetY).toBe(-1)
    const mask3 = makeCirclePaintBinaryMask(3)
    expect(mask3.centerOffsetX).toBe(-1)
    expect(mask3.centerOffsetY).toBe(-1)
  })
})

describe('makeCirclePaintBinaryMask', () => {

  it.each(CIRCLE_BINARY_MASK_SIZE_EXPECTATIONS)('makeCirclePaintBinaryMask: size ($size)', ({ size, data }) => {
    const mask = makeCirclePaintBinaryMask(size)
    expect(Array.from(mask.data)).toEqual(data)
  })

  it('should maintain correct metadata properties', () => {
    const size = 10
    const mask = makeCirclePaintBinaryMask(size)

    // Using separate assertions to ensure metadata logic remains consistent
    expect(mask.w).toBe(size)
    expect(mask.h).toBe(size)

    expect(mask.centerOffsetX).toBe(-5)
    expect(mask.centerOffsetY).toBe(-5)

  })

  it('should handle odd and even center offset', () => {
    const mask1 = makeCirclePaintBinaryMask(1)
    expect(mask1.centerOffsetX).toBe(-0)
    expect(mask1.centerOffsetY).toBe(-0)
    const mask2 = makeCirclePaintBinaryMask(2)
    expect(mask2.centerOffsetX).toBe(-1)
    expect(mask2.centerOffsetY).toBe(-1)
    const mask3 = makeCirclePaintBinaryMask(3)
    expect(mask3.centerOffsetX).toBe(-1)
    expect(mask3.centerOffsetY).toBe(-1)
  })

})

