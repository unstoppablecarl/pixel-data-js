import type { Color32, MutablePixelData, PixelData } from '@/index'
import { cropPixelData } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData, pack } from '../_helpers'

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

  describe('out argument', () => {
    const O = pack(0, 0, 0, 0)
    const A = pack(255, 0, 0, 255)
    const B = pack(0, 255, 0, 255)
    const C = pack(0, 0, 255, 255)
    const D = pack(255, 255, 0, 255)

    function makeMutablePixelData(pixels: Color32[][]): MutablePixelData {
      const h = pixels.length
      const w = pixels[0].length
      const imageData = new ImageData(w, h)
      const view32 = new Uint32Array(imageData.data.buffer)

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          view32[y * w + x] = pixels[y][x]
        }
      }

      return { data: view32, imageData, w, h } as MutablePixelData
    }

    it('writes into the out object when provided', () => {
      const src = makeTestPixelData(4, 4, [
        O, O, O, O,
        O, A, B, O,
        O, C, D, O,
        O, O, O, O,
      ])

      const out = {} as any
      const result = cropPixelData(src, 1, 1, 2, 2, out)

      expect(out).toMatchPixelGrid([
        A, B,
        C, D
      ])
      expect(result).toBe(out)
    })

    it('returns the out object reference', () => {
      const src = makeMutablePixelData([
        [A, B],
        [C, D],
      ])
      const out = makeMutablePixelData([[O, O], [O, O]])
      const result = cropPixelData(src, 0, 0, 2, 2, out)
      expect(result).toBe(out)
    })

    it('does not return out reference when out is not provided', () => {
      const src = makeMutablePixelData([
        [A, B],
        [C, D],
      ])
      const out = makeMutablePixelData([[O, O], [O, O]])
      const result = cropPixelData(src, 0, 0, 2, 2)
      expect(result).not.toBe(out)
    })

    it('mutates w and h on the out object', () => {
      const src = makeMutablePixelData([
        [O, O, O, O, O],
        [O, A, B, C, O],
        [O, D, A, B, O],
        [O, O, O, O, O],
      ])
      const out = makeMutablePixelData([[O, O], [O, O]])
      cropPixelData(src, 1, 1, 3, 2, out)
      expect(out.w).toBe(3)
      expect(out.h).toBe(2)
    })

    it('mutates imageData dimensions on the out object', () => {
      const src = makeMutablePixelData([
        [O, O, O, O, O],
        [O, A, B, C, O],
        [O, O, O, O, O],
      ])
      const out = makeMutablePixelData([[O, O], [O, O]])
      cropPixelData(src, 1, 1, 3, 1, out)
      expect(out.imageData.width).toBe(3)
      expect(out.imageData.height).toBe(1)
    })

    it('does not mutate the src when out is provided', () => {
      const src = makeMutablePixelData([
        [O, O, O, O],
        [O, A, B, O],
        [O, C, D, O],
        [O, O, O, O],
      ])
      const originalW = src.w
      const originalH = src.h
      const originalData = Array.from(src.data)
      const out = makeMutablePixelData([[O, O], [O, O]])

      cropPixelData(src, 1, 1, 2, 2, out)

      expect(src.w).toBe(originalW)
      expect(src.h).toBe(originalH)
      expect(Array.from(src.data)).toEqual(originalData)
    })

    it('out object with trimmed bounds receives trimmed result', () => {
      const src = makeMutablePixelData([
        [A, B, C],
        [D, A, B],
        [C, D, A],
      ])
      const out = makeMutablePixelData([[O, O], [O, O]])

      // crop overhangs right and bottom
      cropPixelData(src, 1, 1, 10, 10, out)

      expect(out.w).toBe(2)
      expect(out.h).toBe(2)
      expect(pixelAt(out, 0, 0)).toBe(pixelAt(src, 0, 0)) // A
      expect(pixelAt(out, 1, 0)).toBe(pixelAt(src, 1, 0)) // B
      expect(pixelAt(out, 0, 1)).toBe(pixelAt(src, 0, 1)) // D
      expect(pixelAt(out, 1, 1)).toBe(pixelAt(src, 1, 1)) // A
    })

    it('throws with out provided when crop does not overlap', () => {
      const src = makeMutablePixelData([
        [A, B],
        [C, D],
      ])
      const out = makeMutablePixelData([[O, O], [O, O]])
      expect(() => cropPixelData(src, 5, 5, 2, 2, out)).toThrow()
    })

    it('does not mutate out when crop throws', () => {
      const src = makeMutablePixelData([
        [A, B],
        [C, D],
      ])
      const out = makeMutablePixelData([[O, O], [O, O]])
      const originalW = out.w
      const originalH = out.h
      const originalData = Array.from(out.data)

      expect(() => cropPixelData(src, 5, 5, 2, 2, out)).toThrow()

      expect(out.w).toBe(originalW)
      expect(out.h).toBe(originalH)
      expect(Array.from(out.data)).toEqual(originalData)
    })
  })
})
