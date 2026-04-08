import { makePaintAlphaMask, makePaintBinaryMask, MaskType, PaintMaskOutline } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestAlphaMask, makeTestBinaryMask } from '../_helpers'

describe('paintMask factories', () => {
  it('should wrap a BinaryMask and calculate offsets for odd dimensions', () => {
    const mask = makeTestBinaryMask(3, 3)

    const result = makePaintBinaryMask(mask)

    expect(result).toEqual({
      type: MaskType.BINARY,
      outlineType: PaintMaskOutline.MASKED,
      data: mask.data,
      w: 3,
      h: 3,
      centerOffsetX: -1,
      centerOffsetY: -1,
    })
  })

  it('should wrap an AlphaMask and calculate offsets for even dimensions', () => {
    const data = new Uint8Array(16)
    const mask = makeTestAlphaMask(4, 4)

    const result = makePaintAlphaMask(mask)

    expect(result).toEqual({
      type: MaskType.ALPHA,
      outlineType: PaintMaskOutline.MASKED,
      data: data,
      w: 4,
      h: 4,
      centerOffsetX: -2,
      centerOffsetY: -2,
    })
  })

  it('should maintain referential integrity of the underlying data array', () => {

    const mask = makeTestBinaryMask(1, 1)

    const result = makePaintBinaryMask(mask)

    // Ensure we aren't accidentally cloning the data
    expect(result.data).toBe(mask.data)
  })
})
