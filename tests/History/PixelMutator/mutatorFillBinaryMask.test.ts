import { type BinaryMaskRect, type Color32, fillPixelDataBinaryMask, mutatorFillBinaryMask } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { makeTestBinaryMask } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorFillBinaryMask', () => {

  it('should call accumulator and fillPixelData with correct rect and mask', () => {
    const color = 0xFF0000FF as Color32
    const mask = makeTestBinaryMask(2, 2, 1)
    const r: Partial<BinaryMaskRect> = { x: 10, y: 10, w: 50, h: 50, mask }
    const fillPixelDataBinaryMaskSpy = vi.fn(fillPixelDataBinaryMask) as unknown as typeof fillPixelDataBinaryMask

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorFillBinaryMask, { fillPixelDataBinaryMask: fillPixelDataBinaryMaskSpy })

    mutator.fillBinaryMask(color, mask, r)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(r.x, r.y, r.w, r.h)
    expect(fillPixelDataBinaryMaskSpy).toHaveBeenCalledWith(target, color, mask, r.x, r.y, r.w, r.h)
  })

  it('should use default dimensions if rect is not provided', () => {
    const color = 0xFF0000FF as Color32
    const fillPixelDataBinaryMaskSpy = vi.fn(fillPixelDataBinaryMask) as unknown as typeof fillPixelDataBinaryMask
    const mask = makeTestBinaryMask(2, 2, 1)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorFillBinaryMask, { fillPixelDataBinaryMask: fillPixelDataBinaryMaskSpy })

    mutator.fillBinaryMask(color, mask)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.width, target.height)
    expect(fillPixelDataBinaryMaskSpy).toHaveBeenCalledWith(target, color, mask, 0, 0, target.width, target.height)
  })
})
