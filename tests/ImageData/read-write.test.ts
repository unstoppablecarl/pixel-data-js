import { beforeEach, describe, expect, it } from 'vitest'
import { getImageDataPixelAsRGBA, setImageDataPixelRGBA } from '../../src/ImageData/read-write'
import type { RGBA } from '../../src/types'

describe('ImageData Pixel Manipulation', () => {
  let mockImageData: ImageData
  const width = 10
  const height = 10

  beforeEach(() => {
    // Create a 10x10 transparent black image
    const data = new Uint8ClampedArray(width * height * 4).fill(0)
    mockImageData = new ImageData(data, width, height)
  })

  describe('setImageDataPixelRGBA', () => {
    it('should set the correct color at (0, 0)', () => {
      const color: RGBA = { r: 255, g: 128, b: 64, a: 200 }
      setImageDataPixelRGBA(mockImageData, 0, 0, color)

      // Manual check of the underlying buffer
      expect(mockImageData.data[0]).toBe(255) // R
      expect(mockImageData.data[1]).toBe(128) // G
      expect(mockImageData.data[2]).toBe(64)  // B
      expect(mockImageData.data[3]).toBe(200) // A
    })

    it('should set the correct color at a specific coordinate (5, 2)', () => {
      const color: RGBA = { r: 10, g: 20, b: 30, a: 40 }
      setImageDataPixelRGBA(mockImageData, 5, 2, color)

      // Index calculation: (2 * 10 + 5) * 4 = 100
      expect(mockImageData.data[100]).toBe(10)
      expect(mockImageData.data[103]).toBe(40)
    })

    it('should handle the last pixel in the image', () => {
      const color: RGBA = { r: 1, g: 2, b: 3, a: 4 }
      setImageDataPixelRGBA(mockImageData, 9, 9, color)

      const lastIndex = (9 * 10 + 9) * 4
      expect(mockImageData.data[lastIndex]).toBe(1)
    })
  })

  describe('getImageDataPixelAsRGBA', () => {
    it('should retrieve the correct RGBA values', () => {
      // Manually seed data
      const index = (3 * width + 4) * 4 // x=4, y=3
      mockImageData.data[index] = 255
      mockImageData.data[index + 1] = 0
      mockImageData.data[index + 2] = 100
      mockImageData.data[index + 3] = 255

      const result = getImageDataPixelAsRGBA(mockImageData, 4, 3)
      expect(result).toEqual({ r: 255, g: 0, b: 100, a: 255 })
    })
  })

  describe('Round-trip Integration', () => {
    it('should return exactly what was set', () => {
      const testColor: RGBA = { r: 50, g: 150, b: 250, a: 100 }
      const x = 7
      const y = 8

      setImageDataPixelRGBA(mockImageData, x, y, testColor)
      const retrieved = getImageDataPixelAsRGBA(mockImageData, x, y)

      expect(retrieved).toEqual(testColor)
    })
  })

  describe('Boundary / Edge Cases', () => {
    it('should return undefined or throw if coordinates are out of bounds (Native behavior check)', () => {
      // Depending on your preference, you might want these functions to throw.
      // Currently, they will return {r: undefined, ...} or NaN due to array access.
      const outOfBounds = getImageDataPixelAsRGBA(mockImageData, 11, 11)

      expect(outOfBounds.r).toBeUndefined()
    })

    it('should correctly handle a 1x1 image', () => {
      const tinyImg = new ImageData(new Uint8ClampedArray(4), 1, 1)
      const color: RGBA = { r: 255, g: 255, b: 255, a: 255 }

      setImageDataPixelRGBA(tinyImg, 0, 0, color)
      expect(getImageDataPixelAsRGBA(tinyImg, 0, 0)).toEqual(color)
    })
  })
})
