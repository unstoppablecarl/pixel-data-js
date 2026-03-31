import { type Color32, mutatorApplyRectPencil } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyRectPencil', () => {

  it('passes the optional blend function through to the blitter', () => {
    const applyRectBrushToPixelDataSpy = vi.fn()
    // We can use a mock for getRectBrushOrPencilBounds to control the output
    const mockBounds = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
    }
    const getRectBrushOrPencilBoundsMock = vi.fn().mockReturnValue(mockBounds)

    const fallOff = () => 1
    const {
      mutator,
      target,
    } = mockAccumulatorMutator(mutatorApplyRectPencil, {
      applyRectBrushToPixelData: applyRectBrushToPixelDataSpy,
      getRectBrushOrPencilBounds: getRectBrushOrPencilBoundsMock,
      fallOff,
    })

    const mockBlend = vi.fn()
    const color = 0 as Color32

    mutator.applyRectPencil(
      color,
      0,
      0,
      1,
      1,
      255,
      mockBlend,
    )

    // Use exact arguments instead of expect.anything() to prevent Vitest
    // from hanging on stringification if a mismatch occurs.
    expect(applyRectBrushToPixelDataSpy).toHaveBeenCalledWith(
      target,
      color,
      0,
      0,
      1,
      1,
      255,
      fallOff,
      mockBlend,
      mockBounds,
    )
  })

  it('confirm default falloff is () =>', () => {
    const applyRectBrushToPixelDataSpy = vi.fn()
    // We can use a mock for getRectBrushOrPencilBounds to control the output

    const {
      mutator,
    } = mockAccumulatorMutator(mutatorApplyRectPencil, {
      applyRectBrushToPixelData: applyRectBrushToPixelDataSpy,
    })

    const mockBlend = vi.fn()
    const color = 0 as Color32

    mutator.applyRectPencil(
      color,
      0,
      0,
      1,
      1,
      255,
      mockBlend,
    )

    const callArgs = applyRectBrushToPixelDataSpy.mock.calls[0]
    const actualFallOff = callArgs[7]

    expect(actualFallOff(0)).toEqual(1)
    expect(actualFallOff(1)).toEqual(1)
    expect(actualFallOff(2)).toEqual(1)
  })
})
