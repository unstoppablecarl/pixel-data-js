import { describe, expect, it, vi } from 'vitest'
import { type AlphaMask, type BinaryMask, type Color32, MaskType, sourceOverColor32 } from '../../src'
import { PixelData } from '../../src/PixelData'
import { blendColorPixelData } from '../../src/PixelData/blendColorPixelData'
import { pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const WHITE = pack(255, 255, 255, 255)
const TRANSPARENT = pack(0, 0, 0, 0)

const makeTestPixelData = (
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

describe('blendColorPixelData', () => {
  describe('Guard Conditions & Early Exits', () => {
    it('skips all work for invalid globalAlpha or out-of-bounds targets', () => {
      const dst = makeTestPixelData(1, 1, BLUE)

      // alpha 0 and out-of-bounds checks
      blendColorPixelData(dst, RED, { alpha: 0 })
      blendColorPixelData(dst, RED, {
        x: 10,
        y: 10,
      })

      expect(dst.data32[0]).toBe(BLUE)
    })

    it('bypasses blendFn for transparent source color', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const mockBlend = vi.fn(sourceOverColor32)

      blendColorPixelData(dst, TRANSPARENT, { blendFn: mockBlend })

      expect(mockBlend).not.toHaveBeenCalled()
    })
  })

  describe('Masking Logic (Binary & Alpha)', () => {
    it('handles BinaryMask skip/pass and inversion', () => {
      const dst = makeTestPixelData(4, 1, BLUE)
      const mask = new Uint8Array([
        255,
        0,
        255,
        0,
      ]) as BinaryMask

      // Test Normal Binary
      blendColorPixelData(dst, RED, {
        mask,
        maskType: MaskType.BINARY,
      })
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(BLUE)

      // Test Inverted Binary
      blendColorPixelData(dst, RED, {
        mask,
        maskType: MaskType.BINARY,
        invertMask: true,
      })
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(RED)
    })

    it('scales AlphaMask and handles bit-perfect pass-through', () => {
      const dst = makeTestPixelData(3, 1, BLUE)
      const mask = new Uint8Array([
        0,
        128,
        255,
      ]) as AlphaMask

      blendColorPixelData(dst, WHITE, {
        mask,
        maskType: MaskType.ALPHA,
        blendFn: copyBlend,
      })

      const d32 = dst.data32
      expect(d32[0]).toBe(BLUE)
      expect((d32[1] >>> 24) & 0xff).toBe(128)
      expect(d32[2]).toBe(WHITE)
    })

    it('aligns mask using dx/dy and custom pitch', () => {
      const dst = makeTestPixelData(10, 10, BLUE)
      const mask = new Uint8Array(16).fill(0) as BinaryMask
      mask[10] = 255 // Local (2,2) of 4x4 mask

      blendColorPixelData(dst, RED, {
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
  })

  describe('Coordinate Clipping Logic', () => {
    it('handles negative x, y offsets', () => {
      const dst = makeTestPixelData(2, 2, BLUE)

      // Negative offset: fill a 2x2 starting at -1,-1
      // Only dst[0,0] is covered
      blendColorPixelData(dst, RED, {
        x: -1,
        y: -1,
        w: 2,
        h: 2,
      })

      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[3]).toBe(BLUE)
    })

    it('clips w/h when fill exceeds destination bounds', () => {
      const dst = makeTestPixelData(2, 2, BLUE)

      blendColorPixelData(dst, RED, {
        x: 1,
        y: 1,
        w: 10,
        h: 10,
      })

      expect(dst.data32[3]).toBe(RED)
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Precision & Re-packing', () => {
    it('prevents alpha bleed and handles weight rounding skips', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const color = pack(255, 0, 0, 1)
      const mockBlend = vi.fn(copyBlend)

      // Skip: (1 * 100 + 128) >> 8 = 0
      blendColorPixelData(dst, color, {
        alpha: 100,
        blendFn: mockBlend,
      })
      expect(mockBlend).not.toHaveBeenCalled()

      // Re-pack
      blendColorPixelData(dst, WHITE, {
        alpha: 128,
        blendFn: mockBlend,
      })
      const callArgs = mockBlend.mock.calls[0]
      expect((callArgs[0] >>> 24) & 0xff).toBe(128)
    })
  })

  describe('Grid Checks', () => {
    const DW = 10
    const DH = 10

    it('accurately fills every pixel in a complex clipped region', () => {
      const dst = makeTestPixelData(DW, DH, BLUE)
      const targetX = 2
      const targetY = 3
      const drawW = 5
      const drawH = 4

      blendColorPixelData(dst, RED, {
        x: targetX,
        y: targetY,
        w: drawW,
        h: drawH,
        blendFn: copyBlend,
      })

      const d = dst.imageData.data

      for (let dy = 0; dy < DH; dy++) {
        for (let dx = 0; dx < DW; dx++) {
          const dIdx = (dy * DW + dx) * 4
          const isInside = dx >= targetX && dx < targetX + drawW &&
            dy >= targetY && dy < targetY + drawH

          if (isInside) {
            expect(dst.data32[dy * DW + dx]).toBe(RED)
          } else {
            expect(dst.data32[dy * DW + dx]).toBe(BLUE)
          }
        }
      }
    })

    it('verifies mask alignment during color fill', () => {
      const dst = makeTestPixelData(5, 5, 0)
      const mask = new Uint8Array(25) as BinaryMask
      for (let i = 0; i < 25; i++) {
        mask[i] = i % 2 === 0 ? 255 : 0
      }

      blendColorPixelData(dst, RED, {
        mask,
        maskType: MaskType.BINARY,
        blendFn: copyBlend,
      })

      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const mIdx = y * 5 + x
          if (mask[mIdx] === 255) {
            expect(dst.data32[y * 5 + x]).toBe(RED)
          } else {
            expect(dst.data32[y * 5 + x]).toBe(0)
          }
        }
      }
    })
  })

  it('covers the weight === 0 branch inside the mask block', () => {
    const dst = makeTestPixelData(1, 1, BLUE)

    // weight = (effectiveM * weight + 128) >> 8
    // mask value 1, globalAlpha 100: (1 * 100 + 128) = 228
    // 228 >> 8 = 0
    const mask = new Uint8Array([1]) as AlphaMask
    const mockBlend = vi.fn(sourceOverColor32)

    blendColorPixelData(dst, RED, {
      mask,
      alpha: 100,
      maskType: MaskType.ALPHA,
      blendFn: mockBlend,
    })

    // The weight === 0 branch should trigger 'continue' before blendFn
    expect(mockBlend).not.toHaveBeenCalled()
    expect(dst.data32[0]).toBe(BLUE)
  })
  describe('Extended Coverage & Edge Cases', () => {
    it('prevents memory wrap-around when width exceeds destination', () => {
      // 3x3 destination
      const dst = makeTestPixelData(3, 3, BLUE)

      // Request a 10px wide fill starting at (1,1)
      // actualW should be 2.
      // If stride math is wrong, it might bleed into the next row.
      blendColorPixelData(dst, RED, {
        x: 1,
        y: 1,
        w: 10,
        h: 1,
        blendFn: copyBlend,
      })

      // (1,1) and (2,1) should be RED
      expect(dst.data32[4]).toBe(RED)
      expect(dst.data32[5]).toBe(RED)

      // (0,2) should still be BLUE. If wrap-around occurred, this would be RED.
      expect(dst.data32[6]).toBe(BLUE)
    })

    it('handles inverted AlphaMask correctly', () => {
      const dst = makeTestPixelData(1, 1, TRANSPARENT)
      // Mask 255 inverted becomes 0
      const mask = new Uint8Array([255]) as AlphaMask

      blendColorPixelData(dst, WHITE, {
        mask,
        maskType: MaskType.ALPHA,
        invertMask: true,
        blendFn: copyBlend,
      })

      expect(dst.data32[0]).toBe(TRANSPARENT)
    })

    it('respects my and mx offsets even when clipping occurs', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      // 2x2 mask, only index [3] (bottom right) is active
      const mask = new Uint8Array([0, 0, 0, 255]) as BinaryMask

      blendColorPixelData(dst, RED, {
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        mask,
        mw: 2,
        mx: 1,
        my: 1, // Points to mask[3]
        maskType: MaskType.BINARY,
      })

      expect(dst.data32[0]).toBe(RED)
    })
  })
})
