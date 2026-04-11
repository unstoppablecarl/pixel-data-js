import { blendPixelDataAlphaMask, blendPixelDataBinaryMask, mutatorBlendMask, sourceOverPerfect } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestAlphaMask, makeTestBinaryMask, makeTestPixelDataLike, pack } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorBlendMask', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorBlendMask, { blendPixelDataBinaryMask, blendPixelDataAlphaMask })

  const src = makeTestPixelDataLike(40, 50, pack(0, 255, 0, 255))
  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator for Binary', () => {
    const mask = makeTestBinaryMask(40, 40, 0)
    const o = {
      x: 2,
      y: 3,
      w: 8,
      h: 9,
      alpha: 255,
      blendFn: sourceOverPerfect,
      mx: 5,
      my: 8,
      invertMask: true,
      sx: 2,
      sy: 3,
    }

    const result = mutator.blendMask(
      src,
      mask,
      o,
    )
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendPixelDataBinaryMask).toHaveBeenCalledExactlyOnceWith(target, src, mask, o)
    expect(spyDeps.blendPixelDataAlphaMask).not.toHaveBeenCalled()
  })

  it('should call accumulator with defaults for Binary', () => {
    const mask = makeTestBinaryMask(4, 4, 1)
    const result = mutator.blendMask(
      src,
      mask,
    )
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, 0, src.w, src.h)
    expect(spyDeps.blendPixelDataBinaryMask).toHaveBeenCalledExactlyOnceWith(target, src, mask, undefined)
    expect(spyDeps.blendPixelDataAlphaMask).not.toHaveBeenCalled()
  })

  it('should call accumulator for Alpha', () => {
    const mask = makeTestAlphaMask(40, 40, 0)
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

    const result = mutator.blendMask(
      src,
      mask,
      o,
    )
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(o.x, o.y, o.w, o.h)
    expect(spyDeps.blendPixelDataAlphaMask).toHaveBeenCalledExactlyOnceWith(target, src, mask, o)
    expect(spyDeps.blendPixelDataBinaryMask).not.toHaveBeenCalled()
  })

  it('should call accumulator with defaults for Alpha', () => {
    const mask = makeTestAlphaMask(4, 4, 1)
    const result = mutator.blendMask(
      src,
      mask,
    )
    expect(result).toEqual(true)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(0, 0, src.w, src.h)
    expect(spyDeps.blendPixelDataAlphaMask).toHaveBeenCalledExactlyOnceWith(target, src, mask, undefined)
    expect(spyDeps.blendPixelDataBinaryMask).not.toHaveBeenCalled()

  })

  it('should return false when out of bounds', () => {
    const mask = makeTestAlphaMask(4, 4, 1)
    const opts = {
      x: 1000,
      y: 1000,
    }
    const result = mutator.blendMask(
      src,
      mask,
      opts,
    )
    expect(result).toEqual(false)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(opts.x, opts.y, src.w, src.h)
    expect(spyDeps.blendPixelDataAlphaMask).not.toHaveBeenCalled()
    expect(spyDeps.blendPixelDataBinaryMask).not.toHaveBeenCalled()

  })
})
