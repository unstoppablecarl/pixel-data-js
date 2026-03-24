import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCircleBrushOrPencilBounds, type Color32, mutatorApplyCircleBrush, sourceOverFast } from '@/index'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyCircleBrush', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

    mutator.applyCircleBrush(color, 50, 50, 10, 255, fallOff, sourceOverFast)

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
      10,
      255,
      fallOff,
      sourceOverFast,
      expect.objectContaining(expectedBounds),
    )
  })
})
