import { describe, expect, it } from 'vitest'
import { PixelData } from '../../src'
import { invertPixelData } from '../../src'

describe('PixelData Inversion', () => {
  const makeMockImageData = (
    r: number,
    g: number,
    b: number,
    a: number,
  ) => {
    const data = new Uint8ClampedArray([
      r,
      g,
      b,
      a,
    ])

    return {
      width: 1,
      height: 1,
      data,
    }
  }

  it('correctly inverts a Red pixel to Cyan via the 32-bit view', () => {
    // Red: 255, 0, 0, 255
    const mock = makeMockImageData(255, 0, 0, 255)
    const pixels = new PixelData(mock)

    invertPixelData(pixels)

    // Inverted RGB: 0, 255, 255. Alpha: 255.
    // In Little-Endian Uint32: 0xFFFFFF00
    expect(pixels.data32[0]).toBe(0xffffff00)

    // Also verify the original buffer was updated
    expect(mock.data[0]).toBe(0)
    expect(mock.data[1]).toBe(255)
    expect(mock.data[2]).toBe(255)
  })

  it('preserves the Alpha channel exactly', () => {
    // Semi-transparent Green: 0, 255, 0, 128
    const mock = makeMockImageData(0, 255, 0, 128)
    const pixels = new PixelData(mock)

    invertPixelData(pixels)

    // Alpha is the 4th byte. In mock.data[3] it should still be 128.
    expect(mock.data[3]).toBe(128)
  })

  it('handles bitwise shift logic for data32 length', () => {
    const mock = {
      width: 2,
      height: 2,
      data: new Uint8ClampedArray(16),
    }
    const pixels = new PixelData(mock)

    // 16 bytes >> 2 = 4 elements in Uint32Array
    expect(pixels.data32.length).toBe(4)
  })
})
