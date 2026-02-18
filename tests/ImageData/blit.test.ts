import { describe, expect, it, vi } from 'vitest'
import type { AlphaMask, BinaryMask } from '../../src' // Adjust based on your export path
import { blendImageData, MaskType, sourceOverColor32 } from '../../src'
import type { Color32 } from '../../src'

const pack = (r: number, g: number, b: number, a: number): Color32 =>
  ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32

describe('blendImageData 100% Coverage Suite', () => {
  const createImg = (w: number, h: number, fill: number = 0) => {
    const data = new Uint8ClampedArray(w * h * 4)
    if (fill !== 0) {
      new Uint32Array(data.buffer).fill(fill)
    }
    return { width: w, height: h, data } as ImageData
  }

  // Helper to create Mask Objects
  const createAlphaMask = (w: number, h: number, fill: number): AlphaMask => ({
    type: MaskType.ALPHA,
    width: w,
    height: h,
    data: new Uint8Array(w * h).fill(fill),
  })

  const createBinaryMask = (w: number, h: number, fill: number): BinaryMask => ({
    type: MaskType.BINARY,
    width: w,
    height: h,
    data: new Uint8Array(w * h).fill(fill),
  })

  const RED = pack(255, 0, 0, 255)
  const BLUE = pack(0, 0, 255, 255)
  const TRANSPARENT = pack(0, 0, 0, 0)

  describe('Masking Logic with AnyMask', () => {
    it('skips pixel if BinaryMask value is 0', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, RED)
      const mask = createBinaryMask(1, 1, 0)

      blendImageData(dst, src, { mask })

      expect(new Uint32Array(dst.data.buffer)[0]).toBe(BLUE)
    })

    it('scales alpha when using AlphaMask', () => {
      const dst = createImg(1, 1, pack(0, 0, 0, 255))
      const src = createImg(1, 1, RED)
      const mask = createAlphaMask(1, 1, 128) // 50%
      const mockBlend = vi.fn((s) => s)

      blendImageData(dst, src, { mask, blendFn: mockBlend })

      const sa = (mockBlend.mock.calls[0][0] >>> 24) & 0xFF
      expect(sa).toBe(128)
    })

    it('respects mask coordinates (dx/dy) inside blendImageData', () => {
      const dst = createImg(2, 2, BLUE)
      const src = createImg(2, 2, RED)
      // A 1x1 mask that only allows blending at (1,1)
      const mask: BinaryMask = {
        type: MaskType.BINARY,
        width: 1,
        height: 1,
        data: new Uint8Array([255]),
      }

      blendImageData(dst, src, {
        mask,
        dx: 1, dy: 1, // Place the mask at the bottom-right of dst
        sw: 1, sh: 1,
      })

      const dst32 = new Uint32Array(dst.data.buffer)
      expect(dst32[0]).toBe(BLUE) // Top-left remains BLUE
      expect(dst32[3]).toBe(RED)  // Bottom-right becomes RED
    })

    it('ignores mask scaling when MaskType is BINARY', () => {
      const dst = createImg(1, 1, pack(0, 0, 0, 255))
      const src = createImg(1, 1, RED)
      // Even if value is 100, BINARY should treat it as "ON" if not 0
      const mask = createBinaryMask(1, 1, 100)
      const mockBlend = vi.fn((s) => s)

      blendImageData(dst, src, { mask, blendFn: mockBlend })

      const sa = (mockBlend.mock.calls[0][0] >>> 24) & 0xFF
      expect(sa).toBe(255)
    })
  })

  describe('Pixel Processing Branches', () => {
    it('handles "alpha" override over "opacity"', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, RED)
      const mockBlend = vi.fn((s) => s)

      // alpha 200 should win over opacity 0.5
      blendImageData(dst, src, { alpha: 200, opacity: 0.5, blendFn: mockBlend })

      const sa = (mockBlend.mock.calls[0][0] >>> 24) & 0xFF
      // Math: (255 * 200) >> 8 = 199
      expect(sa).toBe(199)
    })

    it('skips pixels correctly when combined alpha becomes 0 via small mask values', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, pack(255, 0, 0, 1)) // Very low alpha
      const mask = createAlphaMask(1, 1, 1) // Very low mask
      const mockBlend = vi.fn((s) => s)

      // (1 * 1) >> 8 = 0
      blendImageData(dst, src, { mask, blendFn: mockBlend })

      expect(mockBlend).not.toHaveBeenCalled()
      expect(new Uint32Array(dst.data.buffer)[0]).toBe(BLUE)
    })
  })

  describe('Real World Blending', () => {
    it('should verify AlphaMask reduces blend intensity on large scale', () => {
      const src = createImg(1, 1, pack(255, 255, 255, 255)) // White
      const dst = createImg(1, 1, pack(0, 0, 0, 255))       // Black
      const mask = createAlphaMask(1, 1, 64) // ~25% strength

      blendImageData(dst, src, {
        mask,
        blendFn: sourceOverColor32,
      })

      const result = new Uint32Array(dst.data.buffer)[0]
      const brightness = result & 0xFF

      expect(brightness).toBeLessThan(70)
      expect(brightness).toBeGreaterThan(50)
    })
  })
  it('covers negative dx/dy clipping', () => {
    const dst = createImg(5, 5)
    const src = createImg(5, 5, RED)

    // dx: -2 means we start drawing at dst[0],
    // but we must skip the first 2 pixels of the source (sx becomes 2)
    blendImageData(dst, src, { dx: -2, dy: -2 })

    const dst32 = new Uint32Array(dst.data.buffer)
    // The pixel that was at src[2, 2] should now be at dst[0, 0]
    expect(dst32[0]).toBe(RED)
  })
  it('covers negative sx/sy clipping', () => {
    const dst = createImg(5, 5)
    const src = createImg(5, 5, RED)

    // sx: -2 means we shift the destination draw point
    // to the right by 2 (dx becomes 2)
    blendImageData(dst, src, { sx: -2, sy: -2 })

    const dst32 = new Uint32Array(dst.data.buffer)
    // The pixel that was at src[0, 0] should now be at dst[2, 2]
    expect(dst32[2 * 5 + 2]).toBe(RED)
  })
  it('covers the sa === 0 skip branch', () => {
    const dst = createImg(2, 1, BLUE)
    const src = createImg(2, 1)
    const src32 = new Uint32Array(src.data.buffer)

    src32[0] = TRANSPARENT // Pixel 0: Alpha 0 (Should skip)
    src32[1] = RED         // Pixel 1: Alpha 255 (Should blend)

    const mockBlend = vi.fn((s) => s) // Simple source-over mock

    blendImageData(dst, src, { blendFn: mockBlend })

    // mockBlend should only be called ONCE (for the second pixel)
    expect(mockBlend).toHaveBeenCalledTimes(1)

    const dst32 = new Uint32Array(dst.data.buffer)
    expect(dst32[0]).toBe(BLUE) // Pixel 0 untouched
    expect(dst32[1]).toBe(RED)  // Pixel 1 blended
  })
  it('covers the early exit for non-intersecting rectangles (actualW/H <= 0)', () => {
    const dst = createImg(10, 10, BLUE)
    const src = createImg(10, 10, RED)

    // Case 1: dx is so far to the right that it starts after dst ends
    blendImageData(dst, src, { dx: 10 })

    // Case 2: dy is so far down that it starts after dst ends
    blendImageData(dst, src, { dy: 10 })

    // Case 3: sx is so far right that no source pixels are available
    blendImageData(dst, src, { sx: 10 })

    // Verify dst remains purely BLUE (no work was done)
    const dst32 = new Uint32Array(dst.data.buffer)
    expect(dst32[0]).toBe(BLUE)
  })
})
