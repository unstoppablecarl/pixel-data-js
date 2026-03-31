import { PixelEngineConfig } from '@/index'
import { describe, expect, it } from 'vitest'

describe('PixelEngineConfig', () => {
  it('should initialize with a valid power-of-two tileSize', () => {
    const tileSize = 128
    const config = new PixelEngineConfig(tileSize)

    expect(config.tileSize).toBe(tileSize)
    expect(config.tileShift).toBe(7) // log2(128)
    expect(config.tileMask).toBe(127) // 128 - 1
    expect(config.tileArea).toBe(16384) // 128 * 128
  })

  it('should use the default tileSize of 256 if none is provided', () => {
    const config = new PixelEngineConfig()

    expect(config.tileSize).toBe(256)
    expect(config.tileShift).toBe(8)
    expect(config.tileMask).toBe(255)
    expect(config.tileArea).toBe(65536)
  })

  it('should throw an error if tileSize is not a power of two', () => {
    const createConfigWithInvalidTileSize = () => new PixelEngineConfig(100)
    expect(createConfigWithInvalidTileSize).toThrow('tileSize must be a power of 2')
  })

  it('should handle tileSize of 1', () => {
    const config = new PixelEngineConfig(1)
    expect(config.tileSize).toBe(1)
    expect(config.tileShift).toBe(0)
    expect(config.tileMask).toBe(0)
    expect(config.tileArea).toBe(1)
  })
})
