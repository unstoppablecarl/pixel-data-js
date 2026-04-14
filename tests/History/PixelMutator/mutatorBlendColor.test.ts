import { blendColorPixelData, type Color32, mutatorBlendColor } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMutator } from './_helpers'

describe('mutatorBlendColor', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorBlendColor, { blendColorPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator', () => {
    const color = 0xFF0000FF as Color32
    const o = {
      x: 10,
      y: 11,
      w: 20,
      h: 22,
    }

    const result = mutator.blendColor(color, o)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendColorPixelData).toHaveBeenCalledExactlyOnceWith(target, color, o)
  })

  it('should call accumulator with defaults', () => {
    const color = 0xFF0000FF as Color32

    const result = mutator.blendColor(color)
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, 0, target.w, target.h)
    expect(spyDeps.blendColorPixelData).toHaveBeenCalledExactlyOnceWith(target, color, undefined)
  })

  it('should return false when out of bounds', () => {
    const color = 0xFF0000FF as Color32
    const o = {
      x: 1000,
      y: 1100,
      w: 20,
      h: 22,
    }

    const result = mutator.blendColor(color, o)
    expect(result).toEqual(false)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendColorPixelData).not.toHaveBeenCalled()
  })
})
