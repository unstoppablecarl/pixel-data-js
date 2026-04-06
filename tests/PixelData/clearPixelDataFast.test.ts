import { clearPixelDataFast } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData, pack } from '../_helpers'

const BLUE = pack(0, 0, 255, 255)

describe('clearPixelDataFast', () => {
  it('clears a specific region to transparent', () => {
    const dst = makeTestPixelData(2, 2, BLUE)

    // Clear the top-left pixel only
    clearPixelDataFast(dst, {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    })

    // Pixel (0,0) should be 0
    expect(dst.data[0]).toBe(0)

    // Remaining pixels should still be BLUE
    expect(dst.data[1]).toBe(BLUE)
    expect(dst.data[2]).toBe(BLUE)
    expect(dst.data[3]).toBe(BLUE)
  })

  it('clears the entire buffer by default', () => {
    const dst = makeTestPixelData(5, 5, BLUE)

    clearPixelDataFast(dst)

    const isAllClear = Array.from(dst.data).every((val) => val === 0)
    expect(isAllClear).toBe(true)
  })
})
