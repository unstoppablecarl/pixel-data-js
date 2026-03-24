import { describe, expect, it } from 'vitest'
import { makeFullPixelMutator, PixelAccumulator, PixelData, PixelEngineConfig, PixelWriter } from '@/index'

describe('PixelMutator', () => {
  it('makeFullPixelMutator should create a mutator with all methods', () => {
    const config = new PixelEngineConfig(16)
    const target = new PixelData(new ImageData(100, 100))
    const accumulator = new PixelAccumulator(target, config)

    const writer = {
      target,
      accumulator,
    } as unknown as PixelWriter<any>
    const mutator = makeFullPixelMutator(writer)

    const expected = [
      'applyAlphaMask',
      'applyBinaryMask',
      'applyCircleBrush',
      'applyCircleBrushStroke',
      'applyCirclePencilStroke',
      'applyRectBrush',
      'applyRectBrushStroke',
      'applyRectPencil',
      'applyRectPencilStroke',
      'blendColor',
      'blendPixel',
      'blendPixelData',
      'clear',
      'fill',
      'invert',
    ].sort()

    expect(Object.keys(mutator).sort()).toEqual(expected)
  })
})
