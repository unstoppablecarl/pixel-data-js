import { describe, expect, it } from 'vitest'
import { imageDataToAlphaMask } from '../../src'

describe('imageDataToAlphaMask', () => {
  it('extracts alpha values from raw ImageData', () => {
    const rawData = new Uint8ClampedArray([
      255, 0, 0, 255, // Red, Opaque
      0, 255, 0, 127, // Green, Half-transparent
      0, 0, 255, 0,   // Blue, Transparent
    ])

    const img = new ImageData(
      rawData,
      3,
      1,
    )

    const mask = imageDataToAlphaMask(img)

    expect(mask.length).toBe(3)
    expect(mask[0]).toBe(255)
    expect(mask[1]).toBe(127)
    expect(mask[2]).toBe(0)
  })

  it('correctly handles an empty image', () => {
    const img = new ImageData(
      0,
      0,
    )
    const mask = imageDataToAlphaMask(img)

    expect(mask.length).toBe(0)
  })
})
