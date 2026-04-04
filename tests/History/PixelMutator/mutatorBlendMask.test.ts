import { blendPixelDataAlphaMask, blendPixelDataBinaryMask, mutatorBlendMask, sourceOverPerfect } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestAlphaMask, makeTestBinaryMask, makeTestPixelDataLike } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorBlendMask', () => {

  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorBlendMask, { blendPixelDataBinaryMask, blendPixelDataAlphaMask })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  const src = makeTestPixelDataLike(4, 5)

  it('should call accumulator for Binary', () => {
    const mask = makeTestBinaryMask(4, 4, 1)
    const o = {
      x: 4,
      y: 5,
      w: 8,
      h: 9,
      alpha: 255,
      blendFn: sourceOverPerfect,
      mx: 5,
      my: 8,
      invertMask: true,
      sx: 18,
      sy: 19,
    }

    mutator.blendMask(
      src,
      mask,
      o,
    )

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendPixelDataBinaryMask).toHaveBeenCalledWith(target, src, mask, o)
  })

  it('should call accumulator with defaults for Binary', () => {
    const mask = makeTestBinaryMask(4, 4, 1)
    mutator.blendMask(
      src,
      mask,
    )

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, src.width, src.height)
    expect(spyDeps.blendPixelDataBinaryMask).toHaveBeenCalledWith(target, src, mask, undefined)
  })
  it('should call accumulator for Alpha', () => {
    const mask = makeTestAlphaMask(4, 4, 1)
    const o = {
      x: 4,
      y: 5,
      w: 8,
      h: 9,
      alpha: 255,
      blendFn: sourceOverPerfect,
      mx: 5,
      my: 8,
      invertMask: true,
      sx: 18,
      sy: 19,
    }

    mutator.blendMask(
      src,
      mask,
      o,
    )

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendPixelDataAlphaMask).toHaveBeenCalledWith(target, src, mask, o)
  })

  it('should call accumulator with defaults for Alpha', () => {
    const mask = makeTestAlphaMask(4, 4, 1)
    mutator.blendMask(
      src,
      mask,
    )

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, src.width, src.height)
    expect(spyDeps.blendPixelDataAlphaMask).toHaveBeenCalledWith(target, src, mask, undefined)
  })
})
