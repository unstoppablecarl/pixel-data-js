import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type BinaryMask, mutatorApplyBinaryMask } from '@/index'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyBinaryMask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call accumulator and applyBinaryMaskToPixelData', () => {
    const mask = new Uint8Array([1, 1, 1, 1]) as BinaryMask
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
