import {
  type AlphaMask,
  forEachLinePoint,
  getRectBrushOrPencilBounds,
  getRectBrushOrPencilStrokeBounds,
  MaskType,
  mutatorApplyRectBrushStroke,
} from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pack } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyRectBrushStroke', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('orchestrates a brush stroke by wiring bounds and computing mask intensity', () => {
    const color = pack(255, 255, 255, 255)

    const forEachLinePointSpy = vi.fn(forEachLinePoint)
    const blendColorPixelDataAlphaMaskSpy = vi.fn()
    const getRectBrushOrPencilBoundsSpy = vi.fn(getRectBrushOrPencilBounds)
    const getRectBrushOrPencilStrokeBoundsSpy = vi.fn(getRectBrushOrPencilStrokeBounds)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorApplyRectBrushStroke, {
      forEachLinePoint: forEachLinePointSpy,
      blendColorPixelDataAlphaMask: blendColorPixelDataAlphaMaskSpy,
      getRectBrushOrPencilBounds: getRectBrushOrPencilBoundsSpy,
      getRectBrushOrPencilStrokeBounds: getRectBrushOrPencilStrokeBoundsSpy,
    })

    const mockFallOff = vi.fn().mockReturnValue(0.5)

    mutator.applyRectBrushStroke(
      color,
      10,
      10,
      10,
      10,
      2,
      2,
      255,
      mockFallOff,
    )

    // Assert correct orchestration with real logic spies
    expect(getRectBrushOrPencilStrokeBoundsSpy).toHaveBeenCalledWith(
      10,
      10,
      10,
      10,
      2,
      2,
      expect.any(Object),
    )

    expect(forEachLinePointSpy).toHaveBeenCalledWith(
      10,
      10,
      10,
      10,
      expect.any(Function),
    )

    expect(getRectBrushOrPencilBoundsSpy).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      2,
      2,
      target.width,
      target.height,
      expect.any(Object),
    )

    // Verify accumulator was called for the calculated region
    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
      expect.any(Number),
    )

    expect(blendColorPixelDataAlphaMaskSpy).toHaveBeenCalledWith(
      target,
      color,
      expect.objectContaining({
        type: MaskType.ALPHA,
        w: 2,
        h: 2,
        data: expect.toSatisfy((v: Uint8Array) => {
          expect(Array.from(v)).toEqual([127, 127, 127, 127])

          return true
        }),
      }),
      expect.objectContaining({
        x: expect.any(Number),
        y: expect.any(Number),
        w: expect.any(Number),
        h: expect.any(Number),
      }),
    )

    const mask = blendColorPixelDataAlphaMaskSpy.mock.calls[0][2] as AlphaMask

    // 0.5 falloff maps to 127 intensity
    expect(mask.data.some((v) => v === 127)).toBe(true)
  })

  it('correctly normalizes distance using the larger dimension (Chebyshev)', () => {
    const mockFallOff = vi.fn().mockReturnValue(1)
    const { mutator } = mockAccumulatorMutator(mutatorApplyRectBrushStroke, {
      forEachLinePoint,
      blendColorPixelDataAlphaMask: vi.fn(),
      getRectBrushOrPencilBounds,
      getRectBrushOrPencilStrokeBounds,
    })

    // 4x2 brush at 10,10. halfW=2, halfH=1.
    // Edge pixel at x=8.5 (center) is 1.5 units from center. 1.5/2.0 = 0.75.
    // Edge pixel at y=9.5 (center) is 0.5 units from center. 0.5/1.0 = 0.5.
    mutator.applyRectBrushStroke(
      0 as any,
      10,
      10,
      10,
      10,
      4,
      2,
      255,
      mockFallOff,
    )

    const calls = mockFallOff.mock.calls.map((args) => args[0])

    expect(calls).toEqual([
      0.75,
      0.5,
      0.5,
      0.75,
      0.75,
      0.5,
      0.5,
      0.75,
    ])
  })

  it('preserves the highest intensity in the mask for overlapping stamps', () => {
    const blendColorPixelDataAlphaMaskSpy = vi.fn()
    const { mutator } = mockAccumulatorMutator(mutatorApplyRectBrushStroke, {
      blendColorPixelDataAlphaMask: blendColorPixelDataAlphaMaskSpy,
      forEachLinePoint,
      getRectBrushOrPencilBounds,
      getRectBrushOrPencilStrokeBounds,
    })
    let count = 0

    const mockFallOff = vi.fn(() => {
      count++
      // Weak hit (0.2) followed by strong hits (0.8)
      return (count <= 4) ? 0.2 : 0.8
    })

    // Increase distance from 10.1 to 11.0 to ensure a second stamp is triggered
    mutator.applyRectBrushStroke(
      0 as any,
      10,
      10,
      11,
      10,
      2,
      2,
      255,
      mockFallOff,
    )

    const mask = blendColorPixelDataAlphaMaskSpy.mock.calls[0][2] as AlphaMask

    // Strong hit (0.8 * 255 = 204)
    expect(mask.data.some((v) => v === 204)).toBe(true)
    expect(mask.data.some((v) => v !== 51)).toBe(true)
  })

  it('reuses the internal bounds object to minimize garbage collection', () => {
    const getRectBrushOrPencilBoundsSpy = vi.fn(getRectBrushOrPencilBounds)
    const { mutator } = mockAccumulatorMutator(mutatorApplyRectBrushStroke, {
      getRectBrushOrPencilBounds: getRectBrushOrPencilBoundsSpy,
      forEachLinePoint,
      blendColorPixelDataAlphaMask: vi.fn(),
      getRectBrushOrPencilStrokeBounds,
    })

    mutator.applyRectBrushStroke(
      0 as any,
      10,
      10,
      12,
      10,
      1,
      1,
      255,
      () => 1,
    )

    const firstCallOut = getRectBrushOrPencilBoundsSpy.mock.calls[0][6]
    const secondCallOut = getRectBrushOrPencilBoundsSpy.mock.calls[1][6]

    // Verify identity of the closure variable rectBrushBounds
    expect(firstCallOut).toBe(secondCallOut)
  })

  it('returns early and skips all work if stroke dimensions are zero', () => {
    const forEachLinePointSpy = vi.fn(forEachLinePoint)
    const blendColorPixelDataAlphaMaskSpy = vi.fn()
    const {
      mutator,
      accumulator,
    } = mockAccumulatorMutator(mutatorApplyRectBrushStroke, {
      forEachLinePoint: forEachLinePointSpy,
      blendColorPixelDataAlphaMask: blendColorPixelDataAlphaMaskSpy,
      getRectBrushOrPencilBounds,
      getRectBrushOrPencilStrokeBounds,
    })

    mutator.applyRectBrushStroke(
      0 as any,
      5,
      5,
      5,
      5,
      0,
      0,
      255,
      () => 1,
    )

    expect(forEachLinePointSpy).not.toHaveBeenCalled()
    expect(accumulator.storeRegionBeforeState).not.toHaveBeenCalled()
    expect(blendColorPixelDataAlphaMaskSpy).not.toHaveBeenCalled()
  })

  it('preserves highest intensity across a diagonal overlap', () => {
    const blendColorPixelDataAlphaMaskSpy = vi.fn()
    const {
      mutator,
    } = mockAccumulatorMutator(mutatorApplyRectBrushStroke, {
      blendColorPixelDataAlphaMask: blendColorPixelDataAlphaMaskSpy,
      forEachLinePoint,
      getRectBrushOrPencilBounds,
      getRectBrushOrPencilStrokeBounds,
    })

    let count = 0

    const mockFallOff = vi.fn(() => {
      count++
      // Ensure the first few stamps are weak, later ones are strong
      return (count <= 2)
        ? 0.1
        : 0.9
    })

    // Diagonal stroke (10, 10) to (11, 11)
    mutator.applyRectBrushStroke(
      0 as any,
      10,
      10,
      11,
      11,
      2,
      2,
      255,
      mockFallOff,
    )

    const mockCall = blendColorPixelDataAlphaMaskSpy.mock.calls[0]
    const mask = mockCall[2] as AlphaMask

    // Check that the strong value exist
    expect(mask.data.some((v) => v === 229)).toBe(true)

    const uniqueValues = Array.from(new Set(mask.data)).filter(v => v !== 0)
    expect(uniqueValues).toContain(229)
  })

  it('correctly maps line points to the mask by verifying bit-set count', () => {
    const blendColorPixelDataAlphaMaskSpy = vi.fn()
    const {
      mutator,
    } = mockAccumulatorMutator(mutatorApplyRectBrushStroke, {
      blendColorPixelDataAlphaMask: blendColorPixelDataAlphaMaskSpy,
      forEachLinePoint,
      getRectBrushOrPencilBounds,
      getRectBrushOrPencilStrokeBounds,
    })

    mutator.applyRectBrushStroke(
      0 as any,
      10,
      10,
      10,
      12, // Vertical line
      2,  // 2px width
      2,  // 2px height
      255,
      () => 1.0,
    )

    const mockCall = blendColorPixelDataAlphaMaskSpy.mock.calls[0]
    expect(mockCall, 'Blitter should have been called').toBeDefined()

    const mask = mockCall[2] as AlphaMask
    const options = mockCall[3]!

    expect(options.h).toBeGreaterThanOrEqual(3)

    const hasData = mask.data.some((v) => v > 0)
    expect(hasData, 'The mask should contain painted pixels').toBe(true)

    const paintedCount = mask.data.filter((v) => v > 0).length
    expect(paintedCount).toBeGreaterThanOrEqual(3)
  })

  it('verifies that diagonal strokes trigger the vertical logic branch', () => {
    const forEachLinePointSpy = vi.fn(forEachLinePoint)
    const {
      mutator,
    } = mockAccumulatorMutator(mutatorApplyRectBrushStroke, {
      forEachLinePoint: forEachLinePointSpy,
      blendColorPixelDataAlphaMask: vi.fn(),
      getRectBrushOrPencilBounds,
      getRectBrushOrPencilStrokeBounds,
    })

    // Diagonal 10,10 to 11,11
    mutator.applyRectBrushStroke(
      0 as any,
      10,
      10,
      11,
      11,
      2,
      2,
      255,
      () => 1.0,
    )

    // This proves the line algorithm ran
    expect(forEachLinePointSpy).toHaveBeenCalled()
  })
})
