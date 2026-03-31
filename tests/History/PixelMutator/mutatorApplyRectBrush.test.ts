import { type Color32, getRectBrushOrPencilBounds, mutatorApplyRectBrush } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyRectBrush', () => {

  it('orchestrates the brush apply by wiring bounds to accumulator and blitter', () => {
    const getRectBrushOrPencilBoundsSpy = vi.fn(getRectBrushOrPencilBounds)
    const applyRectBrushToPixelDataSpy = vi.fn()

    const color = 0xFFFFFFFF as Color32
    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorApplyRectBrush, {
      applyRectBrushToPixelData: applyRectBrushToPixelDataSpy,
      getRectBrushOrPencilBounds: getRectBrushOrPencilBoundsSpy,
    })

    const mockBounds = {
      x: 15,
      y: 15,
      w: 10,
      h: 10,
    }

    const mockFallOff = (d: number) => 1 - d
    const mockBlend = vi.fn()

    mutator.applyRectBrush(
      color,
      20,
      20,
      10,
      10,
      128,
      mockFallOff,
      mockBlend,
    )

    // 1. Verify it requested the correct bounds from the helper using target dimensions
    expect(getRectBrushOrPencilBoundsSpy).toHaveBeenCalledWith(
      20,
      20,
      10,
      10,
      target.width,
      target.height,
      expect.any(Object),
    )

    // 2. Verify it told the accumulator to save the region returned by the helper
    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
      mockBounds.x,
      mockBounds.y,
      mockBounds.w,
      mockBounds.h,
    )

    // 3. Verify it passed all arguments, including fallOff and blendFn, to the blitter
    expect(applyRectBrushToPixelDataSpy).toHaveBeenCalledWith(
      target,
      color,
      20,
      20,
      10,
      10,
      128,
      mockFallOff,
      mockBlend,
      expect.objectContaining(mockBounds),
    )
  })

  it('correctly utilizes the internal boundsOut closure object', () => {
    const getRectBrushOrPencilBoundsSpy = vi.fn(getRectBrushOrPencilBounds)

    const { mutator } = mockAccumulatorMutator(mutatorApplyRectBrush, {
      applyRectBrushToPixelData: vi.fn(),
      getRectBrushOrPencilBounds: getRectBrushOrPencilBoundsSpy,
    })

    // We call it twice to ensure it's passing the same object reference
    // to the bounds helper (the closure variable)
    mutator.applyRectBrush(0 as Color32, 0, 0, 1, 1, 255, (v) => v)
    mutator.applyRectBrush(0 as Color32, 0, 0, 1, 1, 255, (v) => v)

    const boundsCalls = getRectBrushOrPencilBoundsSpy.mock.calls
    const firstCallObject = boundsCalls[0][6]
    const secondCallObject = boundsCalls[1][6]

    expect(firstCallObject).toBe(secondCallObject)
    expect(firstCallObject).toEqual(expect.objectContaining({
      x: expect.any(Number),
      y: expect.any(Number),
      w: expect.any(Number),
      h: expect.any(Number),
    }))
  })
})
