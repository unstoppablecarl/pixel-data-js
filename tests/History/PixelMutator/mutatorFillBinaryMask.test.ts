import { type Color32, fillPixelDataBinaryMask, mutatorFillBinaryMask } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { makeTestBinaryMask } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorFillBinaryMask', () => {

  it('should call accumulator and fillPixelData with correct args', () => {
    const alpha = 120
    const color = 0xFF0000FF as Color32
    const x = 10
    const y = 15
    const fillPixelDataBinaryMaskSpy = vi.fn(fillPixelDataBinaryMask) as unknown as typeof fillPixelDataBinaryMask
    const mask = makeTestBinaryMask(2, 2, 1)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorFillBinaryMask, { fillPixelDataBinaryMask: fillPixelDataBinaryMaskSpy })

    mutator.fillBinaryMask(color, mask, alpha, x, y)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(x, y, mask.w, mask.h)
    expect(fillPixelDataBinaryMaskSpy).toHaveBeenCalledWith(target, color, mask, alpha, x, y)
  })

  it('should use default dimensions if rect is not provided', () => {
    const color = 0xFF0000FF as Color32

    const fillPixelDataBinaryMaskSpy = vi.fn(fillPixelDataBinaryMask) as unknown as typeof fillPixelDataBinaryMask
    const mask = makeTestBinaryMask(2, 2, 1)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorFillBinaryMask, { fillPixelDataBinaryMask: fillPixelDataBinaryMaskSpy })

    mutator.fillBinaryMask(color, mask)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, mask.w, mask.h)
    expect(fillPixelDataBinaryMaskSpy).toHaveBeenCalledWith(target, color, mask, 255, 0, 0)
  })
})
