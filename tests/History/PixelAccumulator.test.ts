import { PixelAccumulator, PixelData, PixelEngineConfig, type PixelPatchTiles, PixelTile } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('PixelAccumulator', () => {
  let accumulator: PixelAccumulator
  let target: PixelData
  let config: PixelEngineConfig
  const TILE_SIZE = 4
  const IMAGE_WIDTH = 10
  const IMAGE_HEIGHT = 10

  beforeEach(() => {
    config = new PixelEngineConfig(TILE_SIZE)
    const imageData = new ImageData(IMAGE_WIDTH, IMAGE_HEIGHT)
    // Fill with a predictable pattern (pixel index)
    for (let i = 0; i < imageData.data.length / 4; i++) {
      imageData.data[i * 4 + 0] = i // Use R channel to store index
    }
    target = new PixelData(imageData)
    accumulator = new PixelAccumulator(target, config)
  })

  it('should be constructed correctly', () => {
    expect(accumulator.target).toBe(target)
    expect(accumulator.config).toBe(config)
    expect(accumulator.lookup).toEqual([])
    expect(accumulator.beforeTiles).toEqual([])
    expect(accumulator.pool).toEqual([])
  })

  describe('getTile', () => {
    it('should create a new tile when the pool is empty', () => {
      const tile = accumulator.getTile(1, 2, 3)
      expect(tile).toBeInstanceOf(PixelTile)
      expect(tile.id).toBe(1)
      expect(tile.tx).toBe(2)
      expect(tile.ty).toBe(3)
      expect(tile.data32.length).toBe(config.tileArea)
      expect(accumulator.pool.length).toBe(0)
    })

    it('should reuse a tile from the pool', () => {
      const pooledTile = new PixelTile(99, 99, 99, config.tileArea)
      accumulator.pool.push(pooledTile)

      const tile = accumulator.getTile(1, 2, 3)
      expect(tile).toBe(pooledTile) // Should be the same object
      expect(tile.id).toBe(1)
      expect(tile.tx).toBe(2)
      expect(tile.ty).toBe(3)
      expect(accumulator.pool.length).toBe(0)
    })
  })

  describe('recyclePatch', () => {
    it('should add before and after tiles to the pool', () => {
      const patch: PixelPatchTiles = {
        beforeTiles: [new PixelTile(0, 0, 0, 16)],
        afterTiles: [new PixelTile(1, 0, 0, 16)],
      }
      accumulator.recyclePatch(patch)
      expect(accumulator.pool.length).toBe(2)
      expect(accumulator.pool).toContain(patch.beforeTiles[0])
      expect(accumulator.pool).toContain(patch.afterTiles[0])
    })

    it('should handle patches with null/undefined tiles', () => {
      const patch = {
        beforeTiles: [new PixelTile(0, 0, 0, 16), undefined],
        afterTiles: [],
      } as any
      accumulator.recyclePatch(patch)
      expect(accumulator.pool.length).toBe(1)
    })
  })

  describe('storeTileBeforeState', () => {
    it('should store the state of a single tile', () => {
      const extractSpy = vi.spyOn(accumulator, 'extractState')

      // Corresponds to tile (tx=1, ty=1)
      accumulator.storeTileBeforeState(5, 5)

      expect(accumulator.beforeTiles.length).toBe(1)
      expect(accumulator.lookup.length).toBeGreaterThan(0)

      const tile = accumulator.beforeTiles[0]
      expect(tile.tx).toBe(1)
      expect(tile.ty).toBe(1)
      expect(extractSpy).toHaveBeenCalledWith(tile)
    })

    it('should not store the same tile twice', () => {
      accumulator.storeTileBeforeState(5, 5) // Tile (1,1)
      accumulator.storeTileBeforeState(6, 6) // Still tile (1,1)
      expect(accumulator.beforeTiles.length).toBe(1)
    })
  })

  describe('storeRegionBeforeState', () => {
    it('should store tiles for a region spanning multiple tiles', () => {
      // Region from (2,2) to (7,7), should cover tiles (0,0), (1,0), (0,1), (1,1)
      accumulator.storeRegionBeforeState(2, 2, 6, 6)
      expect(accumulator.beforeTiles.length).toBe(4)
      const coords = accumulator.beforeTiles.map(t => `${t.tx},${t.ty}`)
      expect(coords).toContain('0,0')
      expect(coords).toContain('1,0')
      expect(coords).toContain('0,1')
      expect(coords).toContain('1,1')
    })

    it('should handle a region within a single tile', () => {
      accumulator.storeRegionBeforeState(1, 1, 2, 2) // All within tile (0,0)
      expect(accumulator.beforeTiles.length).toBe(1)
      expect(accumulator.beforeTiles[0].tx).toBe(0)
      expect(accumulator.beforeTiles[0].ty).toBe(0)
    })
  })

  describe('extractState', () => {
    it('should extract state for a tile fully inside the image', () => {
      const tile = new PixelTile(0, 1, 1, config.tileArea) // Tile at (4,4)
      accumulator.extractState(tile)

      // Check a few pixels from the tile against the source image
      // Source pixel at (x,y) has value y * width + x
      // Tile pixel at (lx,ly) corresponds to image pixel (tx*TILE_SIZE+lx, ty*TILE_SIZE+ly)
      const srcPixelValue = target.data32[4 * IMAGE_WIDTH + 4]
      expect(tile.data32[0]).toBe(srcPixelValue) // Tile (0,0) -> Image (4,4)

      const srcPixelValue2 = target.data32[7 * IMAGE_WIDTH + 7]
      expect(tile.data32[3 * TILE_SIZE + 3]).toBe(srcPixelValue2) // Tile (3,3) -> Image (7,7)
    })

    it('should pad with 0 for tiles partially outside the right edge', () => {
      const tile = new PixelTile(0, 2, 1, config.tileArea) // Tile at (8,4), width is 10
      accumulator.extractState(tile)

      // First 2 columns should have data, last 2 should be 0
      const srcPixelValue = target.data32[4 * IMAGE_WIDTH + 8]
      expect(tile.data32[0]).toBe(srcPixelValue) // Tile (0,0) -> Image (8,4)
      expect(tile.data32[1]).toBe(target.data32[4 * IMAGE_WIDTH + 9]) // Tile (0,1) -> Image (8,5)
      expect(tile.data32[2]).toBe(0) // Padded
      expect(tile.data32[3]).toBe(0) // Padded
    })

    it('should pad with 0 for tiles partially outside the bottom edge', () => {
      const tile = new PixelTile(0, 1, 2, config.tileArea) // Tile at (4,8), height is 10
      accumulator.extractState(tile)

      // First 2 rows should have data
      const row0Pixel = target.data32[8 * IMAGE_WIDTH + 4]
      const row1Pixel = target.data32[9 * IMAGE_WIDTH + 4]
      expect(tile.data32[0 * TILE_SIZE + 0]).toBe(row0Pixel)
      expect(tile.data32[1 * TILE_SIZE + 0]).toBe(row1Pixel)
      // Rows 2 and 3 should be padded with 0
      expect(tile.data32[2 * TILE_SIZE + 0]).toBe(0)
      expect(tile.data32[3 * TILE_SIZE + 0]).toBe(0)
    })
  })

  describe('extractAfterTiles', () => {
    it('should extract the modified state of the target', () => {
      // 1. Store initial state
      accumulator.storeTileBeforeState(1, 1) // Tile (0,0)
      const originalValue = target.data32[1 * IMAGE_WIDTH + 1]

      // 2. Modify the target data
      const newValue = 0xFFFFFFFF
      target.data32[1 * IMAGE_WIDTH + 1] = newValue

      // 3. Extract "after" state
      const afterTiles = accumulator.extractAfterTiles()

      expect(afterTiles.length).toBe(1)
      const afterTile = afterTiles[0]

      // Verify the after tile has the new value, and before tile has the old
      const beforeTile = accumulator.beforeTiles[0]
      const localIndex = 1 * TILE_SIZE + 1

      expect(beforeTile.data32[localIndex]).toBe(originalValue)
      expect(afterTile.data32[localIndex]).toBe(newValue)
    })
  })

  describe('reset', () => {
    it('should clear lookup and beforeTiles, but not the pool', () => {
      // Populate everything
      const pooledTile = new PixelTile(99, 99, 99, 16)
      accumulator.pool.push(pooledTile)
      accumulator.storeTileBeforeState(1, 1)

      expect(accumulator.beforeTiles.length).toBe(1)
      expect(accumulator.lookup.some(t => t)).toBe(true)
      expect(accumulator.pool.length).toBe(0) // getTile used the pooled one

      accumulator.reset()

      expect(accumulator.beforeTiles.length).toBe(0)
      expect(accumulator.lookup.length).toBe(0)
      // The pool should be untouched by reset
      expect(accumulator.pool.length).toBe(0)
    })
  })
})
