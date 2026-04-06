import { extractPixelData, makePixelData, type Rect } from '@/index'
import { ImageData as NapiImageData } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'

describe('extractPixelData', () => {
  const createTestPixelData = (w: number, h: number) => {
    const buffer = new Uint8ClampedArray(w * h * 4)
    const imageData = new NapiImageData(buffer, w, h) as unknown as ImageData
    const pd = makePixelData(imageData)

    for (let i = 0; i < pd.data.length; i++) {
      pd.data[i] = i + 1
    }

    return pd
  }

  it('should return a new PixelData instance with correct dimensions', () => {
    const source = createTestPixelData(10, 10)
    const w = 5
    const h = 6
    const result = extractPixelData(source, 0, 0, w, h)

    expect(result.w).toBe(w)
    expect(result.h).toBe(h)
    expect(result.imageData.width).toBe(w)
    expect(result.imageData.height).toBe(h)

    expect(result.data.length).toBe(w * h)
  })

  it('should extract correct pixel values using individual arguments', () => {
    const source = createTestPixelData(2, 2)
    // [[1, 2], [3, 4]] -> Extract second column [2, 4]
    const result = extractPixelData(source, 1, 0, 1, 2)

    expect(result.data[0]).toBe(2)
    expect(result.data[1]).toBe(4)
  })

  it('should extract correct pixel values using a Rect object', () => {
    const source = createTestPixelData(4, 4)
    const rect: Rect = {
      x: 2,
      y: 2,
      w: 2,
      h: 2,
    }

    const result = extractPixelData(source, rect)

    expect(result.w).toBe(2)
    // Row 2, Col 2 in 4x4 is index 10 (value 11)
    expect(result.data[0]).toBe(11)
  })

  it('should handle out-of-bounds regions by returning a cleared PixelData', () => {
    const source = createTestPixelData(2, 2)
    const result = extractPixelData(source, 10, 10, 2, 2)

    expect(result.w).toBe(2)
    expect(result.h).toBe(2)
    expect(result.data.every((v) => v === 0)).toBe(true)
  })

  it('should ensure the returned PixelData has a valid ImageData reference', () => {
    const source = createTestPixelData(1, 1)
    const result = extractPixelData(source, 0, 0, 1, 1)

    // This is critical for your production "no ImageDataLike" rule
    expect(result.imageData).toBeDefined()
    expect(result.imageData.width).toBe(1)
    expect(result.data.buffer).toBe(result.imageData.data.buffer)
  })
})
