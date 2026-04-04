import {
  blendColorPixelDataAlphaMask,
  blendColorPixelDataBinaryMask,
  type Color32,
  mutatorBlendColorPaintMask,
  overwritePerfect,
  type PaintAlphaMask,
  type PaintBinaryMask,
  sourceOverPerfect,
} from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestAlphaMask, makeTestBinaryMask, pack } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorBlendColorPaintMask', () => {

  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorBlendColorPaintMask, { blendColorPixelDataBinaryMask, blendColorPixelDataAlphaMask })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  const color = pack(255, 0, 0, 255) as Color32

  it('should call accumulator for Binary', () => {
    const mask = {
      ...makeTestBinaryMask(4, 4, 1),
      centerOffsetX: 4,
      centerOffsetY: 3,
    } as PaintBinaryMask

    const x = 5
    const y = 6
    const alpha = 100
    const blendFn = overwritePerfect

    const result = mutator.blendColorPaintMask(
      color,
      mask,
      x,
      y,
      alpha,
      blendFn,
    )

    const tx = x + mask.centerOffsetX
    const ty = y + mask.centerOffsetY

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
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

    expect(spyDeps.blendColorPixelDataBinaryMask).toHaveBeenCalledWith(
      target,
      color,
      mask,
      expect.objectContaining(expectedOpts),
    )

    expect(spyDeps.blendColorPixelDataAlphaMask).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should call accumulator with defaults for Binary', () => {
    const mask = {
      ...makeTestBinaryMask(4, 4, 1),
      centerOffsetX: 2,
      centerOffsetY: 3,
    } as PaintBinaryMask

    const x = 5
    const y = 6

    const result = mutator.blendColorPaintMask(
      color,
      mask,
      x,
      y,
    )

    const tx = x + mask.centerOffsetX
    const ty = y + mask.centerOffsetY

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
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

    expect(spyDeps.blendColorPixelDataBinaryMask).toHaveBeenCalledWith(
      target,
      color,
      mask,
      expect.objectContaining(expectedOpts),
    )

    expect(spyDeps.blendColorPixelDataAlphaMask).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should call accumulator for Alpha', () => {
    const mask = {
      ...makeTestAlphaMask(4, 4, 255),
      centerOffsetX: -1,
      centerOffsetY: -2,
    } as PaintAlphaMask

    const x = 1
    const y = 2
    const alpha = 100
    const blendFn = overwritePerfect

    const result = mutator.blendColorPaintMask(
      color,
      mask,
      x,
      y,
      alpha,
      blendFn,
    )

    const tx = x + mask.centerOffsetX
    const ty = y + mask.centerOffsetY

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
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

    expect(spyDeps.blendColorPixelDataAlphaMask).toHaveBeenCalledWith(
      target,
      color,
      mask,
      expect.objectContaining(expectedOpts),
    )

    expect(spyDeps.blendColorPixelDataBinaryMask).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should call accumulator with defaults for Alpha', () => {
    const mask = {
      ...makeTestAlphaMask(4, 4, 1),
      centerOffsetX: 0,
      centerOffsetY: 0,
    } as PaintAlphaMask

    const x = 5
    const y = 6

    const result = mutator.blendColorPaintMask(
      color,
      mask,
      x,
      y,
    )

    const tx = x + mask.centerOffsetX
    const ty = y + mask.centerOffsetY

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
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

    expect(spyDeps.blendColorPixelDataAlphaMask).toHaveBeenCalledWith(
      target,
      color,
      mask,
      expect.objectContaining(expectedOpts),
    )

    expect(spyDeps.blendColorPixelDataBinaryMask).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

})
