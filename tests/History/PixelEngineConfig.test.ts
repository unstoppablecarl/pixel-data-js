import { makeTileTargetConfig } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData } from '../_helpers'

describe('PixelEngineConfig', () => {
  it('should initialize with a valid power-of-two tileSize', () => {
    const target = makeTestPixelData(10, 10)
    const tileSize = 128
    const config = makeTileTargetConfig(tileSize, target)

    expect(config.tileSize).toBe(tileSize)
    expect(config.targetWidth).toBe(target.w)
    expect(config.targetHeight).toBe(target.w)
    expect(config.tileArea).toBe(16384) // 128 * 128
    expect(config.targetColumns).toBe(1)
    expect(config.targetRows).toBe(1)
    expect(config.target).toBe(target) // 128 * 128

  })

  it('should handle tileSize of 1', () => {
    const target = makeTestPixelData(10, 10)

    const config = makeTileTargetConfig(1, target)
    expect(config.tileSize).toBe(1)
    expect(config.targetWidth).toBe(target.w)
    expect(config.targetHeight).toBe(target.w)
    expect(config.tileArea).toBe(1)
    expect(config.targetColumns).toBe(10)
    expect(config.targetRows).toBe(10)
  })
})
