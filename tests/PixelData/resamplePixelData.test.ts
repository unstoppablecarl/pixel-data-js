import { describe, expect, it } from 'vitest'
import { PixelData } from '../../src'
import { resamplePixelData } from '../../src'

describe('resamplePixelData', () => {
  const createTestPixelData = (w: number, h: number) => {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < data.length; i += 4) {
      // Fill with a recognizable pattern: [0, 1, 2, 3...]
      data[i] = i / 4
    }
    return new PixelData({
      data,
      width: w,
      height: h,
    })
  }

  it('should upscale by a factor of 2', () => {
    const source = createTestPixelData(2, 2)
    const result = resamplePixelData(source, 2)

    expect(result.width).toBe(4)
    expect(result.height).toBe(4)
    // Nearest neighbor: the first 2x2 block in the 4x4 should match source[0,0]
    expect(result.data32[0]).toBe(source.data32[0])
    expect(result.data32[1]).toBe(source.data32[0])
    expect(result.data32[4]).toBe(source.data32[0])
    expect(result.data32[5]).toBe(source.data32[0])
  })

  it('should downscale by a factor of 0.5', () => {
    const source = createTestPixelData(4, 4)
    const result = resamplePixelData(source, 0.5)

    expect(result.width).toBe(2)
    expect(result.height).toBe(2)
    // Should pick every second pixel
    expect(result.data32[0]).toBe(source.data32[0])
    expect(result.data32[1]).toBe(source.data32[2])
    expect(result.data32[2]).toBe(source.data32[8])
  })

  it('should handle extremely small factors by clamping to 1px', () => {
    const source = createTestPixelData(10, 10)
    const result = resamplePixelData(source, 0.001)

    expect(result.width).toBe(1)
    expect(result.height).toBe(1)
    expect(result.data32.length).toBe(1)
    expect(result.data32[0]).toBe(source.data32[0])
  })

  it('should maintain color integrity (32-bit values)', () => {
    const data = new Uint8ClampedArray(4)
    data.set([255, 128, 64, 200]) // Specific RGBA
    const source = new PixelData({
      data,
      width: 1,
      height: 1,
    })
    const result = resamplePixelData(source, 2)

    expect(result.data32[0]).toBe(source.data32[0])
    expect(result.data32[3]).toBe(source.data32[0])
  })
})
