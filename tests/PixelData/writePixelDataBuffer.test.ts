import { describe, expect, it } from 'vitest'
import { writePixelDataBuffer } from '../../src/PixelData/writePixelDataBuffer'
import { getPixel, makeComplexTestPixelData, makeTestPixelData, pack } from '../_helpers'

describe('writePixelDataBuffer', () => {
  const W = 10
  const H = 10

  it('correctly maps source pixels when drawing with negative offsets', () => {
    const dst = makeTestPixelData(W, H)
    const patchW = 5
    const patchH = 5
    const patch = makeComplexTestPixelData(patchW, patchH)

    // Draw at (-2, -2).
    // This means patch(2,2) should land at dst(0,0)
    writePixelDataBuffer(dst, patch.data32, -2, -2, patchW, patchH)

    const dstPixel = getPixel(dst, 0, 0)
    const srcPixel = getPixel(patch, 2, 2)

    expect(dstPixel).toBe(srcPixel)

    // Dst(2,2) should contain Patch(4,4) data
    expect(getPixel(dst, 2, 2)).toBe(getPixel(patch, 4, 4))

    // Dst(3,0) should be empty (out of patch bounds)
    expect(getPixel(dst, 3, 0)).toBe(0)
  })

  it('clips pixels correctly at the right and bottom edges', () => {
    const dst = makeTestPixelData(W, H)
    const patchW = 5
    const patchH = 5
    const patch = makeComplexTestPixelData(patchW, patchH)

    // Draw at (8, 8).
    // Only a 2x2 area from the patch (0,0 to 1,1) fits.
    writePixelDataBuffer(dst, patch.data32, 8, 8, patchW, patchH)

    // Dst(8,8) matches Patch(0,0)
    expect(getPixel(dst, 8, 8)).toBe(getPixel(patch, 0, 0))

    // Dst(9,9) matches Patch(1,1)
    expect(getPixel(dst, 9, 9)).toBe(getPixel(patch, 1, 1))
  })

  it('handles negative coordinates (top-left clipping)', () => {
    const dst = makeTestPixelData(5, 5)
    const patchW = 4
    const patchH = 4
    const white = pack(255, 255, 255, 255)
    const data = new Uint32Array(patchW * patchH).fill(white)

    // Drawing a 4x4 patch at (-2, -2) on a 5x5 canvas
    writePixelDataBuffer(dst, data, -2, -2, patchW, patchH)

    // dst[0,0] should be white
    expect(getPixel(dst, 0, 0)).toBe(white)

    // dst[2,0] should be empty (only 2px wide area was valid)
    expect(getPixel(dst, 2, 0)).toBe(0)
  })

  it('handles overflow coordinates (bottom-right clipping)', () => {
    const dst = makeTestPixelData(2, 2)
    const patchW = 10
    const patchH = 10
    const white = pack(255, 255, 255, 255)
    const data = new Uint32Array(patchW * patchH).fill(white)

    // Draw huge patch at (1,1) of a tiny canvas
    writePixelDataBuffer(dst, data, 1, 1, patchW, patchH)

    // dst[1,1] is index 3 in a 2x2
    expect(getPixel(dst, 1, 1)).toBe(white)
    // dst[0,0] remains empty
    expect(getPixel(dst, 0, 0)).toBe(0)
  })

  it('early exits if the intersection is completely out of bounds', () => {
    const dst = makeTestPixelData(5, 5)
    const white = pack(255, 255, 255, 255)
    const data = new Uint32Array(16).fill(white)

    // Completely off to the right
    writePixelDataBuffer(dst, data, 10, 0, 2, 2)
    // Completely off to the top
    writePixelDataBuffer(dst, data, 0, -10, 2, 2)

    const sum = dst.data32.reduce((
      a,
      b,
    ) => a + b, 0)
    expect(sum).toBe(0)
  })

  it('supports the Rect object overload', () => {
    const dst = makeTestPixelData(5, 5)
    const white = pack(255, 255, 255, 255)
    const data = new Uint32Array(1).fill(white)
    const rect = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }

    writePixelDataBuffer(dst, data, rect)
    expect(getPixel(dst, 0, 0)).toBe(white)
  })

  it('does not throw if source data is smaller than requested dimensions', () => {
    const dst = makeTestPixelData(10, 10)
    const white = pack(255, 255, 255, 255)
    const tinyData = new Uint32Array(1).fill(white)

    const fn = () => writePixelDataBuffer(dst, tinyData, 0, 0, 10, 10)
    expect(fn).not.toThrow()
  })
})
