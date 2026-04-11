import { invertPixelData, mutatorInvert } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMutator } from './_helpers'

describe('mutatorInvert', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorInvert, { invertPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator', () => {
    const o = {
      x: 14,
      y: 15,
      w: 30,
      h: 33,
    }

    const result = mutator.invert(o)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.invertPixelData).toHaveBeenCalledExactlyOnceWith(target, o)
  })

  it('should call accumulator with defaults', () => {
    const result = mutator.invert()
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, 0, target.w, target.h)
    expect(spyDeps.invertPixelData).toHaveBeenCalledExactlyOnceWith(target, undefined)
  })

  it('should return false when out of bounds', () => {
    const o = {
      x: 1400,
      y: 1500,
      w: 30,
      h: 33,
    }

    const result = mutator.invert(o)
    expect(result).toEqual(false)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.invertPixelData).not.toHaveBeenCalled()
  })
})
