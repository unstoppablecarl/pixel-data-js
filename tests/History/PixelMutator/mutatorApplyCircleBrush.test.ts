import {
  type Color32,
  getCircleBrushOrPencilBounds,
  makeCircleBrushAlphaMask,
  mutatorApplyCircleBrush,
  sourceOverPerfect,
} from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyCircleBrush', () => {

  it('should calculate bounds once and pass them to both accumulator and draw function', () => {
    const color = 0xFF0000FF as Color32
    const fallOff = (d: number) => 1 - d

    const applyCircleBrushToPixelDataSpy = vi.fn()
    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorApplyCircleBrush, {
      applyCircleBrushToPixelData: applyCircleBrushToPixelDataSpy,
      getCircleBrushOrPencilBounds,
    })

    const expectedBounds = {
      x: 45,
      y: 45,
      w: 10,
      h: 10,
    }

    const brush = makeCircleBrushAlphaMask(10, fallOff)

    mutator.applyCircleBrush(color, 50, 50, brush, 255)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
      expectedBounds.x,
      expectedBounds.y,
      expectedBounds.w,
      expectedBounds.h,
    )

    expect(applyCircleBrushToPixelDataSpy).toHaveBeenCalledWith(
      target,
      color,
      50,
      50,
      brush,
      255,
      undefined,
      expect.objectContaining({
        alpha: 255,
        blendFn: sourceOverPerfect,
        x: 0,
        y: 0,
        w: 0,
        h: 0,
      }),
      expect.objectContaining(expectedBounds),
    )
  })
})
