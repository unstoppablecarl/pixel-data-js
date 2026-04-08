import { makePixelData, resamplePixelData, resamplePixelDataInPlace } from '@/index'
import { createImageData } from '@napi-rs/canvas/node-canvas'
import { describe, expect, it } from 'vitest'

describe('resamplePixelData', () => {
  const createTestPixelData = (w: number, h: number) => {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < data.length; i += 4) {
      // Fill with a recognizable pattern: [0, 1, 2, 3...]
      data[i] = i / 4
    }

    const imageData = createImageData(data, w, h) as ImageData

    return makePixelData(imageData)
  }

  it('should upscale by a factor of 2', () => {
    const source = createTestPixelData(2, 2)
    const result = resamplePixelData(source, 2)

    expect(result.w).toBe(4)
    expect(result.h).toBe(4)
    // Nearest neighbor: the first 2x2 block in the 4x4 should match source[0,0]
    expect(result.data[0]).toBe(source.data[0])
    expect(result.data[1]).toBe(source.data[0])
    expect(result.data[4]).toBe(source.data[0])
    expect(result.data[5]).toBe(source.data[0])
    // Verify the new imageData attachment
    expect(result.imageData).toBeDefined()
    expect(result.imageData!.width).toBe(4)
  })

  it('should downscale by a factor of 0.5', () => {
    const source = createTestPixelData(4, 4)
    const result = resamplePixelData(source, 0.5)

    expect(result.w).toBe(2)
    expect(result.h).toBe(2)
    // Should pick every second pixel
    expect(result.data[0]).toBe(source.data[0])
    expect(result.data[1]).toBe(source.data[2])
    expect(result.data[2]).toBe(source.data[8])
    expect(result.imageData).toBeDefined()
  })

  it('should handle extremely small factors by clamping to 1px', () => {
    const source = createTestPixelData(10, 10)
    const result = resamplePixelData(source, 0.001)

    expect(result.w).toBe(1)
    expect(result.h).toBe(1)
    expect(result.data.length).toBe(1)
    expect(result.data[0]).toBe(source.data[0])
  })

  it('should maintain color integrity (32-bit values)', () => {
    const data = new Uint8ClampedArray(4)

    data.set([255, 128, 64, 200])

    const imageData = createImageData(data, 1, 1) as ImageData
    const source = makePixelData(imageData)
    const result = resamplePixelData(source, 2)

    expect(result.data[0]).toBe(source.data[0])
    expect(result.data[3]).toBe(source.data[0])
  })
})

describe('resamplePixelDataInPlace', () => {
  const createTestPixelData = (w: number, h: number) => {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < data.length; i += 4) {
      data[i] = i / 4
    }

    const imageData = createImageData(data, w, h) as ImageData

    return makePixelData(imageData)
  }

  it('should mutate the original object and upscale', () => {
    const source = createTestPixelData(2, 2)
    const originalColor = source.data[0]
    const originalData = source.data

    resamplePixelDataInPlace(source, 2)

    expect(source.w).toBe(4)
    expect(source.h).toBe(4)
    // Verify the data buffer was overwritten by the underlying resample function
    expect(source.data).not.toBe(originalData)
    expect(source.data[0]).toBe(originalColor)
    expect(source.data[1]).toBe(originalColor)
    expect(source.imageData).toBeDefined()
    expect(source.imageData!.width).toBe(4)
  })

  it('should downscale in place', () => {
    const source = createTestPixelData(4, 4)
    const originalColor0 = source.data[0]
    const originalColor2 = source.data[2]

    resamplePixelDataInPlace(source, 0.5)

    expect(source.w).toBe(2)
    expect(source.h).toBe(2)
    expect(source.data[0]).toBe(originalColor0)
    expect(source.data[1]).toBe(originalColor2)
  })
})


