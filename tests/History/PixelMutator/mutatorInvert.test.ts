import { invertPixelData, mutatorInvert } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMutator } from './_helpers'

describe('mutatorInvert', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorInvert, { invertPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const o = {
      x: 14,
      y: 15,
      w: 30,
      h: 33,
    }

    mutator.invert(o)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.invertPixelData).toHaveBeenCalledWith(target, o)
  })

  it('should call accumulator with defaults', () => {
    mutator.invert()

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.width, target.height)
    expect(spyDeps.invertPixelData).toHaveBeenCalledWith(target, undefined)
  })
})
