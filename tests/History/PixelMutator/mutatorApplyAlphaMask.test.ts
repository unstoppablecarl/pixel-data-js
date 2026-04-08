import { applyAlphaMaskToPixelData, mutatorApplyAlphaMask } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestAlphaMask } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorApplyAlphaMask', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorApplyAlphaMask, { applyAlphaMaskToPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const mask = makeTestAlphaMask(2, 2, 1)
    const o = {
      x: 5,
      y: 5,
      w: 2,
      h: 2,
    }

    mutator.applyAlphaMask(mask, o)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.applyAlphaMaskToPixelData).toHaveBeenCalledWith(target, mask, o)
  })

  it('should call accumulator with defaults', () => {
    const mask = makeTestAlphaMask(2, 2, 1)
    mutator.applyAlphaMask(mask)
    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.w, target.h)
    expect(spyDeps.applyAlphaMaskToPixelData).toHaveBeenCalledWith(target, mask, undefined)
  })
})
