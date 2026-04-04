import { blendPixel, type Color32, mutatorBlendPixel } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMutator } from './_helpers'

describe('mutatorBlendPixel', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
  } = mockMutator(mutatorBlendPixel, { blendPixel })

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('should call accumulator', () => {
    const color = 0xffffffff as Color32
    const x = 20
    const y = 20
    const alpha = 120
    const blendFn = vi.fn()

    mutator.blendPixel(x, y, color, alpha, blendFn)

    expect(accumulator.storePixelBeforeState).toHaveBeenCalledWith(x, y)
    expect(spyDeps.blendPixel).toHaveBeenCalledWith(target, x, y, color, alpha, blendFn)
  })

  it('should call accumulator with defaults', () => {
    const color = 0xffffffff as Color32
    const x = 20
    const y = 20

    mutator.blendPixel(x, y, color)

    expect(accumulator.storePixelBeforeState).toHaveBeenCalledWith(x, y)
    expect(spyDeps.blendPixel).toHaveBeenCalledWith(target, x, y, color, undefined, undefined)
  })
})
