import { MaskType, writeImageData } from '@/index'
import { describe, expect, it } from 'vitest'

describe('writeImageData', () => {
  const createImg = (w: number, h: number) => {
    return new ImageData(new Uint8ClampedArray(w * h * 4), w, h)
  }

  it('performs high-speed bulk copy when no mask is present', () => {
    const target = createImg(2, 2)
    const source = createImg(2, 2)
    source.data.fill(255)
    writeImageData(target, source, 0, 0)
    expect(target.data[0]).toBe(255)
    expect(target.data[target.data.length - 1]).toBe(255)
  })

  it('clips content correctly when x/y are negative', () => {
    const target = createImg(2, 2)
    const source = createImg(2, 2)
    source.data.fill(255)
    // Only the bottom right pixel of the source should hit the top left of target
    writeImageData(target, source, -1, -1)
    expect(target.data[0]).toBe(255)
    expect(target.data[4]).toBe(0)
  })

  it('returns early for non-overlapping rects', () => {
    const target = createImg(1, 1)
    const source = createImg(1, 1)
    source.data.fill(255)
    writeImageData(target, source, 10, 10)
    expect(target.data[0]).toBe(0)
  })

  it('handles MaskType.BINARY correctly', () => {
    const target = createImg(2, 1)
    const source = createImg(2, 1)
    source.data.fill(255)
    const mask = new Uint8Array([255, 0])

    writeImageData(target, source, 0, 0, 0, 0, 2, 1, mask, MaskType.BINARY)
    expect(target.data[0]).toBe(255)
    expect(target.data[4]).toBe(0)
  })

  it('handles alpha blending for non-binary masks', () => {
    const target = createImg(1, 1)
    const source = createImg(1, 1)
    target.data.fill(0)
    source.data.fill(255)
    // 50% opacity mask
    const mask = new Uint8Array([127])

    writeImageData(target, source, 0, 0, 0, 0, 1, 1, mask, MaskType.ALPHA)
    // Expected: ~127 (0 * 0.5 + 255 * 0.5)
    expect(target.data[0]).toBeGreaterThan(120)
    expect(target.data[0]).toBeLessThan(135)
  })

  it('skips pixels with 0 alpha in alpha mode', () => {
    const target = createImg(1, 1)
    const source = createImg(1, 1)
    target.data.fill(100)
    source.data.fill(255)
    const mask = new Uint8Array([0])

    writeImageData(target, source, 0, 0, 0, 0, 1, 1, mask, MaskType.ALPHA)
    expect(target.data[0]).toBe(100)
  })

  it('treats alpha 255 as a direct set in alpha mode', () => {
    const target = createImg(1, 1)
    const source = createImg(1, 1)
    source.data.fill(200)
    const mask = new Uint8Array([255])

    writeImageData(target, source, 0, 0, 0, 0, 1, 1, mask, MaskType.ALPHA)
    expect(target.data[0]).toBe(200)
  })

  it('syncs mask index with source index when using offsets (sx, sy)', () => {
    const target = createImg(1, 1)
    const source = createImg(3, 3)
    const mask = new Uint8Array(9).fill(0)

    // Set a specific pixel at (1, 1) in source
    const srcIdx = (1 * 3 + 1) * 4
    source.data[srcIdx] = 255

    // Set the mask to ALLOW only that pixel at (1, 1)
    const maskIdx = 1 * 3 + 1
    mask[maskIdx] = 255

    // Draw ONLY that 1x1 sub-region
    writeImageData(
      target,
      source,
      0,
      0,
      1,
      1,
      1,
      1,
      mask,
      MaskType.BINARY,
    )

    // If mi calculation is wrong, it will look at mask[0] instead of mask[4]
    expect(target.data[0]).toBe(255)
  })
})
