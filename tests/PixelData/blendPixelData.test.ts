import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'
import {
  type AlphaMask,
  type BinaryMask,
  blendPixelData,
  type Color32,
  MaskType,
  sourceOverColor32,
} from '../../src'
import { PixelData } from '../../src/PixelData'

const pack = (
  r: number,
  g: number,
  b: number,
  a: number,
): Color32 => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const WHITE = pack(255, 255, 255, 255)
const TRANSPARENT = pack(0, 0, 0, 0)

const createImg = (
  w: number,
  h: number,
  fill: number = 0,
) => {
  const data = new Uint8ClampedArray(w * h * 4)
  const img = new PixelData({
    width: w,
    height: h,
    data,
  })
  if (fill !== 0) {
    img.data32.fill(fill)
  }
  return img
}

const copyBlend = (s: Color32) => s

describe('blendPixelData', () => {
  describe('Guard Conditions & Early Exits', () => {
    it('skips all work for invalid globalAlpha or out-of-bounds targets', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, RED)

      // Merge: alpha 0 and out-of-bounds checks
      blendPixelData(dst, src, { alpha: 0 })
      blendPixelData(dst, src, {
        x: 10,
        y: 10,
      })

      expect(dst.data32[0]).toBe(BLUE)
    })

    it('bypasses blendFn for transparent source pixels', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, TRANSPARENT)
      const mockBlend = vi.fn(sourceOverColor32)

      blendPixelData(dst, src, { blendFn: mockBlend })

      expect(mockBlend).not.toHaveBeenCalled()
    })
  })

  describe('Masking Logic (Binary & Alpha)', () => {
    it('handles BinaryMask skip/pass and inversion', () => {
      const dst = createImg(4, 1, BLUE)
      const src = createImg(4, 1, RED)
      // Combined: pass/skip mixed values and inversion logic
      const mask = new Uint8Array([
        255,
        0,
        255,
        0,
      ]) as BinaryMask

      // Test Normal Binary
      blendPixelData(dst, src, {
        mask,
        maskType: MaskType.BINARY,
      })
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(BLUE)

      // Test Inverted Binary
      blendPixelData(dst, src, {
        mask,
        maskType: MaskType.BINARY,
        invertMask: true,
      })
      expect(dst.data32[0]).toBe(RED) // Was RED from previous call
      expect(dst.data32[1]).toBe(RED) // BLUE becomes RED because mask 0 is now 255
    })

    it('scales AlphaMask and handles bit-perfect pass-through', () => {
      const dst = createImg(3, 1, BLUE)
      const src = createImg(3, 1, WHITE)
      const mask = new Uint8Array([
        0,
        128,
        255,
      ]) as AlphaMask

      blendPixelData(dst, src, {
        mask,
        maskType: MaskType.ALPHA,
        blendFn: copyBlend,
      })

      const d32 = dst.data32
      // Pixel 0: Mask 0 -> BLUE
      expect(d32[0]).toBe(BLUE)
      // Pixel 1: Mask 128 -> (255 * 128 + 128) >> 8 = 128 alpha
      expect((d32[1] >>> 24) & 0xff).toBe(128)
      // Pixel 2: Mask 255 -> Bit-perfect WHITE (The Fix!)
      expect(d32[2]).toBe(WHITE)
    })

    it('aligns mask using dx/dy and custom pitch', () => {
      const dst = createImg(10, 10, BLUE)
      const src = createImg(2, 2, RED)
      const mask = new Uint8Array(16).fill(0) as BinaryMask
      mask[10] = 255 // Local (2,2) of 4x4 mask

      blendPixelData(dst, src, {
        x: 5,
        y: 5,
        w: 1,
        h: 1,
        mask,
        mw: 4,
        mx: 2,
        my: 2,
        maskType: MaskType.BINARY,
      })
      expect(dst.data32[55]).toBe(RED)
    })

    it('covers the weight === 0 branch inside the mask block', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, RED)
      // weight = (effectiveM * weight + 128) >> 8
      // To hit weight === 0 while effectiveM > 0:
      // mask value 1, globalAlpha 100 -> (1 * 100 + 128) >> 8 = 0
      const mask = new Uint8Array([1]) as AlphaMask

      blendPixelData(dst, src, {
        mask,
        alpha: 100,
        maskType: MaskType.ALPHA,
      })

      // If weight === 0, dIdx increments and continues. dst remains BLUE.
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Coordinate Clipping Logic', () => {
    it('handles complex cross-clipping (negative x, sx, y, sy)', () => {
      const dst = createImg(2, 2, BLUE)
      const src = createImg(2, 2, RED)

      // Simultaneous negative clips
      blendPixelData(dst, src, {
        x: -1,
        y: -1,
        sx: -1,
        sy: -1,
      })

      // Math: Result is a 1x1 blit of src[0,0] to dst[0,0]
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[3]).toBe(BLUE)
    })

    it('clips w/h when blit exceeds source or destination bounds', () => {
      const dst = createImg(2, 2, BLUE)
      const src = createImg(2, 2, RED)

      // Partial right-side/bottom-side clip
      blendPixelData(dst, src, {
        x: 1,
        y: 1,
        w: 10,
        h: 10,
      })

      expect(dst.data32[3]).toBe(RED)
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Destination Clipping (x, y) - Coverage', () => {
    it('covers clipping width from the left (x < 0)', () => {
      const dst = createImg(2, 2, BLUE)
      const src = createImg(2, 2, RED)

      // Drawing at x: -1.
      // Logic should: sx += 1, w -= 1, x = 0.
      blendPixelData(dst, src, {
        x: -1,
        y: 0,
      })

      // dst[0,0] gets src[1,0] (RED). dst[1,0] remains BLUE.
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(BLUE)
    })

    it('covers clipping height from the top (y < 0)', () => {
      const dst = createImg(2, 2, BLUE)
      const src = createImg(2, 2, RED)

      // Drawing at y: -1.
      // Logic should: sy += 1, h -= 1, y = 0.
      blendPixelData(dst, src, {
        x: 0,
        y: -1,
      })

      // dst[0,0] gets src[0,1] (RED). dst[0,1] remains BLUE.
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[2]).toBe(BLUE)
    })

    it('covers clipping from the right/bottom edge', () => {
      const dst = createImg(2, 2, BLUE)
      const src = createImg(5, 5, RED)

      // Draw a 5x5 square at (1,1).
      // actualW = Math.min(5, 2 - 1) = 1.
      // actualH = Math.min(5, 2 - 1) = 1.
      blendPixelData(dst, src, {
        x: 1,
        y: 1,
        w: 5,
        h: 5,
      })

      // Only dst[1,1] should be RED.
      expect(dst.data32[3]).toBe(RED)
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Precision & Re-packing', () => {
    it('prevents alpha bleed and handles weight rounding skips', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, pack(255, 0, 0, 1))
      const mockBlend = vi.fn(copyBlend)

      // 1. Skip: (1 * 100 + 128) >> 8 = 0
      blendPixelData(dst, src, {
        alpha: 100,
        blendFn: mockBlend,
      })
      expect(mockBlend).not.toHaveBeenCalled()

      // 2. Re-pack: (255 * 128 + 128) >> 8 = 128
      const src2 = createImg(1, 1, pack(255, 255, 255, 255))
      blendPixelData(dst, src2, {
        alpha: 128,
        blendFn: mockBlend,
      })
      const callArgs = mockBlend.mock.calls[0]
      expect((callArgs[0] >>> 24) & 0xff).toBe(128)
      expect(callArgs[0] & 0x00ffffff).toBe(WHITE & 0x00ffffff)
    })
  })
})
