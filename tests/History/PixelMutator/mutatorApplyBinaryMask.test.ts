import { applyBinaryMaskToPixelData, mutatorApplyBinaryMask } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestBinaryMask } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorApplyBinaryMask', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorApplyBinaryMask, { applyBinaryMaskToPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const mask = makeTestBinaryMask(2, 2, 1)
    const o = {
      x: 5,
      y: 6,
      w: 7,
      h: 8,
    }

    mutator.applyBinaryMask(mask, o)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.applyBinaryMaskToPixelData).toHaveBeenCalledWith(target, mask, o)
  })

  it('should call accumulator with defaults', () => {
    const mask = makeTestBinaryMask(2, 3)
    mutator.applyBinaryMask(mask)
    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.width, target.height)
    expect(spyDeps.applyBinaryMaskToPixelData).toHaveBeenCalledWith(target, mask, undefined)
  })
})
