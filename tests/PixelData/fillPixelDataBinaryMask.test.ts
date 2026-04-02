import type { Color32 } from '@/index'
import { fillPixelDataBinaryMask, makeBinaryMask } from '@/index'
import { describe, expect, it } from 'vitest'
import { getPixel, makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const COLOR = pack(255, 255, 255, 255)

describe('fillPixelDataBinaryMask', () => {
  describe('Guard Conditions & Early Exits', () => {
    it('skips all work for out-of-bounds targets', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const mask = makeBinaryMask(2, 2)

      const result = fillPixelDataBinaryMask(
        dst,
        RED,
        mask,
        255,
        10,
        10,
      )

      expect(result).toBe(false)
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Coordinate Clipping Logic', () => {
    it('handles negative x, y offsets', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const mask = makeBinaryMask(2, 2)
      mask.data.fill(1)

      const result = fillPixelDataBinaryMask(
        dst,
        RED,
        mask,
        255,
        -1,
        -1,
      )

      expect(result).toBe(true)
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[3]).toBe(BLUE)
    })

    it('clips bounds when mask exceeds destination bounds', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const mask = makeBinaryMask(10, 10)
      mask.data.fill(1)

      const result = fillPixelDataBinaryMask(
        dst,
        RED,
        mask,
        255,
        1,
        1,
      )

      expect(result).toBe(true)
      expect(dst.data32[3]).toBe(RED)
      expect(dst.data32[0]).toBe(BLUE)
    })

    it('covers clipping width from the left (x < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const mask = makeBinaryMask(2, 2)
      mask.data.fill(1)

      const result = fillPixelDataBinaryMask(
        dst,
        RED,
        mask,
        255,
        -1,
        0,
      )

      expect(result).toBe(true)
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[2]).toBe(RED)
      expect(dst.data32[1]).toBe(BLUE)
    })

    it('covers clipping height from the top (y < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const mask = makeBinaryMask(2, 2)
      mask.data.fill(1)

      const result = fillPixelDataBinaryMask(
        dst,
        RED,
        mask,
        255,
        0,
        -1,
      )

      expect(result).toBe(true)
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(RED)
      expect(dst.data32[2]).toBe(BLUE)
    })
  })

  describe('Grid Checks & Accuracy', () => {
    const DW = 10
    const DH = 10

    it('accurately fills every pixel in a complex clipped region', () => {
      const dst = makeTestPixelData(DW, DH, BLUE)
      const targetX = 2
      const targetY = 3
      const drawW = 5
      const drawH = 4
      const mask = makeBinaryMask(drawW, drawH)
      mask.data.fill(1)

      const result = fillPixelDataBinaryMask(
        dst,
        RED,
        mask,
        255,
        targetX,
        targetY,
      )

      expect(result).toBe(true)
      for (let dy = 0; dy < DH; dy++) {
        for (let dx = 0; dx < DW; dx++) {
          const isInside = dx >= targetX && dx < targetX + drawW && dy >= targetY && dy < targetY + drawH
          const idx = dy * DW + dx

          if (isInside) {
            expect(dst.data32[idx]).toBe(RED)
          } else {
            expect(dst.data32[idx]).toBe(BLUE)
          }
        }
      }
    })

    it('prevents memory wrap-around when mask width exceeds destination', () => {
      const dst = makeTestPixelData(3, 3, BLUE)
      const mask = makeBinaryMask(10, 1)
      mask.data.fill(1)

      const result = fillPixelDataBinaryMask(
        dst,
        RED,
        mask,
        255,
        1,
        1,
      )

      expect(result).toBe(true)
      expect(dst.data32[4]).toBe(RED)
      expect(dst.data32[5]).toBe(RED)
      expect(dst.data32[6]).toBe(BLUE)
    })

    it('performs a total fill correctly', () => {
      const dst = makeTestPixelData(5, 5, BLUE)
      const mask = makeBinaryMask(5, 5)
      mask.data.fill(1)

      const result = fillPixelDataBinaryMask(
        dst,
        RED,
        mask,
        255,
        0,
        0,
      )

      expect(result).toBe(true)
      const allRed = Array.from(dst.data32).every((val) => val === RED)
      expect(allRed).toBe(true)
    })
  })

  describe('API Defaults', () => {
    it('should default x and y to 0 when not provided', () => {
      const color = 0xFFFFFFFF as Color32
      const dst = makeTestPixelData(100, 100)
      const mask = makeBinaryMask(100, 100)
      mask.data.fill(1)

      const result = fillPixelDataBinaryMask(dst, color, mask)

      expect(result).toBe(true)
      const pixelAtOrigin = getPixel(dst, 0, 0)
      const pixelAtEnd = getPixel(dst, 99, 99)

      expect(pixelAtOrigin).toBe(color)
      expect(pixelAtEnd).toBe(color)
    })
  })

  describe('Mask Alignment', () => {
    it('handles masking alignment correctly', () => {
      const dst = makeTestPixelData(5, 5)
      const mask = makeBinaryMask(3, 3)

      mask.data.set([
        1, 1, 1,
        1, 0, 1,
        1, 1, 0,
      ])

      const result = fillPixelDataBinaryMask(
        dst,
        COLOR,
        mask,
        255,
        1,
        1,
      )

      const C = COLOR
      expect(result).toBe(true)
      expect(Array.from(dst.data32)).toEqual([
        0, 0, 0, 0, 0,
        0, C, C, C, 0,
        0, C, 0, C, 0,
        0, C, C, 0, 0,
        0, 0, 0, 0, 0,
      ])
    })

    it('handles masking negative alignment correctly', () => {
      const dst = makeTestPixelData(5, 5)
      const mask = makeBinaryMask(3, 3)

      mask.data.set([
        1, 1, 1,
        1, 0, 1,
        1, 1, 0,
      ])

      const result = fillPixelDataBinaryMask(
        dst,
        COLOR,
        mask,
        255,
        -1,
        -1,
      )

      const C = COLOR
      expect(result).toBe(true)
      expect(Array.from(dst.data32)).toEqual([
        0, C, 0, 0, 0,
        C, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
      ])
    })
  })

  describe('Alpha Blending', () => {
    it('skips all work when alpha is 0', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const mask = makeBinaryMask(1, 1)
      mask.data.fill(1)

      const result = fillPixelDataBinaryMask(
        dst,
        RED,
        mask,
        0,
        0,
        0,
      )

      expect(result).toBe(false)
      expect(dst.data32[0]).toBe(BLUE)
    })

    it('applies reduced alpha to the output color', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const mask = makeBinaryMask(1, 1)
      mask.data.fill(1)

      const expectedRedWithAlpha = pack(255, 0, 0, 128)

      const result = fillPixelDataBinaryMask(
        dst,
        RED,
        mask,
        128,
        0,
        0,
      )

      expect(result).toBe(true)
      expect(dst.data32[0]).toBe(expectedRedWithAlpha)
    })
  })

  it('returns false when no pixels are changed (already match)', () => {
    const dst = makeTestPixelData(2, 2, RED)
    const mask = makeBinaryMask(2, 2)
    mask.data.fill(1)

    const result = fillPixelDataBinaryMask(dst, RED, mask)

    expect(result).toBe(false)
  })
})
