import { PixelEngineConfig } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData } from '../_helpers'

describe('PixelEngineConfig', () => {
  it('should initialize with a valid power-of-two tileSize', () => {
    const target = makeTestPixelData(10, 10)
    const tileSize = 128
    const config = new PixelEngineConfig(tileSize, target)

    expect(config.tileSize).toBe(tileSize)
    expect(config.tileShift).toBe(7) // log2(128)
    expect(config.tileMask).toBe(127) // 128 - 1
    expect(config.tileArea).toBe(16384) // 128 * 128
    expect(config.targetColumns).toBe(1)
    expect(config.targetRows).toBe(1)
    expect(config.target).toBe(target) // 128 * 128

  })

  it('should throw an error if tileSize is not a power of two', () => {
    const target = makeTestPixelData(10, 10)
    const createConfigWithInvalidTileSize = () => new PixelEngineConfig(100, target)
    expect(createConfigWithInvalidTileSize).toThrow('tileSize must be a power of 2')
  })

  it('should handle tileSize of 1', () => {
    const target = makeTestPixelData(10, 10)

    const config = new PixelEngineConfig(1, target)
    expect(config.tileSize).toBe(1)
    expect(config.tileShift).toBe(0)
    expect(config.tileMask).toBe(0)
    expect(config.tileArea).toBe(1)
    expect(config.targetColumns).toBe(10)
    expect(config.targetRows).toBe(10)
  })
})
