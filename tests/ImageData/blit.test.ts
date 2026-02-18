import { describe, expect, it, vi, beforeEach } from 'vitest'
import { blendImageData, sourceOverColor32 } from '../../src'
import type { Color32 } from '../../src/_types'

const pack = (r: number, g: number, b: number, a: number): Color32 =>
  ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32

describe('blendImageData 100% Coverage Suite', () => {
  // Helper to create ImageData
  const createImg = (w: number, h: number, fill: number = 0) => {
    const data = new Uint8ClampedArray(w * h * 4)
    if (fill !== 0) {
      const view = new Uint32Array(data.buffer)
      view.fill(fill)
    }
    return { width: w, height: h, data } as ImageData
  }

  const RED = pack(255, 0, 0, 255)
  const BLUE = pack(0, 0, 255, 255)
  const TRANSPARENT = pack(0, 0, 0, 0)

  it('should early exit if width or height results in 0', () => {
    const dst = createImg(10, 10)
    const src = createImg(10, 10)
    // dx outside bounds
    blendImageData(dst, src, { dx: 15 })
    // Verify no work was done (buffer still 0)
    expect(new Uint32Array(dst.data.buffer)[0]).toBe(0)
  })

  describe('Coordinate Clipping Logic', () => {
    it('clips negative source offsets (sx, sy)', () => {
      const dst = createImg(5, 5)
      const src = createImg(5, 5, RED)
      blendImageData(dst, src, { sx: -2, sy: -2 })
      // sx: -2 makes dx become 2. Pixel at [2,2] should be RED
      const dst32 = new Uint32Array(dst.data.buffer)
      expect(dst32[2 * 5 + 2]).toBe(RED)
    })

    it('clips negative destination offsets (dx, dy)', () => {
      const dst = createImg(5, 5)
      const src = createImg(5, 5, RED)
      blendImageData(dst, src, { dx: -2, dy: -2 })
      // dx: -2 makes sx become 2. dst[0,0] should get src[2,2]
      const dst32 = new Uint32Array(dst.data.buffer)
      expect(dst32[0]).toBe(RED)
    })

    it('clips width/height exceeding image bounds', () => {
      const dst = createImg(5, 5)
      const src = createImg(10, 10, RED)
      // sw=20 is larger than src.width-sx
      blendImageData(dst, src, { sw: 20, sh: 20 })
      const dst32 = new Uint32Array(dst.data.buffer)
      expect(dst32[24]).toBe(RED) // Last pixel in 5x5
    })
  })

  describe('Pixel Processing Branches', () => {
    it('skips fully transparent source pixels (sa === 0)', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, TRANSPARENT)
      blendImageData(dst, src, {})
      expect(new Uint32Array(dst.data.buffer)[0]).toBe(BLUE)
    })

    it('applies global opacity (hasGlobalAlpha)', () => {
      const dst = createImg(1, 1, pack(0, 0, 0, 255))
      const src = createImg(1, 1, RED)
      const mockBlend = vi.fn((s) => s)

      blendImageData(dst, src, { opacity: 0.5, blendFn: mockBlend })

      const calledSrc = mockBlend.mock.calls[0][0]
      const sa = (calledSrc >>> 24) & 0xFF

      expect(sa).toBe(128)
    })

    it('skips pixel if opacity results in alpha 0', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, RED)
      blendImageData(dst, src, { opacity: 0 })
      expect(new Uint32Array(dst.data.buffer)[0]).toBe(BLUE)
    })
  })

  describe('Masking Logic', () => {
    it('skips pixel if mask value is 0 (Binary/Alpha)', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, RED)
      const mask = new Uint8Array([0])
      blendImageData(dst, src, { mask })
      expect(new Uint32Array(dst.data.buffer)[0]).toBe(BLUE)
    })

    it('scales alpha in maskMode: "alpha"', () => {
      const dst = createImg(1, 1, pack(0, 0, 0, 255))
      const src = createImg(1, 1, RED)
      const mask = new Uint8Array([128]) // 50%
      const mockBlend = vi.fn((s) => s)

      blendImageData(dst, src, { mask, maskMode: 'alpha', blendFn: mockBlend })

      const sa = (mockBlend.mock.calls[0][0] >>> 24) & 0xFF
      expect(sa).toBe(128)
    })

    it('skips calculation if mask results in alpha 0', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, pack(255, 0, 0, 1)) // Very low alpha
      const mask = new Uint8Array([1]) // Very low mask
      // (1 * 1) >> 8 = 0
      blendImageData(dst, src, { mask, maskMode: 'alpha' })
      expect(new Uint32Array(dst.data.buffer)[0]).toBe(BLUE)
    })

    it('ignores mask scaling in maskMode: "binary" (implicitly)', () => {
      const dst = createImg(1, 1, pack(0, 0, 0, 255))
      const src = createImg(1, 1, RED)
      const mask = new Uint8Array([100]) // Binary mode treats non-zero as "on" but scaling only happens if maskMode === 'alpha'
      const mockBlend = vi.fn((s) => s)

      // @ts-ignore testing binary mode explicitly
      blendImageData(dst, src, { mask, maskMode: 'binary', blendFn: mockBlend })

      const sa = (mockBlend.mock.calls[0][0] >>> 24) & 0xFF
      expect(sa).toBe(255) // Should NOT be scaled
    })
  })

  describe('blendImageData - Advanced Alpha & Coverage', () => {
    // Mocking ImageData for Node environment
    const createImg = (w: number, h: number, fillColor?: number) => {
      const data = new Uint8ClampedArray(w * h * 4)
      if (fillColor !== undefined) {
        const view = new Uint32Array(data.buffer)
        view.fill(fillColor)
      }
      return {
        width: w,
        height: h,
        data
      } as ImageData
    }

    let dst: ImageData
    let src: ImageData

    beforeEach(() => {
      dst = createImg(10, 10, pack(0, 0, 255, 255)) // Solid Blue
      src = createImg(10, 10, pack(255, 0, 0, 255)) // Solid Red
    })

    it('uses "alpha" (0-255) property directly', () => {
      const mockBlend = vi.fn((s) => s)
      blendImageData(dst, src, { alpha: 128, blendFn: mockBlend })

      const blendedPixel = mockBlend.mock.calls[0][0]
      const sa = (blendedPixel >>> 24) & 0xFF
      expect(sa).toBe(128)
    })

    it('uses "opacity" (0-1.0) and rounds correctly', () => {
      const mockBlend = vi.fn((s) => s)
      // 0.5 * 255 + 0.5 = 128
      blendImageData(dst, src, { opacity: 0.5, blendFn: mockBlend })

      const blendedPixel = mockBlend.mock.calls[0][0]
      const sa = (blendedPixel >>> 24) & 0xFF

      expect(sa).toBe(128)
    })

    it('handles "alpha" override over "opacity"', () => {
      const mockBlend = vi.fn((s) => s)
      // alpha 200 should win over opacity 0.5
      blendImageData(dst, src, { alpha: 200, opacity: 0.5, blendFn: mockBlend })

      const blendedPixel = mockBlend.mock.calls[0][0]
      const sa = (blendedPixel >>> 24) & 0xFF
      // (255 * 200) >> 8 = 199
      expect(sa).toBe(199)
    })

    it('clips coordinates and does not throw', () => {
      const smallDst = createImg(2, 2, pack(0, 0, 0, 255))
      const largeSrc = createImg(10, 10, pack(255, 255, 255, 255))

      // Requesting a blit that goes outside bounds
      blendImageData(smallDst, largeSrc, { dx: 1, dy: 1, sw: 5, sh: 5 })

      const dst32 = new Uint32Array(smallDst.data.buffer)
      expect(dst32[3]).toBe(pack(255, 255, 255, 255)) // Last pixel should be white
    })

    it('skips pixels correctly when combined alpha becomes 0', () => {
      const mockBlend = vi.fn((s) => s)
      const semiSrc = createImg(1, 1, pack(255, 0, 0, 1)) // Very low alpha

      // 1 * 10 >> 8 = 0. Should trigger the second 'continue'
      blendImageData(dst, semiSrc, { alpha: 10, blendFn: mockBlend })

      expect(mockBlend).not.toHaveBeenCalled()
    })
  })
  describe('blendImageData - Real World Blending', () => {
    const createImg = (w: number, h: number, color: number) => {
      const data = new Uint8ClampedArray(w * h * 4)
      new Uint32Array(data.buffer).fill(color)
      return { width: w, height: h, data } as ImageData
    }

    it('should correctly blend Red onto Blue using sourceOver (Normal Blend)', () => {
      // Semi-transparent Red (128 alpha)
      const srcColor = pack(255, 0, 0, 128)
      // Opaque Blue
      const dstColor = pack(0, 0, 255, 255)

      const src = createImg(1, 1, srcColor)
      const dst = createImg(1, 1, dstColor)

      blendImageData(dst, src, { blendFn: sourceOverColor32 })

      const result = new Uint32Array(dst.data.buffer)[0]

      const r = result & 0xFF
      const b = (result >> 16) & 0xFF

      // Standard SourceOver Math:
      // result = srcColor * (srcAlpha/255) + dstColor * (1 - srcAlpha/255)
      // R: 255 * 0.5 + 0 * 0.5 = 127.5 -> 127 or 128
      // B: 0 * 0.5 + 255 * 0.5 = 127.5 -> 127 or 128
      expect(r).toBeCloseTo(127, -1)
      expect(b).toBeCloseTo(127, -1)
    })

    it('should verify mask reduces blend intensity', () => {
      const src = createImg(1, 1, pack(255, 255, 255, 255)) // White
      const dst = createImg(1, 1, pack(0, 0, 0, 255))       // Black
      const mask = new Uint8Array([64]) // ~25% strength mask

      blendImageData(dst, src, {
        mask,
        maskMode: 'alpha',
        blendFn: sourceOverColor32
      })

      const result = new Uint32Array(dst.data.buffer)[0]
      const brightness = result & 0xFF

      // If the mask works, the result should be dark gray (~64), not white (255)
      expect(brightness).toBeLessThan(70)
      expect(brightness).toBeGreaterThan(50)
    })
  })
})
