import { describe, expect, it } from 'vitest'
import { resampleImageData } from '../../src'

describe('resampleImageData', () => {
  const createTestRGBA = (w: number, h: number) => {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < data.length; i++) {
      data[i] = i % 256
    }
    return new ImageData(data, w, h)
  }

  it('should upscale and replicate RGBA chunks', () => {
    const source = createTestRGBA(1, 1)
    const factor = 2
    const result = resampleImageData(source, factor)

    expect(result.width).toBe(2)
    expect(result.height).toBe(2)
    // Every pixel in the 2x2 should match the original 1x1 RGBA
    for (let i = 0; i < 16; i += 4) {
      expect(result.data[i]).toBe(source.data[0])
      expect(result.data[i + 3]).toBe(source.data[3])
    }
  })

  it('should downscale and subsample RGBA chunks', () => {
    const source = createTestRGBA(4, 4)
    const factor = 0.5
    const result = resampleImageData(source, factor)

    expect(result.width).toBe(2)
    expect(result.height).toBe(2)
    // Check first pixel matches source[0,0]
    expect(result.data[0]).toBe(source.data[0])
    // Check second pixel in first row matches source[2,0]
    const sourceIdx = (0 * 4 + 2) * 4
    expect(result.data[4]).toBe(source.data[sourceIdx])
  })

  it('should clamp minimum dimensions to 1x1', () => {
    const source = createTestRGBA(2, 2)
    const result = resampleImageData(source, 0.0001)

    expect(result.width).toBe(1)
    expect(result.height).toBe(1)
  })
})
