import type { PixelData32 } from '@/index'
import { resizePixelData } from '@/index'
import { describe, expect, it } from 'vitest'

describe('resizePixelData', () => {
  const createData = (w: number, h: number, fill?: number): PixelData32 => {
    const data = new Uint32Array(w * h)
    if (fill !== undefined) data.fill(fill)
    return { w, h, data }
  }

  it('should expand the buffer and pad with zeros', () => {
    const src = createData(2, 2, 0xFFFFFFFF)
    const result = resizePixelData(src, 4, 4, 1, 1)

    expect(result.w).toBe(4)
    expect(result.h).toBe(4)
    // Center should be filled
    expect(result.data[5]).toBe(0xFFFFFFFF) // (1, 1)
    expect(result.data[6]).toBe(0xFFFFFFFF) // (2, 1)
    // Corners should be zero
    expect(result.data[0]).toBe(0)
    expect(result.data[15]).toBe(0)
  })

  it('should crop the buffer when dimensions are smaller', () => {
    const src = createData(4, 4)
    src.data.fill(0x11111111)
    // Set a specific pixel that should be cropped out
    src.data[15] = 0xEEEEEEEE

    const result = resizePixelData(src, 2, 2, 0, 0)

    expect(result.w).toBe(2)
    expect(result.h).toBe(2)
    expect(result.data[0]).toBe(0x11111111)
    expect(result.data.includes(0xEEEEEEEE)).toBe(false)
  })

  it('should handle negative offsets (cropping from top-left)', () => {
    const src = createData(3, 3)
    // Fill with indices to track positions
    src.data.forEach((_, i) => (src.data[i] = i))

    // Move source -1, -1 and resize to 2x2
    const result = resizePixelData(src, 2, 2, -1, -1)

    // Source (1,1) which is index 4, should now be at result (0,0)
    expect(result.data[0]).toBe(4)
    expect(result.data[3]).toBe(8)
  })

  it('should return an empty buffer if out of bounds', () => {
    const src = createData(2, 2, 0xFFFFFFFF)
    // Offset completely outside the new dimensions
    const result = resizePixelData(src, 2, 2, 5, 5)

    expect(result.data.every(v => v === 0)).toBe(true)
  })

  it('should use the provided output object', () => {
    const src = createData(2, 2, 0xFFFFFFFF)
    const out = { w: 0, h: 0, data: new Uint32Array(0) }

    const result = resizePixelData(src, 4, 4, 0, 0, out)

    expect(result).toBe(out)
    expect(out.w).toBe(4)
    expect(out.data.length).toBe(16)
  })

  it('should hit the 1D bulk copy optimization path', () => {
    // Optimization triggers when:
    // copyW === oldW && copyW === newWidth && offsetX === 0
    const src = createData(10, 2, 0xAAAAAAAA)
    const result = resizePixelData(src, 10, 5, 0, 1)

    expect(result.w).toBe(10)
    // Row 0 is empty
    expect(result.data[0]).toBe(0)
    // Row 1 & 2 are filled
    expect(result.data[10]).toBe(0xAAAAAAAA)
    expect(result.data[29]).toBe(0xAAAAAAAA)
    // Row 3 is empty
    expect(result.data[30]).toBe(0)
  })

  it('should handle zero or negative dimensions gracefully', () => {
    const src = createData(2, 2, 0xFFFFFFFF)
    const result = resizePixelData(src, 0, 0)

    expect(result.w).toBe(0)
    expect(result.data.length).toBe(0)
  })
})
