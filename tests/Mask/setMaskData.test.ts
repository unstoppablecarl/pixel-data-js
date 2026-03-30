import { makeAlphaMask, makeBinaryMask, MaskType, setMaskData } from '@/index'
import { describe, expect, it } from 'vitest'

describe('setMaskData', () => {
  it('sets binary mask', () => {
    const mask = makeBinaryMask(2, 2)
    const newWidth = 4
    const newHeight = 1
    const newData = new Uint8Array(4)

    newData[0] = 255
    newData[1] = 128
    newData[2] = 64
    newData[3] = 0

    setMaskData(mask, newWidth, newHeight, newData)

    expect(mask.type).toBe(MaskType.BINARY)
    expect(mask.w).toBe(newWidth)
    expect(mask.h).toBe(newHeight)
    expect(mask.data).toBe(newData)
    expect(mask.data[0]).toBe(255)
  })

  it('sets alpha mask', () => {
    const mask = makeAlphaMask(2, 2)
    const newWidth = 4
    const newHeight = 1
    const newData = new Uint8Array(4)

    newData[0] = 255
    newData[1] = 128
    newData[2] = 64
    newData[3] = 0

    setMaskData(mask, newWidth, newHeight, newData)

    expect(mask.type).toBe(MaskType.ALPHA)
    expect(mask.w).toBe(newWidth)
    expect(mask.h).toBe(newHeight)
    expect(mask.data).toBe(newData)
    expect(mask.data[0]).toBe(255)
  })
})
