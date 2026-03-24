import { describe, expect, it, vi } from 'vitest'
import { applyCircleBrushToPixelData, PixelData } from '@/index'
import { pack, unpack } from '../_helpers'

describe('applyCircleBrushToPixelData', () => {
  const RED = pack(255, 0, 0, 255)

  const createMockPixelData = (width: number, height: number) => {
    const buffer = new Uint8ClampedArray(width * height * 4)
    const imageData = {
      data: buffer,
      width: width,
      height: height,
    } as ImageData
    return new PixelData(imageData)
  }

  it('applies small brush fallOff correctly when provided', async () => {
    const target = createMockPixelData(10, 10)
    const color = RED
    const fallOff = vi.fn((d: number) => d)

    const x = 5
    const y = 5

    applyCircleBrushToPixelData(target, color, x, y, 2, 255, fallOff)

    const f = 0.2928932188134524
    const calls = fallOff.mock.calls
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

  it('draws a solid circle within the radius', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xFF0000FF as any // Red

    // Brush Size 4 (Radius 2). Centered at 5,5.
    // It should fill a roughly circular area.
    applyCircleBrushToPixelData(target, color, 5, 5, 4, 255, () => 1)

    // Center pixels (5,5), (4,5), (5,4), (4,4) should definitely be filled for even brush
    expect(target.data32[5 * 10 + 5]).toBe(color)
    expect(target.data32[4 * 10 + 4]).toBe(color)

    // A pixel far away (0,0) should be empty
    expect(target.data32[0]).toBe(0)
  })

  it('applies fallOff function correctly', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xFFFFFFFF as any
    const fallOff = vi.fn((d: number) => d) // Linear fade

    // Size 4 (Radius 2). Center 5,5.
    applyCircleBrushToPixelData(target, color, 5, 5, 4, 255, fallOff)

    expect(fallOff).toHaveBeenCalled()

    // Center pixel (5,5) for even brush size 4 has a 0.5 offset.
    // Distance from geometric center is sqrt(0.5^2 + 0.5^2) = ~0.707
    // Normalized distance = 0.707 / 2 = ~0.35
    // Falloff should be ~0.65 -> Alpha ~165
    const centerPixel = target.data32[5 * 10 + 5]
    const alpha = centerPixel >>> 24

    expect(alpha).toBeGreaterThan(150)
    expect(alpha).toBeLessThan(180)
  })

  it('clips correctly when brush is partially off-screen (Bottom-Right)', async () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any

    applyCircleBrushToPixelData(target, color, 9, 9, 10, 255, () => 1)

    expect(target.data32[99]).toBe(0xffffffff)
    await expect(target).toMatchPixelDataSnapshot()
  })

  it('does nothing if the brush is entirely outside the target', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xffffffff as any

    applyCircleBrushToPixelData(target, color, 50, 50, 5, 255, () => 1)

    const hasData = target.data32.some(p => p !== 0)
    expect(hasData).toBe(false)
  })

  it('handles clipping at canvas edges', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xFFFFFFFF as any

    // Circle at 0,0 size 6 (Radius 3)
    applyCircleBrushToPixelData(target, color, 0, 0, 6, 255, () => 1)

    expect(target).toMatchPixelDataSnapshot()

    // (0,0) should be filled
    expect(target.data32[0]).toBe(color)
    // // (2,2) should be filled (dist = sqrt(8) = 2.82 < 3)
    expect(unpack(target.data32[0 * 10 + 2])).toEqual(unpack(color))
    // // (3,3) should be empty (dist = sqrt(18) = 4.2 > 3)
    // expect(target.data32[3 * 10 + 3]).toBe(0)
  })

  it('applies the alpha parameter to the final color', () => {
    const target = createMockPixelData(10, 10)

    // Use 0xff00ff00 to provide an OPAQUE green base
    // (Assuming Little-Endian ABGR where ff is Alpha and the second ff is Green)
    const color = 0xff00ff00 as any
    const customAlpha = 128

    applyCircleBrushToPixelData(target, color, 5, 5, 2, customAlpha, () => 1)

    const centerIdx = 5 * 10 + 5

    expect(unpack(target.data32[centerIdx])).toEqual({
      r: 0,
      g: 255,
      b: 0,
      a: 128, // 50% opacity from the customAlpha multiplier
    })
  })

  it('respects the provided bounds optimization', () => {
    const target = createMockPixelData(10, 10)
    const color = 0xFFFFFFFF as any

    // Define bounds that only allow drawing the top-left pixel of the 10x10 brush area
    // Even though brush is huge (10x10), we clip it to 1x1 at (0,0)
    const tightBounds = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }

    applyCircleBrushToPixelData(
      target,
      color,
      5,
      5,
      10,
      255,
      () => 1,
      undefined,
      tightBounds,
    )

    // Only 0,0 is allowed by bounds, but 0,0 is OUTSIDE the radius of a circle at 5,5
    expect(target.data32[0]).toBe(0)

    // Center should NOT be drawn because it's outside 'tightBounds'
    expect(target.data32[5 * 10 + 5]).toBe(0)
  })

  it('calculates center offset correctly for Odd brush sizes', () => {
    const target = createMockPixelData(5, 5)
    const color = 0xFFFFFFFF as any
    const fallOff = (d: number) => d

    // Size 3 (Radius 1.5). Center 2,2.
    // For Odd brushes, center offset is 0.
    // Pixel (2,2) is exactly at distance 0.
    applyCircleBrushToPixelData(target, color, 2, 2, 3, 255, fallOff)

    expect(target.data32[2 * 5 + 2] >>> 24).toBe(255)
  })

  it('does nothing if bounds have zero area', () => {
    const target = createMockPixelData(5, 5)
    const color = 0xFFFFFFFF as any
    const bounds = { x: 0, y: 0, w: 0, h: 0 }

    applyCircleBrushToPixelData(target, color, 2, 2, 3, 255, () => 1, undefined, bounds)

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
    const bounds = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }

    applyCircleBrushToPixelData(
      pixelData as any,
      0x00000000 as any,
      0,
      0,
      1,
      255,
      () => 0.5, // Falloff < 1 ensures maskVal is < 255, pushing us into the weight check
      blendFn,
      bounds,
    )

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

    const blendFn = vi.fn((src, dst) => src)

      // Explicitly flag the mock function as an overwrite mode
    ;(blendFn as any).isOverwrite = true

    const bounds = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }

    applyCircleBrushToPixelData(
      pixelData as any,
      0x00000000 as any,
      0,
      0,
      1,
      255,
      () => 0.5,
      blendFn,
      bounds,
    )

    // Because isOverwrite is true, it MUST call the blend function to punch the transparent hole
    expect(blendFn).toHaveBeenCalled()
  })
})
