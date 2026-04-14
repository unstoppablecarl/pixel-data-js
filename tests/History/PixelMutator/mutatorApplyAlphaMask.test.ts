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
    reset,
  } = mockMutator(mutatorApplyAlphaMask, { applyAlphaMaskToPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator', () => {
    const mask = makeTestAlphaMask(2, 2, 1)
    const o = {
      x: 5,
      y: 5,
      w: 2,
      h: 2,
    }

    const result = mutator.applyAlphaMask(mask, o)

    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.applyAlphaMaskToPixelData).toHaveBeenCalledExactlyOnceWith(target, mask, o)
  })

  it('should call accumulator with defaults', () => {
    const mask = makeTestAlphaMask(2, 2, 1)
    mutator.applyAlphaMask(mask)
    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, 0, target.w, target.h)
    expect(spyDeps.applyAlphaMaskToPixelData).toHaveBeenCalledExactlyOnceWith(target, mask, undefined)
  })

  it('should return false on out of bounds region', () => {
    const mask = makeTestAlphaMask(2, 2, 1)
    const o = {
      x: 5000,
      y: 5000,
      w: 2,
      h: 2,
    }

    const result = mutator.applyAlphaMask(mask, o)

    expect(result).toEqual(false)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.applyAlphaMaskToPixelData).not.toHaveBeenCalled()
  })
})
