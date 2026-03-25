import { type BinaryMask, type BinaryMaskRect, fillPixelData, mutatorClear } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorClear', () => {

  it('should call accumulator and clearPixelData with correct rect', () => {
    const r: Partial<BinaryMaskRect> = {
      x: 10,
      y: 10,
      w: 50,
      h: 50,
    }
    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorClear, { fillPixelData: fillPixelDataSpy })

    mutator.clear(r)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(r.x, r.y, r.w, r.h)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, 0, r.x, r.y, r.w, r.h, undefined)
  })

  it('should call accumulator and clearPixelData with correct rect and mask', () => {
    const r: Partial<BinaryMaskRect> = {
      x: 10,
      y: 10,
      w: 50,
      h: 50,
      mask: new Uint8Array([1, 1, 1, 1]) as BinaryMask,
    }
    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorClear, { fillPixelData: fillPixelDataSpy })

    mutator.clear(r)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(r.x, r.y, r.w, r.h)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, 0, r.x, r.y, r.w, r.h, r.mask)
  })

  it('should use default dimensions if rect is not provided', () => {
    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const {
      mutator, accumulator, target,
    } = mockAccumulatorMutator(mutatorClear, { fillPixelData: fillPixelDataSpy })

    mutator.clear()

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.width, target.height)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, 0, 0, 0, target.width, target.height, undefined)
  })
})
