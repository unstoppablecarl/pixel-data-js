import { describe, expect, it } from 'vitest'
import { resizeImageData } from '../../src'

describe('resizeImageData', () => {
  const RED = [255, 0, 0, 255]
  const BLUE = [0, 0, 255, 255]
  const EMPTY = [0, 0, 0, 0]

  /** Helper to check a specific pixel's RGBA values */
  const expectPixel = (
    img: ImageData,
    x: number,
    y: number,
    rgba: number[],
  ) => {
    const start = (y * img.width + x) * 4
    const actual = Array.from(img.data.subarray(start, start + 4))

    expect(actual).toEqual(rgba)
  }

  it('should pad an image (move 1x1 RED image into 3x3 at center)', () => {
    // 1x1 RED image
    const sourceData = new Uint8ClampedArray(RED)
    const source = new ImageData(sourceData, 1, 1)

    // Resize to 3x3, placing source at (1, 1)
    const result = resizeImageData(source, 3, 3, 1, 1)

    // Center should be RED
    expectPixel(result, 1, 1, RED)

    // Corners should be EMPTY
    expectPixel(result, 0, 0, EMPTY)
    expectPixel(result, 2, 2, EMPTY)
  })

  it('should crop an image (move 2x2 multi-color into 1x1)', () => {
    const data = new Uint8ClampedArray(2 * 2 * 4)
    // (0,0) = RED, (1,1) = BLUE
    data.set(RED, 0)
    data.set(BLUE, 12)

    const source = new ImageData(data, 2, 2)

    // Crop to 1x1, looking at the second pixel (shifted -1, -1)
    const result = resizeImageData(source, 1, 1, -1, -1)

    // The result should now be BLUE
    expectPixel(result, 0, 0, BLUE)
  })

  it('should return a completely empty image when there is no overlap', () => {
    const source = new ImageData(new Uint8ClampedArray(RED), 1, 1)

    // Offset is way outside the new 2x2 bounds
    const result = resizeImageData(source, 2, 2, 5, 5)

    const isAllZeros = result.data.every((val) => val === 0)
    expect(isAllZeros).toBe(true)
  })

  it('should handle zero-dimension results gracefully', () => {
    const source = new ImageData(new Uint8ClampedArray(RED), 1, 1)
    const result = resizeImageData(source, 0, 0)

    expect(result.width).toBe(0)
    expect(result.height).toBe(0)
    expect(result.data.length).toBe(0)
  })
})
