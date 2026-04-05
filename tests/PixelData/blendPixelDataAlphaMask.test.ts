import { blendPixelDataAlphaMask, type Color32, makePixelData, sourceOverFast, unpackAlpha, unpackColor } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import {
  createTestImageData,
  expectPixelToMatch,
  makeTestAlphaMask,
  makeTestPixelData,
  pack,
  unpack,
} from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const WHITE = pack(255, 255, 255, 255)
const TRANSPARENT = pack(0, 0, 0, 0)

const copyBlend = (s: Color32) => s

describe('blendPixelDataAlphaMask', () => {
  describe('Guard Conditions & Early Exits', () => {
    it('skips all work for invalid globalAlpha or out-of-bounds targets', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, RED)
      const mask = makeTestAlphaMask(dst.width, dst.height, 255)

      const r1 = blendPixelDataAlphaMask(dst, src, mask, { alpha: 0 })
      const r2 = blendPixelDataAlphaMask(dst, src, mask, { x: 10, y: 10 })

      expect(r1).toBe(false)
      expect(r2).toBe(false)
      expect(dst.data32[0]).toBe(BLUE)
    })

    it('bypasses blendFn for transparent source pixels', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, TRANSPARENT)
      const mockBlend = vi.fn(sourceOverFast)
      const mask = makeTestAlphaMask(dst.width, dst.height, 255)

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        blendFn: mockBlend,
      })

      expect(result).toBe(false)
      expect(mockBlend).not.toHaveBeenCalled()
    })
  })

  describe('Masking Logic (Binary & Alpha)', () => {
    it('handles AlphaMask skip/pass and inversion', () => {
      const dst = makeTestPixelData(4, 1, BLUE)
      const src = makeTestPixelData(4, 1, RED)
      const mask = makeTestAlphaMask(2, 2, [255, 0, 255, 0])

      const r1 = blendPixelDataAlphaMask(dst, src, mask, {})
      expect(r1).toBe(true)
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(BLUE)

      const r2 = blendPixelDataAlphaMask(dst, src, mask, { invertMask: true })
      expect(r2).toBe(true)
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(RED) // ← note: original expect was wrong — now both RED after invert
    })

    it('scales AlphaMask and handles bit-perfect pass-through', () => {
      const dst = makeTestPixelData(3, 1, BLUE)
      const src = makeTestPixelData(3, 1, WHITE)
      const mask = makeTestAlphaMask(3, 1, [0, 128, 255])

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        blendFn: copyBlend,
      })

      expect(result).toBe(true)
      const d32 = dst.data32
      expect(d32[0]).toBe(BLUE)
      expect((d32[1] >>> 24) & 0xff).toBe(128)
      expect(d32[2]).toBe(WHITE)
    })

    it('aligns mask using dx/dy and custom pitch', () => {
      const dst = makeTestPixelData(10, 10, BLUE)
      const src = makeTestPixelData(2, 2, RED)
      const mask = makeTestAlphaMask(4, 4)

      mask.data[10] = 255

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        x: 5,
        y: 5,
        w: 1,
        h: 1,
        mx: 2,
        my: 2,
      })
      expect(result).toBe(true)
      expect(unpack(dst.data32[55])).toEqual(unpack(RED))
    })

    it('covers the weight === 0 branch inside the mask block', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, RED)
      const mask = makeTestAlphaMask(1, 1, 1)

      const mockBlend = vi.fn(sourceOverFast)

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        alpha: 100,
        blendFn: mockBlend,
      })

      expect(result).toBe(false)
      expect(mockBlend).not.toHaveBeenCalled()
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Coordinate Clipping Logic', () => {
    it('handles negative x, y offsets', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(2, 2, RED)
      const mask = makeTestAlphaMask(dst.width, dst.height, 255)

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        x: -1,
        y: -1,
        w: 2,
        h: 2,
      })

      expect(result).toBe(true)
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[3]).toBe(BLUE)
    })

    it('covers clipping height from the top (y < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(2, 2, RED)
      const mask = makeTestAlphaMask(dst.width, dst.height, 255)

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        x: 0,
        y: -1,
        w: 2,
        h: 2,
      })

      expect(result).toBe(true)
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[2]).toBe(BLUE)
    })

    it('covers clipping from the right/bottom edge', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(5, 5, RED)
      const mask = makeTestAlphaMask(dst.width, dst.height, 255)

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        x: 1,
        y: 1,
        w: 10,
        h: 10,
      })

      expect(result).toBe(true)
      expect(dst.data32[3]).toBe(RED)
      expect(dst.data32[0]).toBe(BLUE)
    })

    it('handles complex cross-clipping (negative x, sx, y, sy)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(2, 2, RED)
      const mask = makeTestAlphaMask(5, 5, 255)

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        x: -1,
        y: -1,
        sx: -1,
        sy: -1,
      })

      expect(result).toBe(true)
      expect(unpack(dst.data32[0])).toEqual(unpack(RED))
      expect(dst.data32[3]).toBe(BLUE)
    })
  })

  describe('Precision & Re-packing', () => {
    it('prevents alpha bleed and handles weight rounding skips', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, pack(255, 0, 0, 1))
      const mockBlend = vi.fn(copyBlend)
      const mask = makeTestAlphaMask(5, 5, 255)

      const r1 = blendPixelDataAlphaMask(dst, src, mask, {
        alpha: 100,
        blendFn: mockBlend,
      })
      expect(r1).toBe(false)
      expect(mockBlend).not.toHaveBeenCalled()

      const src2 = makeTestPixelData(1, 1, WHITE)
      const r2 = blendPixelDataAlphaMask(dst, src2, mask, {
        alpha: 128,
        blendFn: mockBlend,
      })
      expect(r2).toBe(true)
      const callArgs = mockBlend.mock.calls[0]
      const argColor = callArgs[0] as Color32
      const rgba = unpackColor(argColor)

      expect(rgba).toEqual({ r: 255, g: 255, b: 255, a: 128 })
    })
  })

  describe('Grid Checks', () => {
    const DW = 10
    const DH = 10
    const SW = 5
    const SH = 5

    it('accurately maps every pixel in a complex clipped blit', () => {
      const dst = makeTestPixelData(DW, DH, BLUE)
      const src = makePixelData(createTestImageData(SW, SH))

      const targetX = 2
      const targetY = 2
      const sourceX = 1
      const sourceY = 1
      const drawW = 3
      const drawH = 3
      const mask = makeTestAlphaMask(5, 5, 255)

      const result = blendPixelDataAlphaMask(dst, src as any, mask, {
        x: targetX,
        y: targetY,
        sx: sourceX,
        sy: sourceY,
        w: drawW,
        h: drawH,
        blendFn: copyBlend,
      })

      expect(result).toBe(true)
      for (let dy = 0; dy < DH; dy++) {
        for (let dx = 0; dx < DW; dx++) {
          const isInsideX = dx >= targetX && dx < targetX + drawW
          const isInsideY = dy >= targetY && dy < targetY + drawH

          if (isInsideX && isInsideY) {
            const expectedSrcX = sourceX + (dx - targetX)
            const expectedSrcY = sourceY + (dy - targetY)

            expectPixelToMatch(dst.imageData, dx, dy, expectedSrcX, expectedSrcY)
          } else {
            expect(dst.data32[dy * DW + dx]).toBe(BLUE)
          }
        }
      }
    })

    it('verifies multi-row mask alignment across every pixel', () => {
      const dst = makeTestPixelData(5, 5, 0)
      const src = makePixelData(createTestImageData(5, 5))

      const mask = makeTestAlphaMask(5, 5)

      for (let i = 0; i < 25; i++) {
        mask.data[i] = i % 2 === 0 ? 255 : 0
      }

      const result = blendPixelDataAlphaMask(dst, src as any, mask, {
        blendFn: copyBlend,
      })

      expect(result).toBe(true)
      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const mIdx = y * 5 + x
          if (mask.data[mIdx] === 255) {
            expectPixelToMatch(dst.imageData, x, y, x, y)
          } else {
            expect(dst.imageData.data[(y * 5 + x) * 4 + 3]).toBe(0)
          }
        }
      }
    })
  })

  describe('Extended Coverage & Edge Cases', () => {
    it('prevents memory wrap-around when width exceeds destination', () => {
      const dst = makeTestPixelData(5, 5, BLUE)
      const src = makeTestPixelData(2, 2, RED)

      const mask = makeTestAlphaMask(dst.width, dst.height, 255)

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        x: 0,
        y: 0,
        w: 5,
        h: 5,
        blendFn: (s) => s,
      })

      expect(result).toBe(true)
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(RED)
      expect(dst.data32[2]).toBe(BLUE)
    })

    it('respects my and mx offsets even when clipping occurs', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(2, 2)
      src.data32[3] = RED
      const mask = makeTestAlphaMask(2, 2, [0, 0, 0, 255])

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        x: -1,
        y: -1,
        w: 2,
        h: 2,
        blendFn: (s) => s,
      })

      expect(result).toBe(true)
      expect(dst.data32[0]).toBe(RED)
    })

    it('accurately inverts AlphaMask values', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, RED)
      const mask = makeTestAlphaMask(1, 1, [255])

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        invertMask: true,
        blendFn: copyBlend,
      })

      expect(result).toBe(false)
      expect(dst.data32[0]).toBe(BLUE)
    })

    it('hits the (effectiveM === 255) branch for raw color data', () => {
      const src = makeTestPixelData(1, 1, RED)
      const transparent = pack(0, 0, 0, 0)
      const dst = makeTestPixelData(1, 1, transparent)
      const mask = makeTestAlphaMask(1, 1, [255])
      const partialAlpha = 120

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        alpha: partialAlpha,
        blendFn: sourceOverFast,
      })

      expect(result).toBe(true)
      expect((dst.data32[0] >>> 24) & 0xff).toBe(119)
    })

    it('covers the inverse identity branch where globalAlpha is 255', () => {
      const src = makeTestPixelData(1, 1, RED)
      const transparent = pack(0, 0, 0, 0)
      const dst = makeTestPixelData(1, 1, transparent)
      const mask = makeTestAlphaMask(1, 1, 120)

      const result = blendPixelDataAlphaMask(dst, src, mask, {
        alpha: 255,
      })

      expect(result).toBe(true)
      const resultAlpha = unpackAlpha(dst.data32[0] as Color32)
      expect(resultAlpha).toBe(120)
    })
  })
})
