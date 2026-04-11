import type { PixelData } from '@/index'
import { cropPixelData } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData } from '../_helpers'

function pixelAt(pd: PixelData, x: number, y: number): number {
  return pd.data[y * pd.w + x]
}

function srcPixelAt(src: PixelData, x: number, y: number): number {
  return src.data[y * src.w + x]
}

describe('cropPixelData', () => {

  describe('exact crop', () => {
    it('crops a centered region', () => {
      const src = makeTestPixelData(10, 10)
      const result = cropPixelData(src, 2, 3, 4, 4)

      expect(result.w).toBe(4)
      expect(result.h).toBe(4)

      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          expect(pixelAt(result, col, row)).toBe(srcPixelAt(src, 2 + col, 3 + row))
        }
      }
    })

    it('crops the full image', () => {
      const src = makeTestPixelData(5, 5)
      const result = cropPixelData(src, 0, 0, 5, 5)

      expect(result.w).toBe(5)
      expect(result.h).toBe(5)
      expect(Array.from(result.data)).toEqual(Array.from(src.data))
    })

    it('crops a single pixel', () => {
      const src = makeTestPixelData(4, 4)
      const result = cropPixelData(src, 2, 2, 1, 1)

      expect(result.w).toBe(1)
      expect(result.h).toBe(1)
      expect(pixelAt(result, 0, 0)).toBe(srcPixelAt(src, 2, 2))
    })

    it('crops a single row', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 0, 3, 8, 1)

      expect(result.w).toBe(8)
      expect(result.h).toBe(1)
      for (let col = 0; col < 8; col++) {
        expect(pixelAt(result, col, 0)).toBe(srcPixelAt(src, col, 3))
      }
    })

    it('crops a single column', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 3, 0, 1, 8)

      expect(result.w).toBe(1)
      expect(result.h).toBe(8)
      for (let row = 0; row < 8; row++) {
        expect(pixelAt(result, 0, row)).toBe(srcPixelAt(src, 3, row))
      }
    })
  })

  describe('boundary alignment', () => {
    it('crops from top-left corner', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 0, 0, 4, 4)

      expect(result.w).toBe(4)
      expect(result.h).toBe(4)
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          expect(pixelAt(result, col, row)).toBe(srcPixelAt(src, col, row))
        }
      }
    })

    it('crops from top-right corner', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 4, 0, 4, 4)

      expect(result.w).toBe(4)
      expect(result.h).toBe(4)
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          expect(pixelAt(result, col, row)).toBe(srcPixelAt(src, 4 + col, row))
        }
      }
    })

    it('crops from bottom-left corner', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 0, 4, 4, 4)

      expect(result.w).toBe(4)
      expect(result.h).toBe(4)
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          expect(pixelAt(result, col, row)).toBe(srcPixelAt(src, col, 4 + row))
        }
      }
    })

    it('crops from bottom-right corner', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 4, 4, 4, 4)

      expect(result.w).toBe(4)
      expect(result.h).toBe(4)
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          expect(pixelAt(result, col, row)).toBe(srcPixelAt(src, 4 + col, 4 + row))
        }
      }
    })
  })

  describe('bounds trimming', () => {
    it('trims left overflow', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, -2, 0, 6, 8)

      expect(result.w).toBe(4)
      expect(result.h).toBe(8)
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 4; col++) {
          expect(pixelAt(result, col, row)).toBe(srcPixelAt(src, col, row))
        }
      }
    })

    it('trims top overflow', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 0, -2, 8, 6)

      expect(result.w).toBe(8)
      expect(result.h).toBe(4)
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 8; col++) {
          expect(pixelAt(result, col, row)).toBe(srcPixelAt(src, col, row))
        }
      }
    })

    it('trims right overflow', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 5, 0, 6, 8)

      expect(result.w).toBe(3)
      expect(result.h).toBe(8)
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 3; col++) {
          expect(pixelAt(result, col, row)).toBe(srcPixelAt(src, 5 + col, row))
        }
      }
    })

    it('trims bottom overflow', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 0, 5, 8, 6)

      expect(result.w).toBe(8)
      expect(result.h).toBe(3)
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 8; col++) {
          expect(pixelAt(result, col, row)).toBe(srcPixelAt(src, col, 5 + row))
        }
      }
    })

    it('trims all four sides simultaneously', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, -2, -2, 12, 12)

      expect(result.w).toBe(8)
      expect(result.h).toBe(8)
      expect(Array.from(result.data)).toEqual(Array.from(src.data))
    })

    it('trims to a single pixel on left edge', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, -5, 0, 6, 4)

      expect(result.w).toBe(1)
      expect(result.h).toBe(4)
    })

    it('trims to a single pixel on right edge', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 7, 0, 5, 4)

      expect(result.w).toBe(1)
      expect(result.h).toBe(4)
    })
  })

  describe('non-overlap errors', () => {
    it('throws when rect is entirely to the left', () => {
      const src = makeTestPixelData(8, 8)
      expect(() => cropPixelData(src, -5, 0, 4, 8)).toThrow()
    })

    it('throws when rect is entirely to the right', () => {
      const src = makeTestPixelData(8, 8)
      expect(() => cropPixelData(src, 8, 0, 4, 8)).toThrow()
    })

    it('throws when rect is entirely above', () => {
      const src = makeTestPixelData(8, 8)
      expect(() => cropPixelData(src, 0, -5, 8, 4)).toThrow()
    })

    it('throws when rect is entirely below', () => {
      const src = makeTestPixelData(8, 8)
      expect(() => cropPixelData(src, 0, 8, 8, 4)).toThrow()
    })

    it('throws when rect is zero width', () => {
      const src = makeTestPixelData(8, 8)
      expect(() => cropPixelData(src, 0, 0, 0, 8)).toThrow()
    })

    it('throws when rect is zero height', () => {
      const src = makeTestPixelData(8, 8)
      expect(() => cropPixelData(src, 0, 0, 8, 0)).toThrow()
    })

    it('throws on 1x1 source with non-overlapping rect', () => {
      const src = makeTestPixelData(1, 1)
      expect(() => cropPixelData(src, 1, 0, 1, 1)).toThrow()
      expect(() => cropPixelData(src, 0, 1, 1, 1)).toThrow()
    })

    it('touches right edge exactly — does not throw', () => {
      const src = makeTestPixelData(8, 8)
      expect(() => cropPixelData(src, 7, 0, 1, 8)).not.toThrow()
    })

    it('touches bottom edge exactly — does not throw', () => {
      const src = makeTestPixelData(8, 8)
      expect(() => cropPixelData(src, 0, 7, 8, 1)).not.toThrow()
    })
  })

  describe('non-square sources', () => {
    it('handles wide source', () => {
      const src = makeTestPixelData(16, 4)
      const result = cropPixelData(src, 4, 1, 8, 2)

      expect(result.w).toBe(8)
      expect(result.h).toBe(2)
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 8; col++) {
          expect(pixelAt(result, col, row)).toBe(srcPixelAt(src, 4 + col, 1 + row))
        }
      }
    })

    it('handles tall source', () => {
      const src = makeTestPixelData(4, 16)
      const result = cropPixelData(src, 1, 4, 2, 8)

      expect(result.w).toBe(2)
      expect(result.h).toBe(8)
      for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 2; col++) {
          expect(pixelAt(result, col, row)).toBe(srcPixelAt(src, 1 + col, 4 + row))
        }
      }
    })
  })

  describe('return value', () => {
    it('returns a new PixelData — does not mutate source', () => {
      const src = makeTestPixelData(8, 8)
      const originalData = Array.from(src.data)
      cropPixelData(src, 0, 0, 8, 8)
      expect(Array.from(src.data)).toEqual(originalData)
    })

    it('result imageData dimensions match w/h', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 1, 1, 4, 3)
      expect(result.imageData.width).toBe(4)
      expect(result.imageData.height).toBe(3)
      expect(result.w).toBe(4)
      expect(result.h).toBe(3)
    })

    it('result data length matches w * h', () => {
      const src = makeTestPixelData(8, 8)
      const result = cropPixelData(src, 2, 2, 3, 5)
      expect(result.data.length).toBe(3 * 5)
    })
  })
})
