import { beforeEach, describe, expect, it, vi } from 'vitest'
import { blendColorPixelData, blendPixelData, type Color32, mutatorBlendColor } from '@/index'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorBlendColor', () => {


  it('should call accumulator and blendColorPixelData', () => {
    const color = 0xFF0000FF as Color32
    const options = {
      x: 10,
      y: 10,
      w: 20,
      h: 20,
    }

    const blendColorPixelDataSpy = vi.fn(blendColorPixelData)


    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorBlendColor, {blendColorPixelData: blendColorPixelDataSpy})

    mutator.blendColor(color, options)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(10, 10, 20, 20)
    expect(blendColorPixelDataSpy).toHaveBeenCalledWith(target, color, options)
  })
})
