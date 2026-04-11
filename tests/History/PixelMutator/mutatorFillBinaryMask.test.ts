import { type Color32, fillPixelDataBinaryMask, mutatorFillBinaryMask } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestBinaryMask } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorFillBinaryMask', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorFillBinaryMask, { fillPixelDataBinaryMask })

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator', () => {
    const color = 0xFF0000FF as Color32
    const x = 10
    const y = 15
    const mask = makeTestBinaryMask(2, 3, 1)

    const result = mutator.fillBinaryMask(color, mask, x, y)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(x, y, mask.w, mask.h)
    expect(spyDeps.fillPixelDataBinaryMask).toHaveBeenCalledExactlyOnceWith(target, color, mask, x, y)
  })

  it('should call accumulator with defaults', () => {
    const color = 0xFF0000FF as Color32

    const fillPixelDataBinaryMaskSpy = vi.fn(fillPixelDataBinaryMask) as unknown as typeof fillPixelDataBinaryMask
    const mask = makeTestBinaryMask(2, 3, 1)

    const {
      mutator,
      accumulator,
      target,
    } = mockMutator(mutatorFillBinaryMask, { fillPixelDataBinaryMask: fillPixelDataBinaryMaskSpy })

    const result = mutator.fillBinaryMask(color, mask)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, 0, mask.w, mask.h)
    expect(fillPixelDataBinaryMaskSpy).toHaveBeenCalledExactlyOnceWith(target, color, mask, 0, 0)
  })

  it('should return false when out of bounds', () => {
    const color = 0xFF0000FF as Color32
    const x = 1000
    const y = 1500
    const mask = makeTestBinaryMask(2, 3, 1)

    const result = mutator.fillBinaryMask(color, mask, x, y)
    expect(result).toEqual(false)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(x, y, mask.w, mask.h)
    expect(spyDeps.fillPixelDataBinaryMask).not.toHaveBeenCalled()
  })
})
