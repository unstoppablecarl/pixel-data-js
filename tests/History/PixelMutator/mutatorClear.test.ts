import { describe, expect, it, vi } from 'vitest'
import { fillPixelData, mutatorClear, type Rect } from '@/index'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorClear', () => {

  it('should call accumulator and clearPixelData with correct rect', () => {
    const rect: Partial<Rect> = {
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

    mutator.clear(rect)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(10, 10, 50, 50)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, 0, 10, 10, 50, 50)
  })

  it('should use default dimensions if rect is not provided', () => {
    const fillPixelDataSpy = vi.fn(fillPixelData) as unknown as typeof fillPixelData

    const {
      mutator, accumulator, target,
    } = mockAccumulatorMutator(mutatorClear, { fillPixelData: fillPixelDataSpy })

    mutator.clear()

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, target.width, target.height)
    expect(fillPixelDataSpy).toHaveBeenCalledWith(target, 0, 0, 0, target.width, target.height)
  })
})
