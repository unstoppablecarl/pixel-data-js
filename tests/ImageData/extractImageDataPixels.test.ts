import { beforeEach, describe, expect, it } from 'vitest'
import { extractImageDataPixels } from '../../src'

describe('extractImageDataPixels', () => {
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
      const result = extractImageDataPixels(mockImageData, { x: 0, y: 0, w: 2, h: 2 })
      expect(result.length).toBe(2 * 2 * 4)
      expect(result[0]).toBe(0) // Top-left
    })

    it('should work with positional arguments', () => {
      const result = extractImageDataPixels(mockImageData, 0, 0, 2, 2)
      expect(result.length).toBe(2 * 2 * 4)
      expect(result[0]).toBe(0)
    })
  })

  describe('Happy Path & Extraction Logic', () => {
    it('should extract a perfect 2x2 square from the center', () => {
      // Requesting 2x2 at (5,5).
      // Source indices: (5,5)=55, (6,5)=56, (5,6)=65, (6,6)=66
      const result = extractImageDataPixels(mockImageData, 5, 5, 2, 2)

      expect(result[0]).toBe(55) // Top-left of patch
      expect(result[4]).toBe(56) // Top-right of patch
      expect(result[8]).toBe(65) // Bottom-left of patch
      expect(result[12]).toBe(66) // Bottom-right of patch
    })
  })

  describe('Boundary Clipping (The "Hard" Part)', () => {
    it('should handle a request partially off the top-left (-2, -2)', () => {
      // Request 4x4 starting at -2, -2.
      // Only the bottom-right 2x2 of this request overlaps the image.
      const result = extractImageDataPixels(mockImageData, -2, -2, 4, 4)

      // Index in 'out' for (0,0) source would be (dstRow=2, dstCol=2)
      // dstStart = (2 * 4 + 2) * 4 = 40
      expect(result[40]).toBe(0)   // Source (0,0) mapped to result
      expect(result[0]).toBe(0)    // Padding (should be 0)
    })

    it('should handle a request partially off the bottom-right', () => {
      // Request 2x2 at (9,9). Only (9,9) exists.
      const result = extractImageDataPixels(mockImageData, 9, 9, 2, 2)

      expect(result[0]).toBe(99)   // Top-left of patch is source (9,9)
      expect(result[4]).toBe(0)    // Off-canvas (9,10)
      expect(result[8]).toBe(0)    // Off-canvas (10,9)
    })

    it('should return a zeroed buffer if completely out of bounds', () => {
      const result = extractImageDataPixels(mockImageData, 20, 20, 5, 5)
      expect(result.every(v => v === 0)).toBe(true)
      expect(result.length).toBe(5 * 5 * 4)
    })
  })

  describe('Error & Edge Cases', () => {
    it('should handle zero width or height', () => {
      // If you chose to return empty array:
      const result = extractImageDataPixels(mockImageData, 0, 0, 0, 5)
      expect(result.length).toBe(0)
    })

    it('should handle negative width or height', () => {
      const result = extractImageDataPixels(mockImageData, 0, 0, -5, 5)
      expect(result.length).toBe(0)
    })
  })
})
