import { describe, expect, it } from 'vitest'
import { pixelDataToAlphaMask } from '../../src'
import { PixelData } from '../../src/PixelData'

describe('pixelDataToAlphaMask (Channel Extraction)', () => {
  const makePixels = (
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

    return new PixelData({
      width: 1,
      height: 1,
      data,
    })
  }

  it('extracts full opacity as 255', () => {
    const pixels = makePixels(255, 0, 0, 255)
    const mask = pixelDataToAlphaMask(pixels)

    expect(mask[0]).toBe(255)
  })

  it('extracts partial transparency correctly', () => {
    const pixels = makePixels(0, 255, 0, 128)
    const mask = pixelDataToAlphaMask(pixels)

    expect(mask[0]).toBe(128)
  })

  it('extracts full transparency as 0', () => {
    const pixels = makePixels(255, 255, 255, 0)
    const mask = pixelDataToAlphaMask(pixels)

    expect(mask[0]).toBe(0)
  })

  it('handles multiple pixels across the buffer', () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255, // Opaque
      0, 0, 0, 0,   // Transparent
    ])
    const pixels = new PixelData({
      width: 2,
      height: 1,
      data,
    })

    const mask = pixelDataToAlphaMask(pixels)

    expect(mask[0]).toBe(255)
    expect(mask[1]).toBe(0)
  })
})
