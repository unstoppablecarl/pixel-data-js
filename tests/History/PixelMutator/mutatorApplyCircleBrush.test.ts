import {
  type Color32,
  getCircleBrushOrPencilBounds,
  makeCircleAlphaMask,
  mutatorBlendColorCircleMask,
  sourceOverPerfect,
} from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorBlendColorCircleMask', () => {

  it('should calculate bounds once and pass them to both accumulator and draw function', () => {
    const color = 0xFF0000FF as Color32
    const fallOff = (d: number) => 1 - d

    const blendColorPixelDataCircleMaskSpy = vi.fn()
    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorBlendColorCircleMask, {
      blendColorPixelDataCircleMask: blendColorPixelDataCircleMaskSpy,
      getCircleBrushOrPencilBounds,
    })

    const expectedBounds = {
      x: 45,
      y: 45,
      w: 10,
      h: 10,
    }

    const brush = makeCircleAlphaMask(10, fallOff)

    mutator.applyCircleMask(color, 50, 50, brush, 255)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
      expectedBounds.x,
      expectedBounds.y,
      expectedBounds.w,
      expectedBounds.h,
    )

    expect(blendColorPixelDataCircleMaskSpy).toHaveBeenCalledWith(
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
