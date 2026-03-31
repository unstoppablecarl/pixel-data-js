import { blendPixelData, mutatorBlendPixelData, PixelData } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorBlendPixelData', () => {

  it('should call accumulator and blendPixelData with args', () => {
    const source = new PixelData(new ImageData(10, 10))
    const options = {
      x: 20,
      y: 20,
    }

    const blendPixelDataSpy = vi.fn(blendPixelData)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorBlendPixelData, { blendPixelData: blendPixelDataSpy })

    mutator.blendPixelData(source, options)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(20, 20, source.width, source.height)
    expect(blendPixelDataSpy).toHaveBeenCalledWith(target, source, options)
  })

  it('should call accumulator and blendPixelData with defaults', () => {
    const source = new PixelData(new ImageData(10, 10))
    const blendPixelDataSpy = vi.fn(blendPixelData)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorBlendPixelData, { blendPixelData: blendPixelDataSpy })

    mutator.blendPixelData(source)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, source.width, source.height)
    expect(blendPixelDataSpy).toHaveBeenCalledWith(target, source, {})
  })
})
