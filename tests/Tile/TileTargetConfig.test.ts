import type { PixelData } from '@/index'
import { makeTileTargetConfig, makeTileTargetMeta } from '@/index'
import { describe, expect, it } from 'vitest'

describe('tile factory', () => {
  const mockPixelData = {
    w: 100,
    h: 64,
    data: new Uint32Array(100 * 64),
  } as PixelData

  describe('makeTileTargetMeta', () => {
    it('calculates correct grid dimensions for clean divisions', () => {
      const tileSize = 16
      const meta = makeTileTargetMeta(tileSize, mockPixelData)

      expect(meta.targetColumns).toBe(7) // ceil(100 / 16) = 7
      expect(meta.targetRows).toBe(4) // 64 / 16 = 4
    })

    it('calculates mathematical helpers correctly', () => {
      const tileSize = 8
      const meta = makeTileTargetMeta(tileSize, mockPixelData)

      expect(meta.tileSize).toBe(8)
      expect(meta.invTileSize).toBe(0.125)
      expect(meta.tileArea).toBe(64)
    })

    it('handles small targets that fit within one tile', () => {
      const smallTarget = {
        w: 4,
        h: 4,
      } as PixelData
      const meta = makeTileTargetMeta(16, smallTarget)

      expect(meta.targetColumns).toBe(1)
      expect(meta.targetRows).toBe(1)
    })
  })

  describe('makeTileTargetConfig', () => {
    it('integrates target and meta into a single object', () => {
      const tileSize = 32
      const config = makeTileTargetConfig(tileSize, mockPixelData)

      expect(config.target).toBe(mockPixelData)
      expect(config.targetWidth).toBe(100)
      expect(config.targetColumns).toBe(4)
    })
  })
})
