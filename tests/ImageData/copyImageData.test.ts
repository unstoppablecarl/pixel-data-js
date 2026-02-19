import { ImageData } from '@napi-rs/canvas'
import { describe, expect, it } from 'vitest'
import { copyImageData, copyImageDataLike, type ImageDataLike } from '../../src'

describe('Image Data Utilities', () => {
  // Helper to create a small mock ImageData-like object
  const createMockSource = (w = 2, h = 2) => {

    const data = new Uint8ClampedArray(w * h * 4).fill(255) // All white pixels
    data[0] = 100 // Set first byte to something unique
    return new ImageData(data, w, h) as ImageDataLike
  }

  describe('copyImageData', () => {
    it('should create a valid ImageData instance with identical data', () => {
      const source = createMockSource()
      const result = copyImageData(source)

      expect(result).toBeInstanceOf(ImageData)
      expect(result.width).toBe(source.width)
      expect(result.height).toBe(source.height)
      expect(result.data).toEqual(source.data)
    })

    it('should perform a deep copy (modifying copy should not affect source)', () => {
      const source = createMockSource()
      const result = copyImageData(source)

      // Modify the copy
      result.data[0] = 50

      expect(result.data[0]).toBe(50)
      expect(source.data[0]).toBe(100) // Original remains unchanged
    })
  })

  describe('copyImageDataLike', () => {
    it('should return a plain object with a deep-copied buffer', () => {
      const source = createMockSource()
      const result = copyImageDataLike(source)

      expect(result).not.toBeInstanceOf(ImageData)
      expect(result.data).not.toBe(source.data) // Different reference
      expect(result.data).toEqual(source.data) // Same values
    })

    it('should maintain the exact width and height', () => {
      const source = { data: new Uint8ClampedArray(16), width: 10, height: 20 }
      const result = copyImageDataLike(source)

      expect(result.width).toBe(10)
      expect(result.height).toBe(20)
    })
  })
})
