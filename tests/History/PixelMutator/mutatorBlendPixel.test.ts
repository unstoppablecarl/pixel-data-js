import { blendPixel, type Color32, mutatorBlendPixel } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMutator } from './_helpers'

describe('mutatorBlendPixel', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorBlendPixel, { blendPixel })

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator', () => {
    const color = 0xffffffff as Color32
    const x = 4
    const y = 5
    const alpha = 120
    const blendFn = vi.fn()

    const result = mutator.blendPixel(x, y, color, alpha, blendFn)
    expect(result).toEqual(true)

    expect(accumulator.storePixelBeforeState).toHaveBeenCalledExactlyOnceWith(x, y)
    expect(spyDeps.blendPixel).toHaveBeenCalledExactlyOnceWith(target, x, y, color, alpha, blendFn)
  })

  it('should call accumulator with defaults', () => {
    const color = 0xffffffff as Color32
    const x = 6
    const y = 7

    const result = mutator.blendPixel(x, y, color)
    expect(result).toEqual(true)

    expect(accumulator.storePixelBeforeState).toHaveBeenCalledExactlyOnceWith(x, y)
    expect(spyDeps.blendPixel).toHaveBeenCalledExactlyOnceWith(target, x, y, color, undefined, undefined)
  })

  it('should return false when out of bounds', () => {
    const color = 0xffffffff as Color32
    const x = 6000
    const y = 7000

    const result = mutator.blendPixel(x, y, color)
    expect(result).toEqual(false)

    expect(accumulator.storePixelBeforeState).toHaveBeenCalledExactlyOnceWith(x, y)
    expect(spyDeps.blendPixel).not.toHaveBeenCalled()
  })
})
