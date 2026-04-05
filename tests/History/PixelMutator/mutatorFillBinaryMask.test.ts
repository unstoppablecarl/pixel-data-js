import { type Color32, fillPixelDataBinaryMask, mutatorFillBinaryMask } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestBinaryMask } from '../../_helpers'
import { mockAccumulatorMutator, mockMutator } from './_helpers'

describe('mutatorFillBinaryMask', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorFillBinaryMask, { fillPixelDataBinaryMask })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const color = 0xFF0000FF as Color32
    const x = 10
    const y = 15
    const mask = makeTestBinaryMask(2, 3, 1)

    mutator.fillBinaryMask(color, mask, x, y)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(x, y, mask.w, mask.h)
    expect(spyDeps.fillPixelDataBinaryMask).toHaveBeenCalledWith(target, color, mask, x, y)
  })

  it('should call accumulator with defaults', () => {
    const color = 0xFF0000FF as Color32

    const fillPixelDataBinaryMaskSpy = vi.fn(fillPixelDataBinaryMask) as unknown as typeof fillPixelDataBinaryMask
    const mask = makeTestBinaryMask(2, 3, 1)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorFillBinaryMask, { fillPixelDataBinaryMask: fillPixelDataBinaryMaskSpy })

    mutator.fillBinaryMask(color, mask)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, mask.w, mask.h)
    expect(fillPixelDataBinaryMaskSpy).toHaveBeenCalledWith(target, color, mask, 0, 0)
  })
})
