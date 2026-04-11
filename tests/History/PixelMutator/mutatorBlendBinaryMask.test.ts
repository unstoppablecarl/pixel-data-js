import { blendPixelDataBinaryMask, mutatorBlendBinaryMask } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestBinaryMask, makeTestPixelData, pack } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorBlendBinaryMask', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorBlendBinaryMask, { blendPixelDataBinaryMask })

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator', () => {
    const source = makeTestPixelData(10, 10, pack(255, 0, 0, 255))
    const mask = makeTestBinaryMask(10, 10, 1)
    const o = {
      x: 2,
      y: 4,
      w: 30,
      h: 33,
    }

    const result = mutator.blendBinaryMask(source, mask, o)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendPixelDataBinaryMask).toHaveBeenCalledExactlyOnceWith(target, source, mask, o)
  })

  it('should call accumulator with defaults', () => {
    const source = makeTestPixelData(10, 12, pack(255, 0, 0, 255))
    const mask = makeTestBinaryMask(10, 10, 1)
    const result = mutator.blendBinaryMask(source, mask)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, 0, source.w, source.h)
    expect(spyDeps.blendPixelDataBinaryMask).toHaveBeenCalledExactlyOnceWith(target, source, mask, undefined)
  })

  it('should return false when input is out of bounds', () => {
    const source = makeTestPixelData(10, 12)
    const mask = makeTestBinaryMask(5, 3)
    const opts = {
      x: 1000,
      y: 3000,
    }
    const result = mutator.blendBinaryMask(source, mask, opts)
    expect(result).toEqual(false)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(opts.x, opts.y, source.w, source.h)
    expect(spyDeps.blendPixelDataBinaryMask).not.toHaveBeenCalled()
  })
})
