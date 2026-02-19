import { describe, expect, it } from 'vitest'
import { clearPixelData } from '../../src/PixelData/clearPixelData'
import { makeTestPixelData, pack } from '../_helpers'

const BLUE = pack(0, 0, 255, 255)

describe('clearPixelData', () => {
  it('clears a specific region to transparent', () => {
    const dst = makeTestPixelData(2, 2, BLUE)

    // Clear the top-left pixel only
    clearPixelData(dst, {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    })

    // Pixel (0,0) should be 0
    expect(dst.data32[0]).toBe(0)

    // Remaining pixels should still be BLUE
    expect(dst.data32[1]).toBe(BLUE)
    expect(dst.data32[2]).toBe(BLUE)
    expect(dst.data32[3]).toBe(BLUE)
  })

  it('clears the entire buffer by default', () => {
    const dst = makeTestPixelData(5, 5, BLUE)

    clearPixelData(dst)

    const isAllClear = Array.from(dst.data32).every((val) => val === 0)
    expect(isAllClear).toBe(true)
  })
})
