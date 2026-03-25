import { mutatorApplyAlphaMask } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestAlphaMask } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyAlphaMask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call accumulator and applyAlphaMaskToPixelData', () => {
    const mask = makeTestAlphaMask(2, 2, 1)
    const options = {
      x: 5,
      y: 5,
      w: 2,
      h: 2,
    }

    const applyAlphaMaskSpy = vi.fn()

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorApplyAlphaMask, { applyAlphaMaskToPixelData: applyAlphaMaskSpy })

    mutator.applyAlphaMask(mask, options)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(5, 5, 2, 2)
    expect(applyAlphaMaskSpy).toHaveBeenCalledWith(target, mask, options)
  })
})
