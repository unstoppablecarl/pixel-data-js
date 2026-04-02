import { blendPixel, type Color32, mutatorBlendPixel, mutatorBlendPixelData } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorBlendPixelData', () => {
  it('should call accumulator and blendPixel with args', () => {
    const color = 0xffffffff as Color32
    const x = 20
    const y = 20
    const alpha = 120
    const blendFn = vi.fn()
    const blendPixelSpy = vi.fn(blendPixel)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorBlendPixel, { blendPixel: blendPixelSpy })

    mutator.blendPixel(x, y, color, alpha, blendFn)

    expect(accumulator.storePixelBeforeState).toHaveBeenCalledWith(x, y)
    expect(blendPixelSpy).toHaveBeenCalledWith(target, x, y, color, alpha, blendFn)
  })

  it('should call accumulator and blendPixel with defaults', () => {
    const color = 0xffffffff as Color32
    const x = 20
    const y = 20

    const blendPixelSpy = vi.fn(blendPixel)

    const {
      mutator,
      accumulator,
      target,
    } = mockAccumulatorMutator(mutatorBlendPixel, { blendPixel: blendPixelSpy })

    mutator.blendPixel(x, y, color)

    expect(accumulator.storePixelBeforeState).toHaveBeenCalledWith(x, y)
    expect(blendPixelSpy).toHaveBeenCalledWith(target, x, y, color, undefined, undefined)
  })
})
