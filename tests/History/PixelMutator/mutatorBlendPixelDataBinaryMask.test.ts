import { blendPixelDataBinaryMask, mutatorBlendPixelDataBinaryMask, PixelData } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { makeTestBinaryMask } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorBlendPixelDataBinaryMask', () => {
  it('should call accumulator and blendPixelDataBinaryMask with args', () => {
    const source = new PixelData(new ImageData(10, 10))
    const options = {
      x: 20,
      y: 20,
    }

    const blendPixelDataBinaryMaskSpy = vi.fn(blendPixelDataBinaryMask)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorBlendPixelDataBinaryMask, { blendPixelDataBinaryMask: blendPixelDataBinaryMaskSpy })

    const mask = makeTestBinaryMask(10, 10)
    mutator.blendPixelDataBinaryMask(source, mask, options)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(20, 20, source.width, source.height)
    expect(blendPixelDataBinaryMaskSpy).toHaveBeenCalledWith(target, source, mask, options)
  })

  it('should call accumulator and blendPixelDataBinaryMask with defaults', () => {
    const source = new PixelData(new ImageData(10, 10))

    const blendPixelDataBinaryMaskSpy = vi.fn(blendPixelDataBinaryMask)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorBlendPixelDataBinaryMask, { blendPixelDataBinaryMask: blendPixelDataBinaryMaskSpy })

    const mask = makeTestBinaryMask(10, 10)
    mutator.blendPixelDataBinaryMask(source, mask)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, source.width, source.height)

    expect(blendPixelDataBinaryMaskSpy).toHaveBeenCalledWith(target, source, mask, {})
  })
})
