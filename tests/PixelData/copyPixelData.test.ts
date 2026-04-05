import { copyPixelData } from '@/index'
import { describe, expect, it } from 'vitest'

describe('copyPixelData', () => {
  it('should create an independent copy of the pixel data', () => {
    const width = 2
    const height = 2
    const bufferSize = width * height * 4
    const originalBuffer = new Uint8ClampedArray(bufferSize)

    originalBuffer[0] = 255
    originalBuffer[1] = 100

    const imageData = new ImageData(originalBuffer, width, height)

    const target = {
      imageData: imageData,
      w: width,
      h: height,
    } as any

    const copy = copyPixelData(target)

    expect(copy.w).toBe(width)
    expect(copy.h).toBe(height)
    expect(Array.from(copy.imageData.data)).toEqual(Array.from(originalBuffer))

    expect(copy.imageData.data).not.toBe(originalBuffer)

    originalBuffer[0] = 0

    expect(copy.imageData.data[0]).toBe(255)
  })
})
