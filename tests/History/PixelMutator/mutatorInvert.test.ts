import { invertPixelData, mutatorInvert } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorInvert', () => {
  it('should call accumulator and invertPixelData', () => {
    const options = {
      x: 15,
      y: 15,
      w: 30,
      h: 30,
    }
    const invertPixelDataSpy = vi.fn(invertPixelData)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorInvert, { invertPixelData: invertPixelDataSpy })

    mutator.invert(options)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(15, 15, 30, 30)
    expect(invertPixelDataSpy).toHaveBeenCalledWith(target, options)
  })
})
