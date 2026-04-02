import { type Color32, fillPixelData, mutatorFill, mutatorFillRect, type Rect } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorFillRect', () => {
  it('should call accumulator and fillPixelData with correct rect', () => {
    const color = 0xFF0000FF as Color32
    const r: Rect = { x: 10, y: 10, w: 50, h: 50 }
    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorFillRect, { fillPixelData: fillPixelDataSpy })

    mutator.fillRect(color, r)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(r.x, r.y, r.w, r.h)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, color, r.x, r.y, r.w, r.h)
  })
})

describe('mutatorFill', () => {
  it('should call accumulator and fillPixelData with correct args', () => {
    const color = 0xFF0000FF as Color32
    const x = 10
    const y = 10
    const w = 50
    const h = 50

    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorFill, { fillPixelData: fillPixelDataSpy })

    mutator.fill(color, x, y, w, h)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(x, y, w, h)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, color, x, y, w, h)
  })

  it('should call accumulator and fillPixelData with correct args', () => {
    const color = 0xFF0000FF as Color32
    const r: Rect = { x: 10, y: 10, w: 50, h: 50 }
    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorFillRect, { fillPixelData: fillPixelDataSpy })

    mutator.fillRect(color, r)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(r.x, r.y, r.w, r.h)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, color, r.x, r.y, r.w, r.h)
  })

  it('should use default dimensions if rect is not provided', () => {
    const color = 0xFF0000FF as Color32
    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorFill, { fillPixelData: fillPixelDataSpy })

    mutator.fill(color)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.width, target.height)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, color, 0, 0, target.width, target.height)
  })
})

