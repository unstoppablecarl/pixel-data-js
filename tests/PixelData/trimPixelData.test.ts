import {
  getPixelDataTransparentTrimmedBounds,
  type PixelData,
  trimTransparentPixelData,
  trimTransparentPixelDataInPlace,
} from '@/index'
import { describe, expect, it } from 'vitest'

// Builds a PixelData32 from a 2D array of [r,g,b,a] tuples
function makePixelData32(pixels: [number, number, number, number][][]): PixelData {
  const h = pixels.length
  const w = pixels[0].length
  const buffer = new Uint32Array(w * h)

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b, a] = pixels[y][x]
      // RGBA little-endian -> stored as 0xAABBGGRR in Uint32
      buffer[y * w + x] = (a << 24) | (b << 16) | (g << 8) | r
    }
  }

  const imageData = new ImageData(w, h)
  new Uint8ClampedArray(imageData.data.buffer).set(new Uint8ClampedArray(buffer.buffer))

  return { data: buffer, imageData, w, h }
}

const O: [number, number, number, number] = [0, 0, 0, 0]       // transparent
const X: [number, number, number, number] = [255, 0, 0, 255]   // opaque red
const P: [number, number, number, number] = [0, 255, 0, 128]   // semi-transparent green

describe('getPixelDataTransparentTrimmedBounds', () => {

  describe('fully transparent', () => {
    it('returns null for a fully transparent image', () => {
      const src = makePixelData32([
        [O, O, O],
        [O, O, O],
        [O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toBeNull()
    })

    it('returns null for a 1x1 transparent pixel', () => {
      const src = makePixelData32([[O]])
      expect(getPixelDataTransparentTrimmedBounds(src)).toBeNull()
    })
  })

  describe('fully opaque', () => {
    it('returns full bounds when all pixels are opaque', () => {
      const src = makePixelData32([
        [X, X, X],
        [X, X, X],
        [X, X, X],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 0, y: 0, w: 3, h: 3 })
    })

    it('returns full bounds for a 1x1 opaque pixel', () => {
      const src = makePixelData32([[X]])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 0, y: 0, w: 1, h: 1 })
    })
  })

  describe('single opaque pixel', () => {
    it('finds a pixel in the top-left corner', () => {
      const src = makePixelData32([
        [X, O, O],
        [O, O, O],
        [O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 0, y: 0, w: 1, h: 1 })
    })

    it('finds a pixel in the top-right corner', () => {
      const src = makePixelData32([
        [O, O, X],
        [O, O, O],
        [O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 2, y: 0, w: 1, h: 1 })
    })

    it('finds a pixel in the bottom-left corner', () => {
      const src = makePixelData32([
        [O, O, O],
        [O, O, O],
        [X, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 0, y: 2, w: 1, h: 1 })
    })

    it('finds a pixel in the bottom-right corner', () => {
      const src = makePixelData32([
        [O, O, O],
        [O, O, O],
        [O, O, X],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 2, y: 2, w: 1, h: 1 })
    })

    it('finds a pixel in the center', () => {
      const src = makePixelData32([
        [O, O, O, O, O],
        [O, O, O, O, O],
        [O, O, X, O, O],
        [O, O, O, O, O],
        [O, O, O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 2, y: 2, w: 1, h: 1 })
    })
  })

  describe('transparent border trimming', () => {
    it('trims transparent left column', () => {
      const src = makePixelData32([
        [O, X, X],
        [O, X, X],
        [O, X, X],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 1, y: 0, w: 2, h: 3 })
    })

    it('trims transparent right column', () => {
      const src = makePixelData32([
        [X, X, O],
        [X, X, O],
        [X, X, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 0, y: 0, w: 2, h: 3 })
    })

    it('trims transparent top row', () => {
      const src = makePixelData32([
        [O, O, O],
        [X, X, X],
        [X, X, X],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 0, y: 1, w: 3, h: 2 })
    })

    it('trims transparent bottom row', () => {
      const src = makePixelData32([
        [X, X, X],
        [X, X, X],
        [O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 0, y: 0, w: 3, h: 2 })
    })

    it('trims all four sides simultaneously', () => {
      const src = makePixelData32([
        [O, O, O, O, O],
        [O, X, X, X, O],
        [O, X, X, X, O],
        [O, X, X, X, O],
        [O, O, O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 1, y: 1, w: 3, h: 3 })
    })

    it('trims multiple transparent rows and columns', () => {
      const src = makePixelData32([
        [O, O, O, O, O],
        [O, O, O, O, O],
        [O, O, X, O, O],
        [O, O, O, O, O],
        [O, O, O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 2, y: 2, w: 1, h: 1 })
    })
  })

  describe('irregular shapes', () => {
    it('returns tight bounds around an L-shape', () => {
      const src = makePixelData32([
        [O, O, O, O, O],
        [O, X, O, O, O],
        [O, X, O, O, O],
        [O, X, X, X, O],
        [O, O, O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 1, y: 1, w: 3, h: 3 })
    })

    it('returns tight bounds around a diagonal', () => {
      const src = makePixelData32([
        [X, O, O, O],
        [O, X, O, O],
        [O, O, X, O],
        [O, O, O, X],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 0, y: 0, w: 4, h: 4 })
    })

    it('handles sparse pixels far apart', () => {
      const src = makePixelData32([
        [X, O, O, O, O],
        [O, O, O, O, O],
        [O, O, O, O, O],
        [O, O, O, O, O],
        [O, O, O, O, X],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 0, y: 0, w: 5, h: 5 })
    })
  })

  describe('semi-transparent pixels', () => {
    it('includes semi-transparent pixels in bounds', () => {
      const src = makePixelData32([
        [O, O, O],
        [O, P, O],
        [O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 1, y: 1, w: 1, h: 1 })
    })

    it('treats alpha=1 as non-transparent', () => {
      const almostTransparent: [number, number, number, number] = [0, 0, 0, 1]
      const src = makePixelData32([
        [O, O, O],
        [O, almostTransparent, O],
        [O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 1, y: 1, w: 1, h: 1 })
    })

    it('treats alpha=0 as transparent even with color data', () => {
      const coloredTransparent: [number, number, number, number] = [255, 128, 64, 0]
      const src = makePixelData32([
        [O, O, O],
        [O, coloredTransparent, O],
        [O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toBeNull()
    })
  })

  describe('non-square sources', () => {
    it('handles a wide image', () => {
      const src = makePixelData32([
        [O, O, O, O, O, O, O, O],
        [O, O, X, X, X, X, O, O],
        [O, O, O, O, O, O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 2, y: 1, w: 4, h: 1 })
    })

    it('handles a tall image', () => {
      const src = makePixelData32([
        [O, O, O],
        [O, O, O],
        [O, X, O],
        [O, X, O],
        [O, X, O],
        [O, O, O],
        [O, O, O],
      ])
      expect(getPixelDataTransparentTrimmedBounds(src)).toEqual({ x: 1, y: 2, w: 1, h: 3 })
    })
  })
})

describe('trimTransparentPixelData', () => {

  describe('throws on fully transparent', () => {
    it('throws for a fully transparent image', () => {
      const src = makePixelData32([
        [O, O, O],
        [O, O, O],
        [O, O, O],
      ])
      expect(() => trimTransparentPixelData(src)).toThrow()
    })

    it('throws for a 1x1 transparent pixel', () => {
      const src = makePixelData32([[O]])
      expect(() => trimTransparentPixelData(src)).toThrow()
    })
  })

  describe('correct output dimensions', () => {
    it('returns full size when no trimming needed', () => {
      const src = makePixelData32([
        [X, X, X],
        [X, X, X],
        [X, X, X],
      ])
      const result = trimTransparentPixelData(src)
      expect(result.w).toBe(3)
      expect(result.h).toBe(3)
    })

    it('trims transparent border to correct size', () => {
      const src = makePixelData32([
        [O, O, O, O, O],
        [O, X, X, X, O],
        [O, X, X, X, O],
        [O, X, X, X, O],
        [O, O, O, O, O],
      ])
      const result = trimTransparentPixelData(src)
      expect(result.w).toBe(3)
      expect(result.h).toBe(3)
    })

    it('trims to a single opaque pixel', () => {
      const src = makePixelData32([
        [O, O, O],
        [O, X, O],
        [O, O, O],
      ])
      const result = trimTransparentPixelData(src)
      expect(result.w).toBe(1)
      expect(result.h).toBe(1)
    })
  })

  describe('correct pixel values after trim', () => {
    it('preserves pixel values after trimming', () => {
      const A: [number, number, number, number] = [255, 0, 0, 255]
      const B: [number, number, number, number] = [0, 255, 0, 255]
      const C: [number, number, number, number] = [0, 0, 255, 255]
      const D: [number, number, number, number] = [255, 255, 0, 255]

      const src = makePixelData32([
        [O, O, O, O],
        [O, A, B, O],
        [O, C, D, O],
        [O, O, O, O],
      ])

      const result = trimTransparentPixelData(src)
      expect(result.w).toBe(2)
      expect(result.h).toBe(2)

      // Rebuild a reference PixelData32 of just the content area to compare
      const expected = makePixelData32([[A, B], [C, D]])
      expect(Array.from(result.data)).toEqual(Array.from(expected.data))
    })

    it('does not mutate the source', () => {
      const src = makePixelData32([
        [O, O, O],
        [O, X, O],
        [O, O, O],
      ])
      const originalData = Array.from(src.data)
      trimTransparentPixelData(src)
      expect(Array.from(src.data)).toEqual(originalData)
    })
  })

  describe('result metadata', () => {
    it('result imageData dimensions match w/h', () => {
      const src = makePixelData32([
        [O, O, O, O, O],
        [O, X, X, X, O],
        [O, X, X, X, O],
        [O, O, O, O, O],
      ])
      const result = trimTransparentPixelData(src)
      expect(result.imageData.width).toBe(result.w)
      expect(result.imageData.height).toBe(result.h)
    })

    it('result data length equals w * h', () => {
      const src = makePixelData32([
        [O, O, O, O, O],
        [O, X, X, X, O],
        [O, X, X, X, O],
        [O, O, O, O, O],
      ])
      const result = trimTransparentPixelData(src)
      expect(result.data.length).toBe(result.w * result.h)
    })
  })
})

describe('trimTransparentPixelDataInPlace', () => {
  describe('throws on fully transparent', () => {
    it('throws for a fully transparent image', () => {
      const src = makePixelData32([
        [O, O, O],
        [O, O, O],
        [O, O, O],
      ])
      expect(() => trimTransparentPixelDataInPlace(src)).toThrow()
    })

    it('throws for a 1x1 transparent pixel', () => {
      const src = makePixelData32([[O]])
      expect(() => trimTransparentPixelDataInPlace(src)).toThrow()
    })
  })

  describe('correct output dimensions', () => {
    it('returns full size when no trimming needed', () => {
      const src = makePixelData32([
        [X, X, X],
        [X, X, X],
        [X, X, X],
      ])
      trimTransparentPixelDataInPlace(src)
      expect(src.w).toBe(3)
      expect(src.h).toBe(3)
    })

    it('trims transparent border to correct size', () => {
      const src = makePixelData32([
        [O, O, O, O, O],
        [O, X, X, X, O],
        [O, X, X, X, O],
        [O, X, X, X, O],
        [O, O, O, O, O],
      ])
      trimTransparentPixelDataInPlace(src)
      expect(src.w).toBe(3)
      expect(src.h).toBe(3)
    })

    it('trims to a single opaque pixel', () => {
      const src = makePixelData32([
        [O, O, O],
        [O, X, O],
        [O, O, O],
      ])
      trimTransparentPixelDataInPlace(src)
      expect(src.w).toBe(1)
      expect(src.h).toBe(1)
    })
  })

  describe('result metadata', () => {
    it('result imageData dimensions match w/h', () => {
      const src = makePixelData32([
        [O, O, O, O, O],
        [O, X, X, X, O],
        [O, X, X, X, O],
        [O, O, O, O, O],
      ])
      trimTransparentPixelDataInPlace(src)
      expect(src.imageData.width).toBe(src.w)
      expect(src.imageData.height).toBe(src.h)
      expect(src.data.length).toBe(src.w * src.h)
    })
  })
})

