import type { Color32, Rect } from '@/index'
import { fillPixelData } from '@/index'
import { describe, expect, it } from 'vitest'
import { getPixel, makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)

describe('fillPixelData', () => {
  describe('Guard Conditions & Early Exits', () => {
    it('skips all work for out-of-bounds targets', () => {
      const dst = makeTestPixelData(1, 1, BLUE)

      const result = fillPixelData(dst, RED, {
        x: 10,
        y: 10,
      })

      expect(result).toBe(false)
      expect(dst.data[0]).toBe(BLUE)
    })
  })

  describe('Coordinate Clipping Logic', () => {
    it('handles negative x, y offsets', () => {
      const dst = makeTestPixelData(2, 2, BLUE)

      const result = fillPixelData(dst, RED, {
        x: -1,
        y: -1,
        w: 2,
        h: 2,
      })

      expect(result).toBe(true)
      expect(dst.data[0]).toBe(RED)
      expect(dst.data[3]).toBe(BLUE)
    })

    it('clips w/h when fill exceeds destination bounds', () => {
      const dst = makeTestPixelData(2, 2, BLUE)

      const result = fillPixelData(dst, RED, {
        x: 1,
        y: 1,
        w: 10,
        h: 10,
      })

      expect(result).toBe(true)
      expect(dst.data[3]).toBe(RED)
      expect(dst.data[0]).toBe(BLUE)
    })

    it('covers clipping width from the left (x < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)

      const result = fillPixelData(dst, RED, {
        x: -1,
        y: 0,
        w: 2,
        h: 2,
      })

      expect(result).toBe(true)
      expect(dst.data[0]).toBe(RED)
      expect(dst.data[2]).toBe(RED)
      expect(dst.data[1]).toBe(BLUE)
    })

    it('covers clipping height from the top (y < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)

      const result = fillPixelData(dst, RED, {
        x: 0,
        y: -1,
        w: 2,
        h: 2,
      })

      expect(result).toBe(true)
      expect(dst.data[0]).toBe(RED)
      expect(dst.data[1]).toBe(RED)
      expect(dst.data[2]).toBe(BLUE)
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

      const result = fillPixelData(dst, RED, {
        x: targetX,
        y: targetY,
        w: drawW,
        h: drawH,
      })

      expect(result).toBe(true)
      for (let dy = 0; dy < DH; dy++) {
        for (let dx = 0; dx < DW; dx++) {
          const isInside = dx >= targetX && dx < targetX + drawW &&
            dy >= targetY && dy < targetY + drawH

          const idx = dy * DW + dx
          if (isInside) {
            expect(dst.data[idx]).toBe(RED)
          } else {
            expect(dst.data[idx]).toBe(BLUE)
          }
        }
      }
    })

    it('prevents memory wrap-around when width exceeds destination', () => {
      const dst = makeTestPixelData(3, 3, BLUE)

      const result = fillPixelData(dst, RED, {
        x: 1,
        y: 1,
        w: 10,
        h: 1,
      })

      expect(result).toBe(true)
      expect(dst.data[4]).toBe(RED)
      expect(dst.data[5]).toBe(RED)
      expect(dst.data[6]).toBe(BLUE)
    })

    it('performs a total fill optimization correctly', () => {
      const dst = makeTestPixelData(5, 5, BLUE)

      const result = fillPixelData(dst, RED, {
        x: 0,
        y: 0,
        w: 5,
        h: 5,
      })

      expect(result).toBe(true)
      const allRed = Array.from(dst.data).every((val) => val === RED)
      expect(allRed).toBe(true)
    })
  })

  describe('fillPixelData overloads', () => {
    it('should fill using discrete coordinates', () => {
      const color = 0xFF0000FF as Color32
      const dst = makeTestPixelData(100, 100)
      const result = fillPixelData(
        dst,
        color,
        10,
        10,
        20,
        20,
      )

      expect(result).toBe(true)
      expect(getPixel(dst, 15, 15)).toBe(color)
    })

    it('should fill using a Rect object', () => {
      const color = 0x00FF00FF as Color32
      const dst = makeTestPixelData(100, 100)
      const rect = {
        x: 5,
        y: 5,
        w: 10,
        h: 10,
      }

      const result = fillPixelData(dst, color, rect)

      expect(result).toBe(true)
      expect(getPixel(dst, 10, 10)).toBe(color)
    })

    it('should fill the entire buffer when no rect is provided', () => {
      const color = 0x0000FFFF as Color32
      const dst = makeTestPixelData(100, 100)
      const result = fillPixelData(dst, color)

      expect(result).toBe(true)
      expect(getPixel(dst, 0, 0)).toBe(color)
      expect(getPixel(dst, 99, 99)).toBe(color)
    })
  })

  it('should default x and y to 0 when passing a partial Rect', () => {
    const color = 0xFFFFFFFF as Color32
    const dst = makeTestPixelData(100, 100)

    const partialRect: Partial<Rect> = {
      w: 10,
      h: 10,
    }

    const result = fillPixelData(dst, color, partialRect)

    expect(result).toBe(true)
    const pixelAtOrigin = getPixel(dst, 0, 0)
    expect(pixelAtOrigin).toBe(color)

    const pixelOutside = getPixel(dst, 11, 11)
    expect(pixelOutside).not.toBe(color)
  })

  describe('Change Detection', () => {
    it('returns false when no pixels are changed (already match)', () => {
      const dst = makeTestPixelData(2, 2, RED)

      const result = fillPixelData(dst, RED, {
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      })

      expect(result).toBe(false)
    })
  })
})
