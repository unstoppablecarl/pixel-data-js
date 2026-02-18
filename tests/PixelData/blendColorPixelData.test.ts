import { describe, expect, it, vi } from 'vitest'
import {
  type AlphaMask,
  type BinaryMask,
  type Color32,
  MaskType,
  sourceOverColor32,
  unpackAlpha, unpackColor,
} from '../../src'
import { blendColorPixelData } from '../../src/PixelData/blendColorPixelData'
import { makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const WHITE = pack(255, 255, 255, 255)
const TRANSPARENT = pack(0, 0, 0, 0)

const copyBlend = (s: Color32) => s

describe('blendColorPixelData', () => {
  describe('Guard Conditions & Early Exits', () => {
    it('skips all work for invalid globalAlpha or out-of-bounds targets', () => {
      const dst = makeTestPixelData(1, 1, BLUE)

      blendColorPixelData(dst, RED, { alpha: 0 })
      blendColorPixelData(dst, RED, {
        x: 10,
        y: 10,
      })

      expect(dst.data32[0]).toBe(BLUE)
    })

    it('bypasses blendFn for transparent source pixels', () => {
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
        1,
        0,
        1,
        0,
      ]) as BinaryMask

      blendColorPixelData(dst, RED, {
        mask,
        maskType: MaskType.BINARY,
      })
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(BLUE)

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
      mask[10] = 1

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

    it('covers the weight === 0 branch inside the mask block', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const mask = new Uint8Array([1]) as AlphaMask
      const mockBlend = vi.fn(sourceOverColor32)

      blendColorPixelData(dst, RED, {
        mask,
        alpha: 100,
        maskType: MaskType.ALPHA,
        blendFn: mockBlend,
      })

      expect(mockBlend).not.toHaveBeenCalled()
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Coordinate Clipping Logic', () => {
    it('handles negative x, y offsets', () => {
      const dst = makeTestPixelData(2, 2, BLUE)

      blendColorPixelData(dst, RED, {
        x: -1,
        y: -1,
        w: 2,
        h: 2,
      })

      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[3]).toBe(BLUE)
    })

    it('covers clipping height from the top (y < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)

      blendColorPixelData(dst, RED, {
        x: 0,
        y: -1,
        w: 2,
        h: 2,
      })

      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[2]).toBe(BLUE)
    })

    it('covers clipping from the right/bottom edge', () => {
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

      blendColorPixelData(dst, color, {
        alpha: 100,
        blendFn: mockBlend,
      })
      expect(mockBlend).not.toHaveBeenCalled()

      blendColorPixelData(dst, WHITE, {
        alpha: 128,
        blendFn: mockBlend,
      })
      const callArgs = mockBlend.mock.calls[0]
      const argColor = callArgs[0] as Color32
      const rgba = unpackColor(argColor)

      expect(rgba).toEqual({ r: 255, g: 255, b: 255, a: 128 })
    })
  })

  describe('Grid Checks', () => {
    const DW = 10
    const DH = 10

    it('accurately maps every pixel in a complex clipped fill', () => {
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

      for (let dy = 0; dy < DH; dy++) {
        for (let dx = 0; dx < DW; dx++) {
          const isInside = dx >= targetX &&
            dx < targetX + drawW &&
            dy >= targetY &&
            dy < targetY + drawH

          if (isInside) {
            expect(dst.data32[dy * DW + dx]).toBe(RED)
          } else {
            expect(dst.data32[dy * DW + dx]).toBe(BLUE)
          }
        }
      }
    })

    it('verifies multi-row mask alignment across every pixel', () => {
      const dst = makeTestPixelData(5, 5, 0)
      const mask = new Uint8Array(25) as BinaryMask
      for (let i = 0; i < 25; i++) {
        mask[i] = i % 2 === 0
          ? 1
          : 0
      }

      blendColorPixelData(dst, RED, {
        mask,
        maskType: MaskType.BINARY,
        blendFn: copyBlend,
      })

      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const mIdx = y * 5 + x
          if (mask[mIdx] === 1) {
            expect(dst.data32[y * 5 + x]).toBe(RED)
          } else {
            expect(dst.data32[y * 5 + x]).toBe(0)
          }
        }
      }
    })
  })

  describe('Extended Coverage & Edge Cases', () => {
    it('prevents memory wrap-around when width exceeds destination', () => {
      const dst = makeTestPixelData(3, 3, BLUE)

      blendColorPixelData(dst, RED, {
        x: 1,
        y: 1,
        w: 10,
        h: 1,
        blendFn: copyBlend,
      })

      expect(dst.data32[4]).toBe(RED)
      expect(dst.data32[5]).toBe(RED)
      expect(dst.data32[6]).toBe(BLUE)
    })

    it('respects my and mx offsets even when clipping occurs', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const mask = new Uint8Array([0, 0, 0, 1]) as BinaryMask

      blendColorPixelData(dst, RED, {
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        mask,
        mw: 2,
        mx: 1,
        my: 1,
        maskType: MaskType.BINARY,
        blendFn: (s) => s,
      })

      expect(dst.data32[0]).toBe(RED)
    })

    it('accurately inverts AlphaMask values', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const mask = new Uint8Array([255]) as AlphaMask

      blendColorPixelData(dst, RED, {
        mask,
        maskType: MaskType.ALPHA,
        invertMask: true,
        blendFn: copyBlend,
      })

      expect(dst.data32[0]).toBe(BLUE)
    })

    it('hits the (effectiveM === 255) branch for raw color data', () => {
      const dst = makeTestPixelData(1, 1, TRANSPARENT)
      const mask = new Uint8Array([255]) as AlphaMask
      const partialAlpha = 120

      blendColorPixelData(dst, RED, {
        mask,
        maskType: MaskType.ALPHA,
        alpha: partialAlpha,
      })

      const resultAlpha = unpackAlpha(dst.data32[0] as Color32)
      expect(resultAlpha).toBe(120)
    })

    it('covers the inverse identity branch where globalAlpha is 255', () => {
      const dst = makeTestPixelData(1, 1, TRANSPARENT)
      const mask = new Uint8Array([120]) as AlphaMask

      blendColorPixelData(dst, RED, {
        mask,
        maskType: MaskType.ALPHA,
        alpha: 255,
      })

      const resultAlpha = unpackAlpha(dst.data32[0] as Color32)
      expect(resultAlpha).toBe(120)
    })
  })
})
