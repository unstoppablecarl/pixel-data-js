import { writeImageData } from '@/index'
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
})
