import { describe, expect, it, vi } from 'vitest'
import { type BinaryMask, type BinaryMaskRect, type Color32, fillPixelData, mutatorFill, type Rect } from '@/index'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorFill', () => {
  it('should call accumulator and fillPixelData with correct rect', () => {
    const color = 0xFF0000FF as Color32
    const r: Partial<Rect> = { x: 10, y: 10, w: 50, h: 50 }
    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorFill, { fillPixelData: fillPixelDataSpy })

    mutator.fill(color, r)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(r.x, r.y, r.w, r.h)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, color, r.x, r.y, r.w, r.h, undefined)
  })

  it('should call accumulator and fillPixelData with correct rect and mask', () => {
    const color = 0xFF0000FF as Color32
    const mask = new Uint8Array([1, 1, 1, 1]) as BinaryMask
    const r: Partial<BinaryMaskRect> = { x: 10, y: 10, w: 50, h: 50, mask }
    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorFill, { fillPixelData: fillPixelDataSpy })

    mutator.fill(color, r)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(r.x, r.y, r.w, r.h)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, color, r.x, r.y, r.w, r.h, mask)
  })

  it('should use default dimensions if rect is not provided', () => {
    const color = 0xFF0000FF as Color32
    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorFill, { fillPixelData: fillPixelDataSpy })

    mutator.fill(color)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.width, target.height)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, color, 0, 0, target.width, target.height, undefined)
  })
})
