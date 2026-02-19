import { describe, expect, it } from 'vitest'
import type { Color32 } from '../../src'
import { fillPixelData } from '../../src/PixelData/fillPixelData'
import { getPixel, makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)

describe('fillPixelData', () => {
  describe('Guard Conditions & Early Exits', () => {
    it('skips all work for out-of-bounds targets', () => {
      const dst = makeTestPixelData(1, 1, BLUE)

      fillPixelData(dst, RED, {
        x: 10,
        y: 10,
      })

      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Coordinate Clipping Logic', () => {
    it('handles negative x, y offsets', () => {
      const dst = makeTestPixelData(2, 2, BLUE)

      // Negative offset: fill a 2x2 starting at -1,-1
      // Only dst[0,0] is covered
      fillPixelData(dst, RED, {
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

      fillPixelData(dst, RED, {
        x: 1,
        y: 1,
        w: 10,
        h: 10,
      })

      expect(dst.data32[3]).toBe(RED)
      expect(dst.data32[0]).toBe(BLUE)
    })

    it('covers clipping width from the left (x < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)

      fillPixelData(dst, RED, {
        x: -1,
        y: 0,
        w: 2,
        h: 2,
      })

      // dst[0,0] and dst[0,1] (left column) should be RED
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[2]).toBe(RED)
      // Right column remains BLUE
      expect(dst.data32[1]).toBe(BLUE)
    })

    it('covers clipping height from the top (y < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)

      fillPixelData(dst, RED, {
        x: 0,
        y: -1,
        w: 2,
        h: 2,
      })

      // dst[0,0] and dst[1,0] (top row) should be RED
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(RED)
      // Bottom row remains BLUE
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

      fillPixelData(dst, RED, {
        x: targetX,
        y: targetY,
        w: drawW,
        h: drawH,
      })

      for (let dy = 0; dy < DH; dy++) {
        for (let dx = 0; dx < DW; dx++) {
          const isInside = dx >= targetX && dx < targetX + drawW &&
            dy >= targetY && dy < targetY + drawH

          const idx = dy * DW + dx
          if (isInside) {
            expect(dst.data32[idx]).toBe(RED)
          } else {
            expect(dst.data32[idx]).toBe(BLUE)
          }
        }
      }
    })

    it('prevents memory wrap-around when width exceeds destination', () => {
      const dst = makeTestPixelData(3, 3, BLUE)

      fillPixelData(dst, RED, {
        x: 1,
        y: 1,
        w: 10,
        h: 1,
      })

      // Row 1: (1,1) and (2,1) should be RED
      expect(dst.data32[4]).toBe(RED)
      expect(dst.data32[5]).toBe(RED)

      // Row 2: (0,2) should still be BLUE.
      // This confirms we didn't fill past the row end.
      expect(dst.data32[6]).toBe(BLUE)
    })

    it('performs a total fill optimization correctly', () => {
      const dst = makeTestPixelData(5, 5, BLUE)

      fillPixelData(dst, RED, {
        x: 0,
        y: 0,
        w: 5,
        h: 5,
      })

      const allRed = Array.from(dst.data32).every((val) => val === RED)
      expect(allRed).toBe(true)
    })
  })

  describe('fillPixelData overloads', () => {

    it('should fill using discrete coordinates', () => {
      const color = 0xFF0000FF as Color32
      const dst = makeTestPixelData(100, 100)
      fillPixelData(
        dst,
        color,
        10,
        10,
        20,
        20,
      )

      // Check a pixel inside the range
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

      fillPixelData(dst, color, rect)

      expect(getPixel(dst, 10, 10)).toBe(color)
    })

    it('should fill the entire buffer when no rect is provided', () => {
      const color = 0x0000FFFF as Color32
      const dst = makeTestPixelData(100, 100)
      fillPixelData(dst, color)

      expect(getPixel(dst, 0, 0)).toBe(color)

      expect(getPixel(dst, 99, 99)).toBe(color)
    })
  })
})
