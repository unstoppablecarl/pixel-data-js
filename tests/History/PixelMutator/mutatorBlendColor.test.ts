import { blendColorPixelData, type Color32, mutatorBlendColor } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMutator } from './_helpers'

describe('mutatorBlendColor', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorBlendColor, { blendColorPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const color = 0xFF0000FF as Color32
    const o = {
      x: 10,
      y: 11,
      w: 20,
      h: 22,
    }

    mutator.blendColor(color, o)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendColorPixelData).toHaveBeenCalledWith(target, color, o)
  })

  it('should call accumulator with defaults', () => {
    const color = 0xFF0000FF as Color32
    mutator.blendColor(color)
    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.width, target.height)
    expect(spyDeps.blendColorPixelData).toHaveBeenCalledWith(target, color, undefined)
  })
})
