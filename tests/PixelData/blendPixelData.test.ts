import { blendPixelData, type Color32, makePixelData, sourceOverFast, unpackColor } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { createTestImageData, expectPixelToMatch, makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const WHITE = pack(255, 255, 255, 255)
const TRANSPARENT = pack(0, 0, 0, 0)

const copyBlend = (s: Color32) => s

describe('blendPixelData', () => {
  describe('Guard Conditions & Early Exits', () => {
    it('skips all work for invalid globalAlpha or out-of-bounds targets', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, RED)

      const result1 = blendPixelData(dst, src, { alpha: 0 })
      const result2 = blendPixelData(dst, src, {
        x: 10,
        y: 10,
      })

      expect(result1).toBe(false)
      expect(result2).toBe(false)
      expect(dst.data[0]).toBe(BLUE)
    })

    it('bypasses blendFn for transparent source pixels', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, TRANSPARENT)
      const mockBlend = vi.fn(sourceOverFast)

      const result = blendPixelData(dst, src, { blendFn: mockBlend })

      expect(result).toBe(false)
      expect(mockBlend).not.toHaveBeenCalled()
    })
  })

  describe('Coordinate Clipping Logic', () => {
    it('handles negative x, y offsets', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(2, 2, RED)

      const result = blendPixelData(dst, src, {
        x: -1,
        y: -1,
        w: 2,
        h: 2,
      })

      expect(result).toBe(true)
      expect(dst.data[0]).toBe(RED)
      expect(dst.data[3]).toBe(BLUE)
    })

    it('covers clipping height from the top (y < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(2, 2, RED)

      const result = blendPixelData(dst, src, {
        x: 0,
        y: -1,
        w: 2,
        h: 2,
      })

      expect(result).toBe(true)
      expect(dst.data[0]).toBe(RED)
      expect(dst.data[2]).toBe(BLUE)
    })

    it('covers clipping from the right/bottom edge', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(5, 5, RED)

      const result = blendPixelData(dst, src, {
        x: 1,
        y: 1,
        w: 10,
        h: 10,
      })

      expect(result).toBe(true)
      expect(dst.data[3]).toBe(RED)
      expect(dst.data[0]).toBe(BLUE)
    })

    it('handles complex cross-clipping (negative x, sx, y, sy)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(2, 2, RED)

      const result = blendPixelData(dst, src, {
        x: -1,
        y: -1,
        sx: -1,
        sy: -1,
      })

      expect(result).toBe(true)
      expect(dst.data[0]).toBe(RED)
      expect(dst.data[3]).toBe(BLUE)
    })
  })

  describe('Precision & Re-packing', () => {
    it('prevents alpha bleed and handles weight rounding skips', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, pack(255, 0, 0, 1))
      const mockBlend = vi.fn(copyBlend)

      const result1 = blendPixelData(dst, src, {
        alpha: 100,
        blendFn: mockBlend,
      })
      expect(result1).toBe(false)
      expect(mockBlend).not.toHaveBeenCalled()

      const src2 = makeTestPixelData(1, 1, WHITE)
      const result2 = blendPixelData(dst, src2, {
        alpha: 128,
        blendFn: mockBlend,
      })

      expect(result2).toBe(true)
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

      const result = blendPixelData(dst, src as any, {
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
          const isInsideX = dx >= targetX &&
            dx < targetX + drawW
          const isInsideY = dy >= targetY &&
            dy < targetY + drawH

          if (isInsideX && isInsideY) {
            const expectedSrcX = sourceX + (dx - targetX)
            const expectedSrcY = sourceY + (dy - targetY)

            expectPixelToMatch(dst.imageData, dx, dy, expectedSrcX, expectedSrcY)
          } else {
            expect(dst.data[dy * DW + dx]).toBe(BLUE)
          }
        }
      }
    })
  })

  describe('Extended Coverage & Edge Cases', () => {
    it('prevents memory wrap-around when width exceeds destination', () => {
      const dst = makeTestPixelData(5, 5, BLUE)
      const src = makeTestPixelData(2, 2, RED)

      const result = blendPixelData(dst, src, {
        x: 0,
        y: 0,
        w: 5,
        h: 5,
        blendFn: (s) => s,
      })

      expect(result).toBe(true)
      expect(dst.data[0]).toBe(RED)
      expect(dst.data[1]).toBe(RED)
      expect(dst.data[2]).toBe(BLUE)
    })
  })
})
