import { beforeEach, describe, expect, it, vi } from 'vitest'
import { type AlphaMask, mutatorApplyAlphaMask } from '@/index'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyAlphaMask', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call accumulator and applyAlphaMaskToPixelData', () => {
    const mask = new Uint8Array([1, 1, 1, 1]) as AlphaMask
    const options = {
      x: 5,
      y: 5,
      w: 2,
      h: 2,
    }

    const applyAlphaMaskSpy = vi.fn()

    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorApplyAlphaMask, { applyAlphaMaskToPixelData: applyAlphaMaskSpy })

    mutator.applyAlphaMask(mask, options)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(5, 5, 2, 2)
    expect(applyAlphaMaskSpy).toHaveBeenCalledWith(target, mask, options)
  })
})
