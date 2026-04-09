import { writeImageDataBuffer } from '@/index'
import { describe, expect, it } from 'vitest'
import { createTestImageData, expectPixelToMatch, makeMockImageData } from '../_helpers'

describe('writeImageDataBuffer', () => {
  const W = 10
  const H = 10

  it('correctly maps source pixels when drawing with negative offsets', () => {
    const dst = new ImageData(new Uint8ClampedArray(W * H * 4), W, H)
    const patchW = 5
    const patchH = 5
    const patch = createTestImageData(patchW, patchH)

    // Draw at (-2, -2).
    // This means patch(2,2) should land at dst(0,0)
    writeImageDataBuffer(dst, patch.data, -2, -2, patchW, patchH)

    // Dst(0,0) should contain Patch(2,2) data
    expectPixelToMatch(dst, 0, 0, 2, 2)

    // Dst(2,2) should contain Patch(4,4) data
    expectPixelToMatch(dst, 2, 2, 4, 4)

    // Dst(3,0) should be empty (out of patch bounds)
    expect(dst.data[(0 * W + 3) * 4 + 3]).toBe(0)
  })

  it('clips pixels correctly at the right and bottom edges', () => {
    const dst = new ImageData(new Uint8ClampedArray(W * H * 4), W, H)
    const patchW = 5
    const patchH = 5
    const patch = createTestImageData(patchW, patchH)

    // Draw at (8, 8).
    // Only a 2x2 area from the patch (0,0 to 1,1) fits.
    writeImageDataBuffer(dst, patch.data, 8, 8, patchW, patchH)

    // Dst(8,8) matches Patch(0,0)
    expectPixelToMatch(dst, 8, 8, 0, 0)

    // Dst(9,9) matches Patch(1,1)
    expectPixelToMatch(dst, 9, 9, 1, 1)
  })

  it('maintains integrity when w/h of data is smaller than the Rect', () => {
    const dst = new ImageData(new Uint8ClampedArray(W * H * 4), W, H)
    // Only enough data for 1x1 pixel
    const tinyData = new Uint8ClampedArray(4).fill(255)

    // Rect claims 5x5
    const fn = () => writeImageDataBuffer(dst, tinyData, 0, 0, 5, 5)

    expect(fn).not.toThrow()
    // First pixel should be white
    expect(dst.data[0]).toBe(255)
    // Second pixel should be 0 (loop continued/safely exited)
    expect(dst.data[4]).toBe(0)
  })

  it('handles negative coordinates (top-left clipping)', () => {
    const dst = makeMockImageData(5, 5)
    const patchW = 4
    const patchH = 4
    const data = new Uint8ClampedArray(patchW * patchH * 4).fill(255)

    // Drawing a 4x4 patch at (-2, -2) on a 5x5 canvas
    // Only the bottom-right 2x2 of the patch should land at dst(0,0)
    writeImageDataBuffer(dst, data, -2, -2, patchW, patchH)

    // dst[0,0] should be white
    expect(dst.data[0]).toBe(255)
    // dst[2,0] should be empty (only 2px wide area was valid)
    const idx = (0 * 5 + 2) * 4
    expect(dst.data[idx]).toBe(0)
  })

  it('handles overflow coordinates (bottom-right clipping)', () => {
    const dst = makeMockImageData(2, 2)
    const patchW = 10
    const patchH = 10
    const data = new Uint8ClampedArray(patchW * patchH * 4).fill(255)

    // Draw huge patch at (1,1) of a tiny canvas
    // Only 1x1 area should be written at dst[1,1]
    writeImageDataBuffer(dst, data, 1, 1, patchW, patchH)

    // dst[1,1] is index 3 in a 2x2
    const idx = (1 * 2 + 1) * 4
    expect(dst.data[idx]).toBe(255)
    // dst[0,0] remains empty
    expect(dst.data[0]).toBe(0)
  })

  it('early exits if the intersection is completely out of bounds', () => {
    const dst = makeMockImageData(5, 5)
    const data = new Uint8ClampedArray(16).fill(255)

    // Completely off to the right
    writeImageDataBuffer(dst, data, 10, 0, 2, 2)
    // Completely off to the top
    writeImageDataBuffer(dst, data, 0, -10, 2, 2)

    const sum = dst.data.reduce((
      a,
      b,
    ) => a + b, 0)
    expect(sum).toBe(0)
  })

  it('supports the Rect object overload', () => {
    const dst = makeMockImageData(5, 5)
    const data = new Uint8ClampedArray(4).fill(255)
    const rect = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }

    writeImageDataBuffer(dst, data, rect)
    expect(dst.data[0]).toBe(255)
  })

  it('does not crash if source data is smaller than requested dimensions', () => {
    const dst = makeMockImageData(10, 10)
    // Requested 10x10 (400 bytes) but only provided 4 bytes
    const tinyData = new Uint8ClampedArray(4).fill(255)

    // This should not throw because of our o + rowLen check
    const fn = () => writeImageDataBuffer(dst, tinyData, 0, 0, 10, 10)
    expect(fn).not.toThrow()
  })

  describe('Slow Path', () => {
    /**
     * Creates a Uint8ClampedArray that is guaranteed to be unaligned.
     */
    const createUnalignedBuffer = (w: number, h: number, fill = 0) => {
      const size = w * h * 4
      const buffer = new ArrayBuffer(size + 1)
      const data = new Uint8ClampedArray(buffer, 1, size) // Offset by 1 byte
      data.fill(fill)
      return data
    }

    it('correctly writes when the source data is unaligned', () => {
      // Target is aligned (standard POJO)
      const targetData = new Uint8ClampedArray(2 * 2 * 4).fill(0)
      const target = { width: 2, height: 2, data: targetData } as unknown as ImageData

      // Source is unaligned
      const sourceData = createUnalignedBuffer(2, 2)
      sourceData.fill(255) // Fill with white pixels

      // Verify alignment in test
      expect(sourceData.byteOffset % 4).not.toBe(0)

      writeImageDataBuffer(target, sourceData, 0, 0, 2, 2)

      // Check first pixel (RGBA)
      expect(targetData[0]).toBe(255)
      expect(targetData[3]).toBe(255)
    })

    it('correctly writes when the target data is unaligned', () => {
      // Target is unaligned
      const targetData = createUnalignedBuffer(2, 2, 0)
      const target = { width: 2, height: 2, data: targetData } as unknown as ImageData

      // Source is aligned
      const sourceData = new Uint8ClampedArray(2 * 2 * 4).fill(128)

      expect(targetData.byteOffset % 4).not.toBe(0)

      writeImageDataBuffer(target, sourceData, 0, 0, 2, 2)

      expect(targetData[0]).toBe(128)
      expect(targetData[targetData.length - 1]).toBe(128)
    })

    it('handles clipping in the unaligned fallback path', () => {
      // 3x3 target, unaligned
      const targetData = createUnalignedBuffer(3, 3, 0)
      const target = { width: 3, height: 3, data: targetData } as unknown as ImageData

      // 2x2 source, unaligned
      const sourceData = createUnalignedBuffer(2, 2, 200)

      // Write a 2x2 source into a 3x3 target at offset (1, 1)
      // This should only affect the bottom-right 2x2 area of the target
      writeImageDataBuffer(target, sourceData, 1, 1, 2, 2)

      // Target(0,0) should still be 0
      expect(targetData[0]).toBe(0)

      // Target(1,1) should be 200
      // Index: (y * width + x) * 4 => (1 * 3 + 1) * 4 = 16
      expect(targetData[16]).toBe(200)

      // Target(2,2) should be 200
      // Index: (2 * 3 + 2) * 4 = 32
      expect(targetData[32]).toBe(200)
    })

    it('clips source data when writing to negative target coordinates', () => {
      const targetData = createUnalignedBuffer(2, 2, 0)
      const target = { width: 2, height: 2, data: targetData } as unknown as ImageData

      const sourceData = createUnalignedBuffer(2, 2)
      // P0: 10, P1: 20, P2: 30, P3: 40 (Red channel markers)
      sourceData[0] = 10; sourceData[4] = 20; sourceData[8] = 30; sourceData[12] = 40

      // Write at (-1, -1). Only Source P3 (bottom-right) should land at Target (0,0).
      writeImageDataBuffer(target, sourceData, -1, -1, 2, 2)

      // Target(0,0) index 0
      expect(targetData[0]).toBe(40)
      // Target(1,0) index 4
      expect(targetData[4]).toBe(0)
    })
  })

  describe('Dimension Guards', () => {
    const createTarget = (w: number, h: number) => {
      const data = new Uint8ClampedArray(w * h * 4).fill(0)
      return new ImageData(data, w, h)
    }

    it('should return early and do nothing if width is 0 or negative', () => {
      const target = createTarget(2, 2)
      const sourceData = new Uint8ClampedArray(4 * 4 * 4).fill(255)

      // Test zero width
      writeImageDataBuffer(target, sourceData, 0, 0, 0, 2)
      expect(target.data.every(v => v === 0)).toBe(true)

      // Test negative width
      writeImageDataBuffer(target, sourceData, 0, 0, -10, 2)
      expect(target.data.every(v => v === 0)).toBe(true)
    })

    it('should return early and do nothing if height is 0 or negative', () => {
      const target = createTarget(2, 2)
      const sourceData = new Uint8ClampedArray(4 * 4 * 4).fill(255)

      // Test zero height
      writeImageDataBuffer(target, sourceData, 0, 0, 2, 0)
      expect(target.data.every(v => v === 0)).toBe(true)

      // Test negative height
      writeImageDataBuffer(target, sourceData, 0, 0, 2, -5)
      expect(target.data.every(v => v === 0)).toBe(true)
    })

    it('should handle zero dimensions passed via a Rect object', () => {
      const target = createTarget(2, 2)
      const sourceData = new Uint8ClampedArray(4 * 4 * 4).fill(255)
      const emptyRect = { x: 0, y: 0, w: 0, h: 0 }

      writeImageDataBuffer(target, sourceData, emptyRect)
      expect(target.data.every(v => v === 0)).toBe(true)
    })

    it('should return early if clipping results in zero copy dimensions', () => {
      const target = createTarget(2, 2)
      const sourceData = new Uint8ClampedArray(4 * 4 * 4).fill(255)

      // Write a 2x2 block at (5, 5) into a 2x2 target (completely out of bounds)
      writeImageDataBuffer(target, sourceData, 5, 5, 2, 2)
      expect(target.data.every(v => v === 0)).toBe(true)
    })
  })
})
