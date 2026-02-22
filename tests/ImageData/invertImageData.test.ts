import { describe, expect, it } from 'vitest'
import { invertImageData } from '../../src'

describe('invertImageData', () => {
  const BLACK = [0, 0, 0, 255]
  const WHITE = [255, 255, 255, 255]
  const HALF_TRANSPARENT_RED = [255, 0, 0, 128]
  const INVERTED_RED = [0, 255, 255, 128]

  const expectPixel = (
    img: ImageData,
    index: number,
    rgba: number[],
  ) => {
    const start = index * 4
    const actual = Array.from(img.data.subarray(start, start + 4))

    expect(actual).toEqual(rgba)
  }

  it('turns black pixels into white', () => {
    const data = new Uint8ClampedArray(BLACK)
    const img = new ImageData(data, 1, 1)

    invertImageData(img)

    expectPixel(img, 0, WHITE)
  })

  it('turns white pixels into black', () => {
    const data = new Uint8ClampedArray(WHITE)
    const img = new ImageData(data, 1, 1)

    invertImageData(img)

    expectPixel(img, 0, BLACK)
  })

  it('inverts RGB but preserves the alpha channel', () => {
    const data = new Uint8ClampedArray(HALF_TRANSPARENT_RED)
    const img = new ImageData(data, 1, 1)

    invertImageData(img)

    // Red (255) -> 0
    // Green (0) -> 255
    // Blue (0) -> 255
    // Alpha (128) -> 128 (Unchanged)
    expectPixel(img, 0, INVERTED_RED)
  })

  it('handles multiple pixels in a row', () => {
    const data = new Uint8ClampedArray([
      ...BLACK,
      ...WHITE,
    ])
    const img = new ImageData(data, 2, 1)

    invertImageData(img)

    expectPixel(img, 0, WHITE)
    expectPixel(img, 1, BLACK)
  })
})
