import { blendPixelData, makePixelData, mutatorBlendPixelData } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestPixelData } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorBlendPixelData', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorBlendPixelData, { blendPixelData })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const source = makeTestPixelData(10, 12)
    const o = {
      x: 20,
      y: 22,
      w: 30,
      h: 33,
    }
    mutator.blendPixelData(source, o)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendPixelData).toHaveBeenCalledWith(target, source, o)
  })

  it('should call accumulator with defaults', () => {
    const source = makePixelData(new ImageData(10, 10))

    mutator.blendPixelData(source)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, source.w, source.h)
    expect(spyDeps.blendPixelData).toHaveBeenCalledWith(target, source, undefined)
  })
})
