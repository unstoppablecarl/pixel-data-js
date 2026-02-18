import { beforeEach, describe, expect, it } from 'vitest'
import type { Color32, ImageDataLike } from '../../src'
import {
  copyImageData,
  copyImageDataLike,
  extractPixelData,
  makeImageDataColor32Adapter,
} from '../../src'

describe('makeImageDataColor32Adapter', () => {
  let mockImageData: ImageDataLike
  const width = 4
  const height = 4

  beforeEach(() => {
    // Create a 4x4 image (16 pixels, 64 bytes)
    const buffer = new ArrayBuffer(width * height * 4)
    mockImageData = {
      width,
      height,
      data: new Uint8ClampedArray(buffer),
    }
  })

  describe('Initialization', () => {
    it('should create a Uint32Array view of the same buffer', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      expect(adapter.data32).toBeInstanceOf(Uint32Array)
      expect(adapter.data32.length).toBe(width * height)
      expect(adapter.data32.buffer).toBe(mockImageData.data.buffer)
    })
  })

  describe('inBounds', () => {
    it('should return true for coordinates outside the image', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      expect(adapter.inBounds(-1, 0)).toBe(true)
      expect(adapter.inBounds(width, 0)).toBe(true)
      expect(adapter.inBounds(0, -1)).toBe(true)
      expect(adapter.inBounds(0, height)).toBe(true)
    })

    it('should return false for coordinates inside the image', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      expect(adapter.inBounds(0, 0)).toBe(false)
      expect(adapter.inBounds(width - 1, height - 1)).toBe(false)
    })
  })

  describe('setPixel and getPixel', () => {
    it('should set and get a 32-bit color correctly', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      const color = 0xFFAABBCC as Color32 // A: 255, B: 170, G: 187, R: 204

      adapter.setPixel(1, 1, color)
      expect(adapter.getPixel(1, 1)).toBe(color)
    })

    it('should update the underlying Uint8ClampedArray', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      // 0xAABBGGRR -> In Little Endian R is first byte
      const color = 0xFF332211 as Color32

      adapter.setPixel(0, 0, color)

      // index (0,0) starts at byte 0
      expect(mockImageData.data[0]).toBe(0x11) // R
      expect(mockImageData.data[1]).toBe(0x22) // G
      expect(mockImageData.data[2]).toBe(0x33) // B
      expect(mockImageData.data[3]).toBe(0xFF) // A
    })

    it('should return undefined when getting out of bounds', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      expect(adapter.getPixel(99, 99)).toBeUndefined()
    })

    it('should not throw or modify data when setting out of bounds', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      const color = 0xFFFFFFFF as Color32

      adapter.setPixel(-1, -1, color)

      // Verify no data was changed in the buffer
      const allZeros = Array.from(mockImageData.data).every(v => v === 0)
      expect(allZeros).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle a 1x1 image', () => {
      const tinyData: ImageDataLike = {
        width: 1,
        height: 1,
        data: new Uint8ClampedArray(4),
      }
      const adapter = makeImageDataColor32Adapter(tinyData)
      const color = 0x12345678 as Color32

      adapter.setPixel(0, 0, color)
      expect(adapter.getPixel(0, 0)).toBe(color)
    })

    it('should reflect changes made directly to data32', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      const color = 0xDEADC0DE as Color32

      adapter.data32[0] = color
      expect(adapter.getPixel(0, 0)).toBe(color)
    })
  })

  describe('extractPixelData', () => {
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
        const result = extractPixelData(mockImageData, { x: 0, y: 0, w: 2, h: 2 })
        expect(result.length).toBe(2 * 2 * 4)
        expect(result[0]).toBe(0) // Top-left
      })

      it('should work with positional arguments', () => {
        const result = extractPixelData(mockImageData, 0, 0, 2, 2)
        expect(result.length).toBe(2 * 2 * 4)
        expect(result[0]).toBe(0)
      })
    })

    describe('Happy Path & Extraction Logic', () => {
      it('should extract a perfect 2x2 square from the center', () => {
        // Requesting 2x2 at (5,5).
        // Source indices: (5,5)=55, (6,5)=56, (5,6)=65, (6,6)=66
        const result = extractPixelData(mockImageData, 5, 5, 2, 2)

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
        const result = extractPixelData(mockImageData, -2, -2, 4, 4)

        // Index in 'out' for (0,0) source would be (dstRow=2, dstCol=2)
        // dstStart = (2 * 4 + 2) * 4 = 40
        expect(result[40]).toBe(0)   // Source (0,0) mapped to result
        expect(result[0]).toBe(0)    // Padding (should be 0)
      })

      it('should handle a request partially off the bottom-right', () => {
        // Request 2x2 at (9,9). Only (9,9) exists.
        const result = extractPixelData(mockImageData, 9, 9, 2, 2)

        expect(result[0]).toBe(99)   // Top-left of patch is source (9,9)
        expect(result[4]).toBe(0)    // Off-canvas (9,10)
        expect(result[8]).toBe(0)    // Off-canvas (10,9)
      })

      it('should return a zeroed buffer if completely out of bounds', () => {
        const result = extractPixelData(mockImageData, 20, 20, 5, 5)
        expect(result.every(v => v === 0)).toBe(true)
        expect(result.length).toBe(5 * 5 * 4)
      })
    })

    describe('Error & Edge Cases', () => {
      it('should handle zero width or height', () => {
        // If you chose to return empty array:
        const result = extractPixelData(mockImageData, 0, 0, 0, 5)
        expect(result.length).toBe(0)

        // OR: If you chose to throw, use:
        // expect(() => extractPixelData(mockImageData, 0, 0, 0, 5)).toThrow();
      })

      it('should handle negative width or height', () => {
        const result = extractPixelData(mockImageData, 0, 0, -5, 5)
        expect(result.length).toBe(0)
      })
    })
  })
  describe('Image Data Utilities', () => {
    // Helper to create a small mock ImageData-like object
    const createMockSource = (w = 2, h = 2) => {
      const data = new Uint8ClampedArray(w * h * 4).fill(255) // All white pixels
      data[0] = 100 // Set first byte to something unique
      return { data, width: w, height: h }
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
})
