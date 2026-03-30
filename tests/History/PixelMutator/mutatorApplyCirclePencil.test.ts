import {
  applyCircleBrushToPixelData,
  type Color32,
  getCircleBrushOrPencilBounds,
  makeCircleBrushAlphaMask,
  mutatorApplyCirclePencil,
  sourceOverPerfect,
} from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyCirclePencil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should apply rectangular bounds exactly', () => {
    const color = 0xFFFFFFFF as Color32
    const applyCircleBrushToPixelDataSpy = vi.fn(applyCircleBrushToPixelData)
    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorApplyCirclePencil, {
      applyCircleBrushToPixelData: applyCircleBrushToPixelDataSpy,
      getCircleBrushOrPencilBounds,
    })

    const expectedBounds = {
      x: 15,
      y: 15,
      w: 10,
      h: 10,
    }

    const brush = makeCircleBrushAlphaMask(10)
    mutator.applyCirclePencil(color, 20, 20, brush, 255)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(15, 15, 10, 10)

    expect(applyCircleBrushToPixelDataSpy).toHaveBeenCalledWith(
      target,
      color,
      20,
      20,
      brush,
      255,
      undefined,
      {
        alpha: 255,
        mx: 0,
        my: 0,
        blendFn: sourceOverPerfect,
        ...expectedBounds,
      },
    )
  })

  it('should respect target clipping in the mutator', () => {
    const color = 0xFFFFFFFF as Color32
    const { mutator, accumulator } = mockAccumulatorMutator(mutatorApplyCirclePencil)

    const brush = makeCircleBrushAlphaMask(10)

    mutator.applyCirclePencil(color, 0, 0, brush)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, 5, 5)
  })
})
