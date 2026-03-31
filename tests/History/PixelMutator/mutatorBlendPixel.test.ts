import { type Color32, mutatorBlendPixel, sourceOverFast } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorBlendPixel', () => {

  it('should call accumulator and modify the pixel data', () => {
    const x = 10
    const y = 20
    const color = 0xFF0000FF as Color32

    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorBlendPixel)

    mutator.blendPixel(x, y, color)

    expect(accumulator.storeTileBeforeState).toHaveBeenCalledWith(x, y)

    const index = y * target.width + x
    expect(target.data32[index]).toBe(color)
  })

  it('should not do anything if coordinates are out of bounds', () => {
    const { mutator, accumulator, target } = mockAccumulatorMutator(mutatorBlendPixel)

    mutator.blendPixel(-1, 10, 0xFFFFFFFF as Color32)
    mutator.blendPixel(10, -1, 0xFFFFFFFF as Color32)
    mutator.blendPixel(target.width, 10, 0xFFFFFFFF as Color32)
    mutator.blendPixel(10, target.height, 0xFFFFFFFF as Color32)

    expect(accumulator.storeTileBeforeState).not.toHaveBeenCalled()
    expect(target.data32.some((p) => p !== 0)).toBe(false)
  })

  it('should apply partial alpha correctly', () => {
    const x = 5
    const y = 5
    const color = 0xFF0000FF as Color32
    const alpha = 128

    const { mutator, target } = mockAccumulatorMutator(mutatorBlendPixel)

    mutator.blendPixel(x, y, color, alpha, sourceOverFast)

    const index = y * target.width + x
    const finalColor = target.data32[index]
    const finalAlpha = finalColor >>> 24

    expect(finalAlpha).toBeCloseTo(128, -1)
  })

  it('should use the specified blend function', () => {
    const x = 1
    const y = 1
    const bgColor = 0xFF00FF00 as Color32
    const srcColor = 0x80FF0000 as Color32

    const { mutator, target } = mockAccumulatorMutator(mutatorBlendPixel)

    const index = y * target.width + x
    target.data32[index] = bgColor

    const blendFn = vi.fn().mockReturnValue(0xDEADBEEF as Color32)

    mutator.blendPixel(x, y, srcColor, 255, blendFn)

    expect(blendFn).toHaveBeenCalledWith(srcColor, bgColor)
    expect(target.data32[index]).toBe(0xDEADBEEF)
  })
})
