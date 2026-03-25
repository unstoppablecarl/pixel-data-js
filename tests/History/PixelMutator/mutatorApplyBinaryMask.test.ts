import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type BinaryMask, makeBinaryMask, mutatorApplyBinaryMask } from '@/index'
import { makeTestBinaryMask } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyBinaryMask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call accumulator and applyBinaryMaskToPixelData', () => {
    const mask = makeTestBinaryMask(2, 2, 1)
    const options = {
      x: 5,
      y: 5,
      w: 2,
      h: 2,
    }

    const applyBinaryMaskSpy = vi.fn()

    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorApplyBinaryMask, { applyBinaryMaskToPixelData: applyBinaryMaskSpy })

    mutator.applyBinaryMask(mask, options)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(5, 5, 2, 2)
    expect(applyBinaryMaskSpy).toHaveBeenCalledWith(target, mask, options)
  })
})
