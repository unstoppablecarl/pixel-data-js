import { type CircleMask, blendColorPixelDataCircleMask, makeCircleAlphaMask, makeCircleBinaryMask, MaskType } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { makeTestPixelData, pack, unpack } from '../_helpers'

describe('blendColorPixelDataCircleMask', () => {
  const RED = pack(255, 0, 0, 255)

  it('applies small brush fallOff correctly when provided', async () => {
    const target = makeTestPixelData(10, 10)
    const color = RED
    const fallOff = vi.fn((d: number) => d)
    const brush = makeCircleAlphaMask(2, fallOff)

    const x = 5
    const y = 5

    const result = blendColorPixelDataCircleMask(
      target,
      color,
      x,
      y,
      brush,
      255,
    )

    const f = 0.2928932188134524
    const calls = fallOff.mock.calls

    expect(result).toBe(true)
    expect(calls).toEqual([
      [f],
      [f],
      [f],
      [f],
    ])

    const centerIdx = x * target.width + y

    expect(unpack(target.data32[centerIdx])).toEqual({
      r: 255,
      g: 0,
      b: 0,
      a: 74,
    })

    await expect(target).toMatchPixelDataSnapshot()
  })

  it('draws a solid circle within the radius', async () => {
    const target = makeTestPixelData(10, 10)
    const color = 0xFF0000FF as any // Red
    const brush = makeCircleAlphaMask(4)

    // Brush Size 4 (Radius 2). Centered at 5,5.
    // It should fill a roughly circular area.
    const result = blendColorPixelDataCircleMask(
      target,
      color,
      5,
      5,
      brush,
      255,
    )

    expect(result).toBe(true)
    // Center pixels (5,5), (4,5), (5,4), (4,4) should definitely be filled for even brush
    expect(target.data32[5 * 10 + 5]).toBe(color)
    expect(target.data32[4 * 10 + 4]).toBe(color)

    // A pixel far away (0,0) should be empty
    expect(target.data32[0]).toBe(0)

    await expect(target).toMatchPixelDataSnapshot()
  })

  it('draws a solid circle within the radius for binary mask', async () => {
    const target = makeTestPixelData(10, 10)
    const color = 0xFF0000FF as any // Red
    const brush = makeCircleBinaryMask(4)

    // Brush Size 4 (Radius 2). Centered at 5,5.
    // It should fill a roughly circular area.
    const result = blendColorPixelDataCircleMask(
      target,
      color,
      5,
      5,
      brush,
      255,
    )

    expect(result).toBe(true)
    // Center pixels (5,5), (4,5), (5,4), (4,4) should definitely be filled for even brush
    expect(target.data32[5 * 10 + 5]).toBe(color)
    expect(target.data32[4 * 10 + 4]).toBe(color)

    // A pixel far away (0,0) should be empty
    expect(target.data32[0]).toBe(0)
    await expect(target).toMatchPixelDataSnapshot()
  })

  it('applies fallOff function correctly', async () => {
    const target = makeTestPixelData(10, 10)
    const color = 0xFFFFFFFF as any
    const fallOff = vi.fn((d: number) => d) // Linear fade
    const brush = makeCircleAlphaMask(4, fallOff)

    // Size 4 (Radius 2). Center 5,5.
    const result = blendColorPixelDataCircleMask(
      target,
      color,
      5,
      5,
      brush,
      255,
    )

    expect(result).toBe(true)
    expect(fallOff).toHaveBeenCalled()

    // Center pixel (5,5) for even brush size 4 has a 0.5 offset.
    // Distance from geometric center is sqrt(0.5^2 + 0.5^2) = ~0.707
    // Normalized distance = 0.707 / 2 = ~0.35
    // Falloff should be ~0.65 -> Alpha ~165
    const centerPixel = target.data32[5 * 10 + 5]
    const alpha = centerPixel >>> 24

    expect(alpha).toBeGreaterThan(150)
    expect(alpha).toBeLessThan(180)

    await expect(target).toMatchPixelDataSnapshot()

  })

  it('clips correctly when brush is partially off-screen (Bottom-Right)', async () => {
    const target = makeTestPixelData(10, 10)
    const color = 0xffffffff as any
    const brush = makeCircleAlphaMask(10)

    const result = blendColorPixelDataCircleMask(
      target,
      color,
      9,
      9,
      brush,
      255,
    )

    expect(result).toBe(true)
    expect(target.data32[99]).toBe(0xffffffff)
    await expect(target).toMatchPixelDataSnapshot()
  })

  it('does nothing if the brush is entirely outside the target', () => {
    const target = makeTestPixelData(10, 10)
    const color = 0xffffffff as any
    const brush = makeCircleAlphaMask(5)

    const result = blendColorPixelDataCircleMask(
      target,
      color,
      50,
      50,
      brush,
      255,
    )

    expect(result).toBe(false)
    const hasData = target.data32.some(p => p !== 0)
    expect(hasData).toBe(false)
  })

  it('handles clipping at canvas edges', async () => {
    const target = makeTestPixelData(10, 10)
    const color = 0xFFFFFFFF as any
    const brush = makeCircleAlphaMask(6)

    // Circle at 0,0 size 6 (Radius 3)
    const result = blendColorPixelDataCircleMask(
      target,
      color,
      0,
      0,
      brush,
      255,
    )

    expect(result).toBe(true)
    expect(target).toMatchPixelDataSnapshot()

    // (0,0) should be filled
    expect(target.data32[0]).toBe(color)

    // (2,2) should be filled (dist = sqrt(8) = 2.82 < 3)
    expect(unpack(target.data32[0 * 10 + 2])).toEqual(unpack(color))

    await expect(target).toMatchPixelDataSnapshot()
  })

  it('applies the alpha parameter to the final color', async () => {
    const target = makeTestPixelData(10, 10)

    // Use 0xff00ff00 to provide an OPAQUE green base
    const color = 0xff00ff00 as any
    const customAlpha = 128
    const brush = makeCircleAlphaMask(2)

    const result = blendColorPixelDataCircleMask(
      target,
      color,
      5,
      5,
      brush,
      customAlpha,
    )

    expect(result).toBe(true)
    const centerIdx = 5 * 10 + 5

    expect(unpack(target.data32[centerIdx])).toEqual({
      r: 0,
      g: 255,
      b: 0,
      a: 128, // 50% opacity from the customAlpha multiplier
    })

    await expect(target).toMatchPixelDataSnapshot()

  })

  it('respects the provided bounds optimization', async () => {
    const target = makeTestPixelData(10, 10)
    const color = RED
    const brush = makeCircleAlphaMask(5)

    // Define bounds that only allow drawing the top-left pixel of the 10x10 brush area
    // Even though brush is huge (10x10), we clip it to 1x1 at (0,0)
    const tightBounds = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }

    const centerX = 5
    const centerY = 5
    const result = blendColorPixelDataCircleMask(
      target,
      color,
      centerX,
      centerY,
      brush,
      255,
      undefined,
      {},
      tightBounds,
    )

    expect(result).toBe(false)
    // Only 0,0 is allowed by bounds, but 0,0 is OUTSIDE the radius of a circle at 5,5
    // Center should NOT be drawn because it's outside 'tightBounds'
    expect(target.data32.every(p => p === 0)).toBe(true)
  })

  it('calculates center offset correctly for Odd brush sizes', async () => {
    const target = makeTestPixelData(5, 5)
    const color = 0xFFFFFFFF as any
    const fallOff = (d: number) => d
    const brush = makeCircleAlphaMask(3, fallOff)

    // Size 3 (Radius 1.5). Center 2,2.
    // For Odd brushes, center offset is 0.
    // Pixel (2,2) is exactly at distance 0.
    const result = blendColorPixelDataCircleMask(
      target,
      color,
      2,
      2,
      brush,
      255,
    )

    expect(result).toBe(true)
    expect(target.data32[2 * 5 + 2] >>> 24).toBe(255)
    await expect(target).toMatchPixelDataSnapshot()
  })

  it('does nothing if bounds have zero area', () => {
    const target = makeTestPixelData(5, 5)
    const color = 0xFFFFFFFF as any
    const brush = makeCircleAlphaMask(3)

    const bounds = {
      x: 0,
      y: 0,
      w: 0,
      h: 0,
    }

    const result = blendColorPixelDataCircleMask(
      target,
      color,
      2,
      2,
      brush,
      255,
      undefined,
      {},
      bounds,
    )

    expect(result).toBe(false)
    expect(target.data32.every(p => p === 0)).toBe(true)
  })

  it('skips blending if resulting alpha is 0 and not in overwrite mode', () => {
    const mockData = new Uint32Array([0xFFFFFFFF])

    const pixelData = {
      width: 1,
      height: 1,
      data32: mockData,
    }

    const blendFn = vi.fn()
    const brush = makeCircleAlphaMask(1, () => 0.5)

    const bounds = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }

    const result = blendColorPixelDataCircleMask(
      pixelData as any,
      0x00000000 as any,
      0,
      0,
      brush,
      255,
      blendFn,
      {},
      bounds,
    )

    expect(result).toBe(false)
    // Because a === 0 and !isOverwrite, the loop should continue before calling blendFn
    expect(blendFn).not.toHaveBeenCalled()
  })

  it('does NOT skip blending if isOverwrite is true, even if alpha is 0', () => {
    const mockData = new Uint32Array([0xFFFFFFFF])

    const pixelData = {
      width: 1,
      height: 1,
      data32: mockData,
    }

    const blendFn = vi.fn((src, _dst) => src)

      // Explicitly flag the mock function as an overwrite mode
    ;(blendFn as any).isOverwrite = true

    const brush = makeCircleAlphaMask(1, () => 0.5)

    const bounds = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }

    const result = blendColorPixelDataCircleMask(
      pixelData as any,
      0x00000000 as any,
      0,
      0,
      brush,
      255,
      blendFn,
      {},
      bounds,
    )

    expect(result).toBe(true)
    // Because isOverwrite is true, it MUST call the blend function to punch the transparent hole
    expect(blendFn).toHaveBeenCalled()
  })

  it('exits early if the mask falls entirely outside the calculated bounds (iw <= 0 || ih <= 0)', () => {
    const target = makeTestPixelData(10, 10)
    const color = RED
    const brush = makeCircleAlphaMask(2)

    // Valid bounds, but placed in the top-left
    const disjointBounds = {
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    }

    // Brush centered in the bottom-right, completely missing the disjointBounds
    const result = blendColorPixelDataCircleMask(
      target,
      color,
      8,
      8,
      brush,
      255,
      undefined,
      {},
      disjointBounds,
    )

    expect(result).toBe(false)
    const hasData = target.data32.some((p) => p !== 0)

    expect(hasData).toBe(false)
  })

  it('returns false for invalid mask type', () => {
    const target = makeTestPixelData(10, 10)
    const color = RED

    // Valid bounds, but placed in the top-left
    const disjointBounds = {
      x: 0,
      y: 0,
      w: 2,
      h: 2,
    }

    // Brush centered in the bottom-right, completely missing the disjointBounds
    const result = blendColorPixelDataCircleMask(
      target,
      color,
      8,
      8,
      {
        type: 'z' as unknown as MaskType,
      } as CircleMask,
      255,
      undefined,
      {},
      disjointBounds,
    )

    expect(result).toBe(false)
    const hasData = target.data32.some((p) => p !== 0)

    expect(hasData).toBe(false)
  })
})
