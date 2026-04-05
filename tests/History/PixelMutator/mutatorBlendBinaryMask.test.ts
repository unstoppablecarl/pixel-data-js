import { blendPixelDataBinaryMask, mutatorBlendBinaryMask } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestBinaryMask, makeTestPixelData } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorBlendBinaryMask', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorBlendBinaryMask, { blendPixelDataBinaryMask })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const source = makeTestPixelData(10, 10)
    const mask = makeTestBinaryMask(10, 10)
    const o = {
      x: 20,
      y: 22,
      w: 30,
      h: 33,
    }

    mutator.blendBinaryMask(source, mask, o)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendPixelDataBinaryMask).toHaveBeenCalledWith(target, source, mask, o)
  })

  it('should call accumulator with defaults', () => {
    const source = makeTestPixelData(10, 10)
    const mask = makeTestBinaryMask(10, 10)
    mutator.blendBinaryMask(source, mask)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, source.w, source.h)
    expect(spyDeps.blendPixelDataBinaryMask).toHaveBeenCalledWith(target, source, mask, undefined)
  })
})
