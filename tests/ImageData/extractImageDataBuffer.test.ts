import { extractImageDataBuffer } from '@/index'
import { beforeEach, describe, expect, it } from 'vitest'
import { getImageDataBufferPixel, pack, unpackStr } from '../_helpers'

describe('extractImageDataBuffer', () => {
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
      const result = extractImageDataBuffer(mockImageData, { x: 0, y: 0, w: 2, h: 2 })
      expect(result.length).toBe(2 * 2 * 4)
      expect(result[0]).toBe(0) // Top-left

      const expected = [
        unpackStr(pack(0, 0, 0, 255)),
        unpackStr(pack(1, 0, 0, 255)),
        unpackStr(pack(11, 0, 0, 255)),
        unpackStr(pack(10, 0, 0, 255)),
      ]

      const actual = [
        unpackStr(getImageDataBufferPixel(result, 2, 0, 0)),
        unpackStr(getImageDataBufferPixel(result, 2, 1, 0)),
        unpackStr(getImageDataBufferPixel(result, 2, 1, 1)),
        unpackStr(getImageDataBufferPixel(result, 2, 0, 1)),
      ]
      expect(actual).toEqual(expected)
    })

    it('should work with positional arguments', () => {
      const result = extractImageDataBuffer(mockImageData, 0, 0, 2, 2)
      expect(result.length).toBe(2 * 2 * 4)

      const expected = [
        unpackStr(pack(0, 0, 0, 255)),
        unpackStr(pack(1, 0, 0, 255)),
        unpackStr(pack(11, 0, 0, 255)),
        unpackStr(pack(10, 0, 0, 255)),
      ]

      const actual = [
        unpackStr(getImageDataBufferPixel(result, 2, 0, 0)),
        unpackStr(getImageDataBufferPixel(result, 2, 1, 0)),
        unpackStr(getImageDataBufferPixel(result, 2, 1, 1)),
        unpackStr(getImageDataBufferPixel(result, 2, 0, 1)),
      ]
      expect(actual).toEqual(expected)
    })
  })

  describe('Happy Path & Extraction Logic', () => {
    it('should extract a perfect 2x2 square from the center', () => {
      // Requesting 2x2 at (5,5).
      // Source indices: (5,5)=55, (6,5)=56, (5,6)=65, (6,6)=66
      const result = extractImageDataBuffer(mockImageData, 5, 5, 2, 2)

      expect(result[0]).toBe(55) // Top-left of patch
      expect(result[4]).toBe(56) // Top-right of patch
      expect(result[8]).toBe(65) // Bottom-left of patch
      expect(result[12]).toBe(66) // Bottom-right of patch
    })

    it('should extract a perfect 2x3 square from the center', () => {
      // Requesting 2x2 at (5,5).
      // Source indices: (5,5)=55, (6,5)=56, (5,6)=65, (6,6)=66
      const result = extractImageDataBuffer(mockImageData, 5, 5, 2, 3)

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
      const result = extractImageDataBuffer(mockImageData, -2, -2, 4, 4)

      // Index in 'out' for (0,0) source would be (dstRow=2, dstCol=2)
      // dstStart = (2 * 4 + 2) * 4 = 40
      expect(result[40]).toBe(0)   // Source (0,0) mapped to result
      expect(result[0]).toBe(0)    // Padding (should be 0)
    })

    it('should handle a request partially off the bottom-right', () => {
      // Request 2x2 at (9,9). Only (9,9) exists.
      const result = extractImageDataBuffer(mockImageData, 9, 9, 2, 2)

      expect(result[0]).toBe(99)   // Top-left of patch is source (9,9)
      expect(result[4]).toBe(0)    // Off-canvas (9,10)
      expect(result[8]).toBe(0)    // Off-canvas (10,9)
    })

    it('should return a zeroed buffer if completely out of bounds', () => {
      const result = extractImageDataBuffer(mockImageData, 20, 20, 5, 5)
      expect(result.every(v => v === 0)).toBe(true)
      expect(result.length).toBe(5 * 5 * 4)
    })
  })

  describe('Error & Edge Cases', () => {
    it('should handle zero width or height', () => {
      // If you chose to return empty array:
      const result = extractImageDataBuffer(mockImageData, 0, 0, 0, 5)
      expect(result.length).toBe(0)
    })

    it('should handle negative width or height', () => {
      const result = extractImageDataBuffer(mockImageData, 0, 0, -5, 5)
      expect(result.length).toBe(0)
    })
  })
  const createUnalignedSrc = (w: number, h: number) => {
    const size = w * h * 4
    const buffer = new ArrayBuffer(size + 3)
    const data = new Uint8ClampedArray(buffer, 1, size) // Offset by 1 byte

    // Fill with predictable data: [0, 1, 2, 3, 4, 5...]
    for (let i = 0; i < data.length; i++) {
      data[i] = i % 256
    }

    return {
      width: w,
      height: h,
      data,
    }
  }

  it('forces the fallback path and extracts data correctly', () => {
    const src = createUnalignedSrc(4, 4)

    // Verify our test setup is actually unaligned
    expect(src.data.byteOffset % 4).not.toBe(0)

    // Extract a 2x2 region from the center (x=1, y=1)
    const result = extractImageDataBuffer(src, 1, 1, 2, 2)

    expect(result).toBeInstanceOf(Uint8ClampedArray)
    expect(result.length).toBe(2 * 2 * 4)

    // Verify specific pixel values
    // Source index for (1,1) is (1 * 4 + 1) * 4 = 20
    // The RGBA values should be [20, 21, 22, 23]
    expect(result[0]).toBe(20)
    expect(result[1]).toBe(21)
    expect(result[2]).toBe(22)
    expect(result[3]).toBe(23)
  })

  it('handles unaligned buffers with clipping', () => {
    const src = createUnalignedSrc(2, 2)
    const result = extractImageDataBuffer(src, -1, -1, 2, 2)

    // With x=-1, y=-1, Source(0,0) lands at Dest(1,1)
    // Index for Dest(1,1) is 12
    expect(result[12]).toBe(0) // Source(0,0) Red is 0 in your helper
    expect(result[0]).toBe(0)  // Dest(0,0) is empty
  })

  it('maintains data integrity across rows in unaligned path', () => {
    const w = 10
    const h = 10
    const src = createUnalignedSrc(w, h)

    // Extract a full row to ensure the rowLen math is correct
    const result = extractImageDataBuffer(src, 0, 5, w, 1)

    const startVal = (5 * w + 0) * 4
    expect(result[0]).toBe(startVal % 256)
    expect(result[result.length - 1]).toBe((startVal + w * 4 - 1) % 256)
  })
})
