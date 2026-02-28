import { describe, expect, it } from 'vitest'
import type { IndexedImage } from '../../src'
import { resampleIndexedImage } from '../../src'

describe('resampleIndexedImage', () => {
  const createTestIndexed = (w: number, h: number): IndexedImage => {
    const data = new Int32Array(w * h)
    for (let i = 0; i < data.length; i++) {
      data[i] = i
    }
    return {
      width: w,
      height: h,
      data,
      palette: new Uint32Array([0xFF0000FF, 0x00FF00FF]),
      transparentPalletIndex: 0,
    }
  }

  it('should upscale indices correctly', () => {
    const source = createTestIndexed(2, 2)
    const result = resampleIndexedImage(source, 2)

    expect(result.width).toBe(4)
    expect(result.data[0]).toBe(source.data[0])
    expect(result.data[1]).toBe(source.data[0])
    expect(result.data[4]).toBe(source.data[0])
  })

  it('should preserve palette and transparency metadata', () => {
    const source = createTestIndexed(2, 2)
    const result = resampleIndexedImage(source, 0.5)

    expect(result.palette).toBe(source.palette)
    expect(result.transparentPalletIndex).toBe(source.transparentPalletIndex)
  })

  it('should downscale indices by skipping entries', () => {
    const source = createTestIndexed(10, 10)
    const result = resampleIndexedImage(source, 0.1)

    expect(result.width).toBe(1)
    expect(result.height).toBe(1)
    expect(result.data[0]).toBe(source.data[0])
  })
})
