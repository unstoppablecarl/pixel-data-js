import { makeFullPixelMutator, PixelAccumulator, PixelEngineConfig, PixelTilePool, PixelWriter } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData } from '../_helpers'

describe('PixelMutator', () => {
  it('makeFullPixelMutator should create a mutator with all methods', () => {
    const target = makeTestPixelData(100, 100)
    const config = new PixelEngineConfig(16, target)
    const tilePool = new PixelTilePool(config)
    const accumulator = new PixelAccumulator(config, tilePool)

    const writer = {
      target,
      accumulator,
    } as unknown as PixelWriter<any>
    const mutator = makeFullPixelMutator(writer)

    const expected = [
      // @sort
      "blendColor",
      "blendPixel",
      "blendPixelData",
      "blendPixelDataAlphaMask",
      "blendPixelDataBinaryMask",
      "clear",
      "fill",
      "fillBinaryMask",
      "fillRect",
      "invert",
    ].sort()

    expect(Object.keys(mutator).sort()).toEqual(expected)
  })
})
