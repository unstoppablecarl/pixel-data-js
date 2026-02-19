import { describe, expect, it } from 'vitest'
import { writeImageData } from '../../src/ImageData/writeImageData'
import { createImg, createTestImageData, expectPixelToMatch } from '../_helpers'

describe('writeImageData', () => {
  const W = 10
  const H = 10

  it('correctly maps source pixels when drawing with negative offsets', () => {
    const dst = new ImageData(new Uint8ClampedArray(W * H * 4), W, H)
    const patchW = 5
    const patchH = 5
    const patch = createTestImageData(patchW, patchH)

    // Draw at (-2, -2).
    // This means patch(2,2) should land at dst(0,0)
    writeImageData(dst, patch.data, -2, -2, patchW, patchH)

    // Dst(0,0) should contain Patch(2,2) data
    expectPixelToMatch(dst, 0, 0, 2, 2)

    // Dst(2,2) should contain Patch(4,4) data
    expectPixelToMatch(dst, 2, 2, 4, 4)

    // Dst(3,0) should be empty (out of patch bounds)
    expect(dst.data[(0 * W + 3) * 4 + 3]).toBe(0)
  })

  it('clips pixels correctly at the right and bottom edges', () => {
    const dst = new ImageData(new Uint8ClampedArray(W * H * 4), W, H)
    const patchW = 5
    const patchH = 5
    const patch = createTestImageData(patchW, patchH)

    // Draw at (8, 8).
    // Only a 2x2 area from the patch (0,0 to 1,1) fits.
    writeImageData(dst, patch.data, 8, 8, patchW, patchH)

    // Dst(8,8) matches Patch(0,0)
    expectPixelToMatch(dst, 8, 8, 0, 0)

    // Dst(9,9) matches Patch(1,1)
    expectPixelToMatch(dst, 9, 9, 1, 1)
  })

  it('maintains integrity when w/h of data is smaller than the Rect', () => {
    const dst = new ImageData(new Uint8ClampedArray(W * H * 4), W, H)
    // Only enough data for 1x1 pixel
    const tinyData = new Uint8ClampedArray(4).fill(255)

    // Rect claims 5x5
    const fn = () => writeImageData(dst, tinyData, 0, 0, 5, 5)

    expect(fn).not.toThrow()
    // First pixel should be white
    expect(dst.data[0]).toBe(255)
    // Second pixel should be 0 (loop continued/safely exited)
    expect(dst.data[4]).toBe(0)
  })

  it('handles negative coordinates (top-left clipping)', () => {
    const dst = createImg(5, 5)
    const patchW = 4
    const patchH = 4
    const data = new Uint8ClampedArray(patchW * patchH * 4).fill(255)

    // Drawing a 4x4 patch at (-2, -2) on a 5x5 canvas
    // Only the bottom-right 2x2 of the patch should land at dst(0,0)
    writeImageData(dst, data, -2, -2, patchW, patchH)

    // dst[0,0] should be white
    expect(dst.data[0]).toBe(255)
    // dst[2,0] should be empty (only 2px wide area was valid)
    const idx = (0 * 5 + 2) * 4
    expect(dst.data[idx]).toBe(0)
  })

  it('handles overflow coordinates (bottom-right clipping)', () => {
    const dst = createImg(2, 2)
    const patchW = 10
    const patchH = 10
    const data = new Uint8ClampedArray(patchW * patchH * 4).fill(255)

    // Draw huge patch at (1,1) of a tiny canvas
    // Only 1x1 area should be written at dst[1,1]
    writeImageData(dst, data, 1, 1, patchW, patchH)

    // dst[1,1] is index 3 in a 2x2
    const idx = (1 * 2 + 1) * 4
    expect(dst.data[idx]).toBe(255)
    // dst[0,0] remains empty
    expect(dst.data[0]).toBe(0)
  })

  it('early exits if the intersection is completely out of bounds', () => {
    const dst = createImg(5, 5)
    const data = new Uint8ClampedArray(16).fill(255)

    // Completely off to the right
    writeImageData(dst, data, 10, 0, 2, 2)
    // Completely off to the top
    writeImageData(dst, data, 0, -10, 2, 2)

    const sum = dst.data.reduce((
      a,
      b,
    ) => a + b, 0)
    expect(sum).toBe(0)
  })

  it('supports the Rect object overload', () => {
    const dst = createImg(5, 5)
    const data = new Uint8ClampedArray(4).fill(255)
    const rect = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }

    writeImageData(dst, data, rect)
    expect(dst.data[0]).toBe(255)
  })

  it('does not crash if source data is smaller than requested dimensions', () => {
    const dst = createImg(10, 10)
    // Requested 10x10 (400 bytes) but only provided 4 bytes
    const tinyData = new Uint8ClampedArray(4).fill(255)

    // This should not throw because of our o + rowLen check
    const fn = () => writeImageData(dst, tinyData, 0, 0, 10, 10)
    expect(fn).not.toThrow()
  })

})
