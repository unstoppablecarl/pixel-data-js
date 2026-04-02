import { makeCirclePaintBinaryMask } from '@/index'
import { describe, expect, it } from 'vitest'
import { CIRCLE_BINARY_MASK_SIZE_EXPECTATIONS } from '../Mask/_mask_helpers'

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
