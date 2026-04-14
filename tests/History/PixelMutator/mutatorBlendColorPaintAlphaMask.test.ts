import {
  blendColorPixelDataAlphaMask,
  type Color32,
  mutatorBlendColorPaintAlphaMask,
  overwritePerfect,
  type PaintAlphaMask,
  sourceOverPerfect,
} from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestAlphaMask, pack } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorBlendColorPaintAlphaMask', () => {

  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorBlendColorPaintAlphaMask, { blendColorPixelDataAlphaMask })

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  const color = pack(255, 0, 0, 255) as Color32

  it('should call accumulator', () => {
    const mask = {
      ...makeTestAlphaMask(6, 6, 255),
      centerOffsetX: 3,
      centerOffsetY: 3,
    } as PaintAlphaMask

    const x = 5
    const y = 6
    const alpha = 120
    const blendFn = overwritePerfect

    const result = mutator.blendColorPaintAlphaMask(
      color,
      mask,
      x,
      y,
      alpha,
      blendFn,
    )

    const tx = x + mask.centerOffsetX
    const ty = y + mask.centerOffsetY

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(
      tx,
      ty,
      mask.w,
      mask.h,
    )

    const expectedOpts = {
      x: tx,
      y: ty,
      alpha,
      blendFn,
    }

    expect(spyDeps.blendColorPixelDataAlphaMask).toHaveBeenCalledExactlyOnceWith(
      target,
      color,
      mask,
      expect.objectContaining(expectedOpts),
    )

    expect(result).toBe(true)
  })

  it('should call accumulator with defaults', () => {
    const mask = {
      ...makeTestAlphaMask(6, 6, 255),
      centerOffsetX: 3,
      centerOffsetY: 3,
    } as PaintAlphaMask

    const x = 5
    const y = 6

    const result = mutator.blendColorPaintAlphaMask(
      color,
      mask,
      x,
      y,
    )

    const tx = x + mask.centerOffsetX
    const ty = y + mask.centerOffsetY

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(
      tx,
      ty,
      mask.w,
      mask.h,
    )

    const expectedOpts = {
      x: tx,
      y: ty,
      alpha: 255,
      blendFn: sourceOverPerfect,
    }

    expect(spyDeps.blendColorPixelDataAlphaMask).toHaveBeenCalledExactlyOnceWith(
      target,
      color,
      mask,
      expect.objectContaining(expectedOpts),
    )

    expect(result).toBe(true)
  })

  it('should return false on out of bounds region', () => {
    const mask = {
      ...makeTestAlphaMask(6, 6, 255),
      centerOffsetX: 3,
      centerOffsetY: 3,
    } as PaintAlphaMask

    const x = 5000
    const y = 6000

    const result = mutator.blendColorPaintAlphaMask(
      color,
      mask,
      x,
      y,
    )

    const tx = x + mask.centerOffsetX
    const ty = y + mask.centerOffsetY

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(
      tx,
      ty,
      mask.w,
      mask.h,
    )

    expect(spyDeps.blendColorPixelDataAlphaMask).not.toHaveBeenCalled()

    expect(result).toBe(false)
  })
})
