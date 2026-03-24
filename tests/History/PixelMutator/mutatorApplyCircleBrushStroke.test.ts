import {
  forEachLinePoint,
  getCircleBrushOrPencilBounds,
  getCircleBrushOrPencilStrokeBounds,
  mutatorApplyCircleBrushStroke,
} from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pack } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyCircleBrushStroke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('orchestrates the lifecycle and passes correct args to internal helpers', () => {
    const color = pack(255, 0, 0, 255)

    // Spies/Mocks
    const forEachLinePointSpy = vi.fn(forEachLinePoint)
    const blendColorPixelDataAlphaMaskSpy = vi.fn()
    const getCircleBrushOrPencilBoundsSpy = vi.fn(getCircleBrushOrPencilBounds)
    const getCircleBrushOrPencilStrokeBoundsSpy = vi.fn(getCircleBrushOrPencilStrokeBounds)

    const { mutator, target } = mockAccumulatorMutator(mutatorApplyCircleBrushStroke, {
      forEachLinePoint: forEachLinePointSpy,
      blendColorPixelDataAlphaMask: blendColorPixelDataAlphaMaskSpy,
      getCircleBrushOrPencilBounds: getCircleBrushOrPencilBoundsSpy,
      getCircleBrushOrPencilStrokeBounds: getCircleBrushOrPencilStrokeBoundsSpy,
    })

    const brushSize = 3
    const fallOff = (d: number) => (1 - d)

    mutator.applyCircleBrushStroke(
      color,
      10,
      10,
      11,
      11,
      brushSize,
      255,
      fallOff,
    )

    // 1. Assert correct global footprint calculation
    expect(getCircleBrushOrPencilStrokeBoundsSpy).toHaveBeenCalledWith(
      10,
      10,
      11,
      11,
      brushSize,
      expect.any(Object),
    )

    // 2. Assert line point iteration was triggered
    expect(forEachLinePointSpy).toHaveBeenCalledWith(
      10,
      10,
      11,
      11,
      expect.any(Function),
    )

    // 3. Assert stamp bounds helper received target dimensions and closure object
    expect(getCircleBrushOrPencilBoundsSpy).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      brushSize,
      target.width,
      target.height,
      expect.any(Object),
    )

    // 4. Assert final mask blit received the computed bounds
    expect(blendColorPixelDataAlphaMaskSpy).toHaveBeenCalledWith(
      target,
      color,
      expect.any(Uint8Array),
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        w: expect.any(Number),
        h: expect.any(Number),
      }),
    )
  })

  it('correctly populates the internal 1D mask using real math logic', () => {
    const blendColorPixelDataAlphaMaskSpy = vi.fn()

    const { mutator } = mockAccumulatorMutator(mutatorApplyCircleBrushStroke, {
      blendColorPixelDataAlphaMask: blendColorPixelDataAlphaMaskSpy,
      forEachLinePoint,
      getCircleBrushOrPencilBounds,
      getCircleBrushOrPencilStrokeBounds,
    })

    // Single point at (10, 10). 3px brush.
    mutator.applyCircleBrushStroke(
      0 as any,
      10,
      10,
      10,
      10,
      3,
      255,
      (d) => d,
    )

    const mockCall = blendColorPixelDataAlphaMaskSpy.mock.calls[0]
    const mask = mockCall[2] as Uint8Array
    const options = mockCall[3]!

    // Calculate center index based on real returned bounds
    const localX = 10 - options.x!
    const localY = 10 - options.y!
    const centerIdx = (localY * options.w!) + localX

    // The center of the circle should always be full intensity
    expect(mask[centerIdx]).toBe(255)
  })

  it('maintains idempotency for overlapping points within the mask', () => {
    const blendColorPixelDataAlphaMaskSpy = vi.fn()

    const { mutator } = mockAccumulatorMutator(mutatorApplyCircleBrushStroke, {
      blendColorPixelDataAlphaMask: blendColorPixelDataAlphaMaskSpy,
      forEachLinePoint,
      getCircleBrushOrPencilBounds,
      getCircleBrushOrPencilStrokeBounds,
    })

    let count = 0
    const mockFallOff = vi.fn(() => {
      count++
      // Point 1 (Weak): 0.1
      // Point 2 (Strong): 0.9
      return (count === 1)
        ? 0.1
        : 0.9
    })

    // We draw a line from 10 to 11 with a large 5px brush.
    // Both stamps will overlap heavily at the center of the stroke.
    mutator.applyCircleBrushStroke(
      0 as any,
      10,
      10,
      11,
      10,
      5,
      255,
      mockFallOff,
    )

    const mask = blendColorPixelDataAlphaMaskSpy.mock.calls[0][2] as Uint8Array

    // Intensity 0.9 is 229.
    const hasStrongValue = Array.from(mask).some((v) => (v === 229))
    expect(hasStrongValue).toBe(true)
  })

  it('uses the same object reference for bounds to optimize memory', () => {
    const getCircleBrushOrPencilBoundsSpy = vi.fn(getCircleBrushOrPencilBounds)

    const { mutator } = mockAccumulatorMutator(mutatorApplyCircleBrushStroke, {
      getCircleBrushOrPencilBounds: getCircleBrushOrPencilBoundsSpy,
      forEachLinePoint,
      blendColorPixelDataAlphaMask: vi.fn(),
      getCircleBrushOrPencilStrokeBounds,
    })

    mutator.applyCircleBrushStroke(
      0 as any,
      10,
      10,
      12,
      10, // Line long enough to have 3 points
      1,
      255,
      (d) => 1,
    )

    const calls = getCircleBrushOrPencilBoundsSpy.mock.calls
    const firstCallOut = calls[0][5]
    const secondCallOut = calls[1][5]

    // Verify the internal 'circleBrushBounds' Rect is reused across all stamps in the line
    expect(firstCallOut).toBe(secondCallOut)
  })

  it('returns early if the calculated stroke bounds have no area', () => {
    const getCircleBrushOrPencilStrokeBoundsSpy = vi.fn().mockReturnValue({ x: 0, y: 0, w: 0, h: 0 })
    const blendColorPixelDataAlphaMaskSpy = vi.fn()

    const { mutator, accumulator } = mockAccumulatorMutator(mutatorApplyCircleBrushStroke, {
      getCircleBrushOrPencilStrokeBounds: getCircleBrushOrPencilStrokeBoundsSpy,
      blendColorPixelDataAlphaMask: blendColorPixelDataAlphaMaskSpy,
      forEachLinePoint,
      getCircleBrushOrPencilBounds,
    })

    mutator.applyCircleBrushStroke(
      0 as any,
      10,
      10,
      10,
      10,
      0, // Brush size 0 usually leads to 0 area
      255,
      (d) => 1,
    )

    // The accumulator and blitter should never be called if bw/bh <= 0
    expect(accumulator.storeRegionBeforeState).not.toHaveBeenCalled()
    expect(blendColorPixelDataAlphaMaskSpy).not.toHaveBeenCalled()
  })

  it('uses a 0.5 centerOffset for even brush sizes (2x2)', () => {
    const blendColorPixelDataAlphaMaskSpy = vi.fn()

    const { mutator } = mockAccumulatorMutator(mutatorApplyCircleBrushStroke, {
      blendColorPixelDataAlphaMask: blendColorPixelDataAlphaMaskSpy,
      forEachLinePoint,
      getCircleBrushOrPencilBounds,
      getCircleBrushOrPencilStrokeBounds,
    })

    mutator.applyCircleBrushStroke(
      0 as any,
      10,
      10,
      10,
      10,
      2,
      255,
      (d) => 1 - d,
    )

    const mask = blendColorPixelDataAlphaMaskSpy.mock.calls[0][2] as Uint8Array
    const firstPixel = mask[0]
    expect(firstPixel).toBeGreaterThan(0)
    expect(mask[1]).toBe(firstPixel)
    expect(mask[2]).toBe(firstPixel)
    expect(mask[3]).toBe(firstPixel)
  })

  it('uses a 0 centerOffset for odd brush sizes (3x3)', () => {
    const blendColorPixelDataAlphaMaskSpy = vi.fn()

    const { mutator } = mockAccumulatorMutator(mutatorApplyCircleBrushStroke, {
      blendColorPixelDataAlphaMask: blendColorPixelDataAlphaMaskSpy,
      forEachLinePoint,
      getCircleBrushOrPencilBounds,
      getCircleBrushOrPencilStrokeBounds,
    })

    mutator.applyCircleBrushStroke(
      0 as any,
      10,
      10,
      10,
      10,
      3,
      255,
      (d) => d,
    )

    const mockCall = blendColorPixelDataAlphaMaskSpy.mock.calls[0]
    const mask = mockCall[2] as Uint8Array
    const options = mockCall[3]!

    // Find center pixel in the mask
    const localX = 10 - options.x!
    const localY = 10 - options.y!
    const centerIdx = (localY * options.w!) + localX

    // In an odd brush with 0 offset, the center pixel is exactly at distance 0
    // fallOff(0) * 255 should be 255
    expect(mask[centerIdx]).toBe(255)

    // The neighbor pixel (9,10) has dx = 1.0.
    // Normalized dist = 1.0 / 1.5 = 0.66.
    const neighborIdx = (localY * options.w!) + (localX - 1)
    expect(mask[neighborIdx]).toBeLessThan(255)
    expect(mask[neighborIdx]).toBeGreaterThan(0)
  })
})
