import { describe, expect, it, vi } from 'vitest'
import { type Color32, fillPixelData, mutatorFill, type Rect } from '@/index'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorFill', () => {
  it('should call accumulator and fillPixelData with correct rect', () => {
    const color = 0xFF0000FF as Color32
    const rect: Partial<Rect> = { x: 10, y: 10, w: 50, h: 50 }
    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorFill, { fillPixelData: fillPixelDataSpy })

    mutator.fill(color, rect)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(10, 10, 50, 50)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, color, 10, 10, 50, 50)
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
