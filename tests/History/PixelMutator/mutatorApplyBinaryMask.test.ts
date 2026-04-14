import { applyBinaryMaskToPixelData, mutatorApplyBinaryMask } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestBinaryMask, pack } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorApplyBinaryMask', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorApplyBinaryMask, { applyBinaryMaskToPixelData }, 16, 16, 8, pack(255, 255, 0, 255))

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator', () => {
    const mask = makeTestBinaryMask(20, 20, 0)
    const o = {
      x: 5,
      y: 6,
      w: 7,
      h: 8,
    }

    const result = mutator.applyBinaryMask(mask, o)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.applyBinaryMaskToPixelData).toHaveBeenCalledExactlyOnceWith(target, mask, o)
  })

  it('should call accumulator with defaults', () => {
    const mask = makeTestBinaryMask(2, 3)
    mutator.applyBinaryMask(mask)
    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, 0, target.w, target.h)
    expect(spyDeps.applyBinaryMaskToPixelData).toHaveBeenCalledExactlyOnceWith(target, mask, undefined)
  })

  it('should return false on out of bounds region', () => {
    const mask = makeTestBinaryMask(2, 2, 1)
    const o = {
      x: 5000,
      y: 5000,
      w: 2,
      h: 2,
    }

    const result = mutator.applyBinaryMask(mask, o)

    expect(result).toEqual(false)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.applyBinaryMaskToPixelData).not.toHaveBeenCalled()
  })
})
