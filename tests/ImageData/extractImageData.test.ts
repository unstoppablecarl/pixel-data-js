import { extractImageData } from '@/ImageData/extractImageData'
import { beforeEach, describe, expect, it } from 'vitest'
import { getImageDataBufferPixel, pack, unpackStr } from '../_helpers'

describe('extractImageData', () => {
  let mockImageData: ImageData
  const SW = 10 // Source Width
  const SH = 10 // Source Height

  beforeEach(() => {
    // Create a 10x10 dummy image where each pixel's R value is its index
    // [0,1,2,3... 99]
    const data = new Uint8ClampedArray(SW * SH * 4)
    for (let i = 0; i < SW * SH; i++) {
      data[i * 4] = i     // R: index
      data[i * 4 + 1] = 0 // G
      data[i * 4 + 2] = 0 // B
      data[i * 4 + 3] = 255 // A
    }
    mockImageData = {
      width: SW,
      height: SH,
      data: data,
    } as ImageData
  })

  describe('Argument Handling', () => {
    it('should work with object-style arguments (Rect)', () => {
      const result = extractImageData(mockImageData, { x: 0, y: 0, w: 2, h: 2 })!
      expect(result.data.length).toBe(2 * 2 * 4)
      expect(result.data[0]).toBe(0) // Top-left

      const expected = [
        unpackStr(pack(0, 0, 0, 255)),
        unpackStr(pack(1, 0, 0, 255)),
        unpackStr(pack(11, 0, 0, 255)),
        unpackStr(pack(10, 0, 0, 255)),
      ]

      const actual = [
        unpackStr(getImageDataBufferPixel(result.data, 2, 0, 0)),
        unpackStr(getImageDataBufferPixel(result.data, 2, 1, 0)),
        unpackStr(getImageDataBufferPixel(result.data, 2, 1, 1)),
        unpackStr(getImageDataBufferPixel(result.data, 2, 0, 1)),
      ]
      expect(actual).toEqual(expected)
    })

    it('should work with positional arguments', () => {
      const result = extractImageData(mockImageData, 0, 0, 2, 2)!
      expect(result.data.length).toBe(2 * 2 * 4)

      const expected = [
        unpackStr(pack(0, 0, 0, 255)),
        unpackStr(pack(1, 0, 0, 255)),
        unpackStr(pack(11, 0, 0, 255)),
        unpackStr(pack(10, 0, 0, 255)),
      ]

      const actual = [
        unpackStr(getImageDataBufferPixel(result.data, 2, 0, 0)),
        unpackStr(getImageDataBufferPixel(result.data, 2, 1, 0)),
        unpackStr(getImageDataBufferPixel(result.data, 2, 1, 1)),
        unpackStr(getImageDataBufferPixel(result.data, 2, 0, 1)),
      ]
      expect(actual).toEqual(expected)
    })
  })

  describe('Happy Path & Extraction Logic', () => {
    it('should extract a perfect 2x2 square from the center', () => {
      // Requesting 2x2 at (5,5).
      // Source indices: (5,5)=55, (6,5)=56, (5,6)=65, (6,6)=66
      const result = extractImageData(mockImageData, 5, 5, 2, 2)!

      expect(result.data[0]).toBe(55) // Top-left of patch
      expect(result.data[4]).toBe(56) // Top-right of patch
      expect(result.data[8]).toBe(65) // Bottom-left of patch
      expect(result.data[12]).toBe(66) // Bottom-right of patch
    })
  })

  describe('Boundary Clipping (The "Hard" Part)', () => {
    it('should handle a request partially off the top-left (-2, -2)', () => {
      // Request 4x4 starting at -2, -2.
      // Only the bottom-right 2x2 of this request overlaps the image.
      const result = extractImageData(mockImageData, -2, -2, 4, 4)!

      // Index in 'out' for (0,0) source would be (dstRow=2, dstCol=2)
      // dstStart = (2 * 4 + 2) * 4 = 40
      expect(result.data[40]).toBe(0)   // Source (0,0) mapped to result
      expect(result.data[0]).toBe(0)    // Padding (should be 0)
    })

    it('should handle a request partially off the bottom-right', () => {
      // Request 2x2 at (9,9). Only (9,9) exists.
      const result = extractImageData(mockImageData, 9, 9, 2, 2)!

      expect(result.data[0]).toBe(99)   // Top-left of patch is source (9,9)
      expect(result.data[4]).toBe(0)    // Off-canvas (9,10)
      expect(result.data[8]).toBe(0)    // Off-canvas (10,9)
    })

    it('should return a zeroed buffer if completely out of bounds', () => {
      const result = extractImageData(mockImageData, 20, 20, 5, 5)!
      expect(result.data.every(v => v === 0)).toBe(true)
      expect(result.data.length).toBe(5 * 5 * 4)
    })
  })

  describe('Error & Edge Cases', () => {
    it('should handle zero width or height', () => {
      // If you chose to return empty array:
      const result = extractImageData(mockImageData, 0, 0, 0, 5)
      expect(result).toBe(null)
    })

    it('should handle negative width or height', () => {
      const result = extractImageData(mockImageData, 0, 0, -5, 5)
      expect(result).toBe(null)
    })
  })
})
