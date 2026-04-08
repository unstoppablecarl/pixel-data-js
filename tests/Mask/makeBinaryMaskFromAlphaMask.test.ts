import { type AlphaMask, makeBinaryMaskFromAlphaMask, MaskType } from '@/index'
import { describe, expect, it } from 'vitest'

describe('makeBinaryMaskFromAlphaMask', () => {
  it('converts pixels above or equal to the threshold to 1', () => {
    const w = 2
    const h = 2

    const alphaData = new Uint8Array([0, 100, 128, 255])

    const mask: AlphaMask = {
      type: MaskType.ALPHA,
      w,
      h,
      data: alphaData,
    }

    const threshold = 128

    const result = makeBinaryMaskFromAlphaMask(mask, threshold)

    expect(result.type).toBe(MaskType.BINARY)
    expect(result.w).toBe(w)
    expect(result.h).toBe(h)

    // 0 < 128
    expect(result.data[0]).toBe(0)
    // 100 < 128
    expect(result.data[1]).toBe(0)
    // 128 == 128
    expect(result.data[2]).toBe(1)
    // 255 > 128
    expect(result.data[3]).toBe(1)
  })

  it('handles a threshold of 0 by converting everything to 1', () => {
    const w = 2

    const h = 1

    const alphaData = new Uint8Array([0, 10])

    const mask: AlphaMask = {
      type: MaskType.ALPHA,
      w,
      h,
      data: alphaData,
    }

    const threshold = 0

    const result = makeBinaryMaskFromAlphaMask(mask, threshold)

    expect(result.data[0]).toBe(1)
    expect(result.data[1]).toBe(1)
  })

  it('handles a threshold of 255 by only converting exact matches', () => {
    const w = 2

    const h = 1

    const alphaData = new Uint8Array([254, 255])

    const mask: AlphaMask = {
      type: MaskType.ALPHA,
      w,
      h,
      data: alphaData,
    }

    const threshold = 255

    const result = makeBinaryMaskFromAlphaMask(mask, threshold)

    expect(result.data[0]).toBe(0)
    expect(result.data[1]).toBe(1)
  })

  it('correctly maps the array length based on width and height', () => {
    const w = 3

    const h = 3

    const alphaData = new Uint8Array(9)

    alphaData.fill(200)

    const mask: AlphaMask = {
      type: MaskType.ALPHA,
      w,
      h,
      data: alphaData,
    }

    const threshold = 100

    const result = makeBinaryMaskFromAlphaMask(mask, threshold)

    expect(result.data.length).toBe(9)

    // Check the last element to ensure full iteration
    expect(result.data[8]).toBe(1)
  })
})
