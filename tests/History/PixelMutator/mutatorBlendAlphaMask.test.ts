import { blendPixelDataAlphaMask, mutatorBlendAlphaMask, PixelData } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestAlphaMask } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorBlendAlphaMask', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorBlendAlphaMask, { blendPixelDataAlphaMask })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const source = new PixelData(new ImageData(10, 12))
    const mask = makeTestAlphaMask(11, 12)
    const o = {
      x: 20,
      y: 22,
      w: 30,
      h: 33,
    }

    mutator.blendAlphaMask(source, mask, o)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendPixelDataAlphaMask).toHaveBeenCalledWith(target, source, mask, o)
  })

  it('should call accumulator with defaults', () => {
    const source = new PixelData(new ImageData(10, 12))

    const mask = makeTestAlphaMask(5, 3)
    mutator.blendAlphaMask(source, mask)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, source.width, source.height)
    expect(spyDeps.blendPixelDataAlphaMask).toHaveBeenCalledWith(target, source, mask, undefined)
  })
})
