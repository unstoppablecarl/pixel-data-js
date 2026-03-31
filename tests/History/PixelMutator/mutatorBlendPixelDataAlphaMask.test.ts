import { blendPixelDataAlphaMask, mutatorBlendPixelDataAlphaMask, PixelData } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { makeTestAlphaMask } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorBlendPixelDataAlphaMask', () => {
  it('should call accumulator and blendPixelDataAlphaMask with args', () => {
    const source = new PixelData(new ImageData(10, 10))
    const options = {
      x: 20,
      y: 20,
    }

    const blendPixelDataAlphaMaskSpy = vi.fn(blendPixelDataAlphaMask)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorBlendPixelDataAlphaMask, { blendPixelDataAlphaMask: blendPixelDataAlphaMaskSpy })

    const mask = makeTestAlphaMask(10, 10)
    mutator.blendPixelDataAlphaMask(source, mask, options)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(20, 20, source.width, source.height)
    expect(blendPixelDataAlphaMaskSpy).toHaveBeenCalledWith(target, source, mask, options)
  })

  it('should call accumulator and blendPixelDataAlphaMask with defaults', () => {
    const source = new PixelData(new ImageData(10, 10))

    const blendPixelDataAlphaMaskSpy = vi.fn(blendPixelDataAlphaMask)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorBlendPixelDataAlphaMask, { blendPixelDataAlphaMask: blendPixelDataAlphaMaskSpy })

    const mask = makeTestAlphaMask(10, 10)
    mutator.blendPixelDataAlphaMask(source, mask)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(0, 0, source.width, source.height)

    expect(blendPixelDataAlphaMaskSpy).toHaveBeenCalledWith(target, source, mask, {})
  })
})
