import { blendPixelData, mutatorBlendPixelData } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestPixelData, pack } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorBlendPixelData', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorBlendPixelData, { blendPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator', () => {
    const source = makeTestPixelData(100, 100, pack(0, 255, 0, 255))
    const o = {
      x: 2,
      y: 3,
      w: 30,
      h: 33,
    }
    const result = mutator.blendPixelData(source, o)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendPixelData).toHaveBeenCalledExactlyOnceWith(target, source, o)
  })

  it('should call accumulator with defaults', () => {
    const source = makeTestPixelData(100, 100, pack(0, 255, 0, 255))

    const result = mutator.blendPixelData(source)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, 0, source.w, source.h)
    expect(spyDeps.blendPixelData).toHaveBeenCalledExactlyOnceWith(target, source, undefined)
  })

  it('should return false when out of bounds', () => {
    const source = makeTestPixelData(100, 100, pack(0, 255, 0, 255))
    const o = {
      x: 2000,
      y: 3000,
      w: 30,
      h: 33,
    }
    const result = mutator.blendPixelData(source, o)
    expect(result).toEqual(false)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendPixelData).not.toHaveBeenCalled()
  })
})
