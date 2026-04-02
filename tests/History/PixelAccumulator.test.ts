import { PixelAccumulator, PixelData, PixelEngineConfig, PixelTile, PixelTilePool } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestPixelData } from '../_helpers'

describe('PixelAccumulator', () => {
  let accumulator: PixelAccumulator
  let target: PixelData
  let config: PixelEngineConfig
  let tilePool: PixelTilePool

  const TILE_SIZE = 4
  const IMAGE_WIDTH = 10

  beforeEach(() => {
    target = makeTestPixelData(10, 10)
    config = new PixelEngineConfig(TILE_SIZE, target)
    tilePool = new PixelTilePool(config)
    accumulator = new PixelAccumulator(config, tilePool)

    let imageData = target.imageData
    let length = imageData.data.length / 4

    // Fill with a predictable pattern (pixel index)
    for (let i = 0; i < length; i++) {
      imageData.data[i * 4 + 0] = i // Use R channel to store index
    }
  })

  it('should be constructed correctly', () => {
    expect(accumulator.config.target).toBe(target)
    expect(accumulator.config).toBe(config)
    expect(accumulator.lookup).toEqual([])
    expect(accumulator.beforeTiles).toEqual([])
    expect(accumulator.tilePool).toBe(tilePool)
  })

  describe('storeTileBeforeState', () => {
    it('should store the state of a single tile', () => {
      let extractSpy = vi.spyOn(accumulator, 'extractState')

      // Corresponds to tile (tx=1, ty=1)
      let finalizeHistory = accumulator.storePixelBeforeState(5, 5)

      expect(accumulator.beforeTiles.length).toBe(1)
      expect(accumulator.lookup.length).toBeGreaterThan(0)

      let tile = accumulator.beforeTiles[0]
      expect(tile.tx).toBe(1)
      expect(tile.ty).toBe(1)
      expect(extractSpy).toHaveBeenCalledWith(tile)

      // Confirm changes
      finalizeHistory(true)
      expect(accumulator.beforeTiles.length).toBe(1)
    })

    it('should not store the same tile twice', () => {
      let finalize1 = accumulator.storePixelBeforeState(5, 5) // Tile (1,1)
      let finalize2 = accumulator.storePixelBeforeState(6, 6) // Still tile (1,1)

      expect(accumulator.beforeTiles.length).toBe(1)

      finalize1(true)
      finalize2(true)

      expect(accumulator.beforeTiles.length).toBe(1)
    })

    it('should rollback the tile if the closure is called with false', () => {
      let finalizeHistory = accumulator.storePixelBeforeState(5, 5)

      expect(accumulator.beforeTiles.length).toBe(1)

      // Operation resulted in no changes, discard history state
      finalizeHistory(false)

      expect(accumulator.beforeTiles.length).toBe(0)
      expect(accumulator.lookup.some(t => t !== undefined)).toBe(false)
      expect(tilePool.pool.length).toBe(1) // Tile returned to pool
    })
  })

  describe('storeRegionBeforeState', () => {
    it('should store tiles for a region spanning multiple tiles', () => {
      // Region from (2,2) to (7,7), should cover tiles (0,0), (1,0), (0,1), (1,1)
      let finalizeHistory = accumulator.storeRegionBeforeState(
        2,
        2,
        6,
        6,
      )

      expect(accumulator.beforeTiles.length).toBe(4)

      let coords = accumulator.beforeTiles.map(t => `${t.tx},${t.ty}`)
      expect(coords).toContain('0,0')
      expect(coords).toContain('1,0')
      expect(coords).toContain('0,1')
      expect(coords).toContain('1,1')

      finalizeHistory(true)
      expect(accumulator.beforeTiles.length).toBe(4)
    })

    it('should handle a region within a single tile', () => {
      let finalizeHistory = accumulator.storeRegionBeforeState(
        1,
        1,
        2,
        2,
      )

      expect(accumulator.beforeTiles.length).toBe(1)
      expect(accumulator.beforeTiles[0].tx).toBe(0)
      expect(accumulator.beforeTiles[0].ty).toBe(0)

      finalizeHistory(true)
    })

    it('should discard exactly the tiles captured in this region if closure is false', () => {
      // Setup: an existing tile from a previous committed action
      let commitFirst = accumulator.storePixelBeforeState(1, 1)
      commitFirst(true)

      expect(accumulator.beforeTiles.length).toBe(1)

      // Action: a stroke that touches multiple tiles
      let finalizeStroke = accumulator.storeRegionBeforeState(
        2,
        2,
        6,
        6,
      )

      // It added 3 more tiles (since 1 was already present)
      expect(accumulator.beforeTiles.length).toBe(4)

      // Cancel stroke
      finalizeStroke(false)

      // It should strip off exactly the 3 new ones, leaving the original 1
      expect(accumulator.beforeTiles.length).toBe(1)
      expect(accumulator.beforeTiles[0].tx).toBe(0)
      expect(accumulator.beforeTiles[0].ty).toBe(0)
      expect(tilePool.pool.length).toBe(3)
    })
  })

  describe('extractState', () => {
    it('should extract state for a tile fully inside the image', () => {
      let tile = new PixelTile(
        0,
        1,
        1,
        config.tileSize,
        config.tileArea,
      )
      accumulator.extractState(tile)

      // Tile pixel at (lx,ly) corresponds to image pixel (tx*TILE_SIZE+lx, ty*TILE_SIZE+ly)
      let srcPixelValue = target.data32[4 * IMAGE_WIDTH + 4]
      expect(tile.data32[0]).toBe(srcPixelValue) // Tile (0,0) -> Image (4,4)

      let srcPixelValue2 = target.data32[7 * IMAGE_WIDTH + 7]
      expect(tile.data32[3 * TILE_SIZE + 3]).toBe(srcPixelValue2) // Tile (3,3) -> Image (7,7)
    })

    it('should pad with 0 for tiles partially outside the right edge', () => {
      let tile = new PixelTile(
        0,
        2,
        1,
        config.tileSize,
        config.tileArea,
      )
      accumulator.extractState(tile)

      // First 2 columns should have data, last 2 should be 0
      let srcPixelValue = target.data32[4 * IMAGE_WIDTH + 8]
      expect(tile.data32[0]).toBe(srcPixelValue) // Tile (0,0) -> Image (8,4)
      expect(tile.data32[1]).toBe(target.data32[4 * IMAGE_WIDTH + 9]) // Tile (0,1) -> Image (8,5)
      expect(tile.data32[2]).toBe(0) // Padded
      expect(tile.data32[3]).toBe(0) // Padded
    })

    it('should pad with 0 for tiles partially outside the bottom edge', () => {
      let tile = new PixelTile(
        0,
        1,
        2,
        config.tileSize,
        config.tileArea,
      )
      accumulator.extractState(tile)

      // First 2 rows should have data
      let row0Pixel = target.data32[8 * IMAGE_WIDTH + 4]
      let row1Pixel = target.data32[9 * IMAGE_WIDTH + 4]
      expect(tile.data32[0 * TILE_SIZE + 0]).toBe(row0Pixel)
      expect(tile.data32[1 * TILE_SIZE + 0]).toBe(row1Pixel)

      // Rows 2 and 3 should be padded with 0
      expect(tile.data32[2 * TILE_SIZE + 0]).toBe(0)
      expect(tile.data32[3 * TILE_SIZE + 0]).toBe(0)
    })

    it('should pad with 0 for tiles partially outside the left edge', () => {
      let tile = new PixelTile(
        0,
        -0.5, // Simulates a tile starting at x: -2
        0,
        config.tileSize,
        config.tileArea,
      )
      accumulator.extractState(tile)

      // First 2 columns should be padded 0, next 2 columns should have real data
      expect(tile.data32[0]).toBe(0)
      expect(tile.data32[1]).toBe(0)
      expect(tile.data32[2]).toBe(target.data32[0])
      expect(tile.data32[3]).toBe(target.data32[1])
    })

    it('should pad with 0 for tiles partially outside the top edge', () => {
      let tile = new PixelTile(
        0,
        0,
        -0.5, // Simulates a tile starting at y: -2
        config.tileSize,
        config.tileArea,
      )
      accumulator.extractState(tile)

      // First 2 rows should be padded 0, next 2 rows should have real data
      expect(tile.data32[0 * TILE_SIZE + 0]).toBe(0)
      expect(tile.data32[1 * TILE_SIZE + 0]).toBe(0)
      expect(tile.data32[2 * TILE_SIZE + 0]).toBe(target.data32[0])
      expect(tile.data32[3 * TILE_SIZE + 0]).toBe(target.data32[1 * IMAGE_WIDTH + 0])
    })

    it('should zero out the tile if completely outside the canvas (left and right)', () => {
      let leftTile = new PixelTile(
        0,
        -1, // x: -4
        0,
        config.tileSize,
        config.tileArea,
      )
      accumulator.extractState(leftTile)
      expect(leftTile.data32.every(v => v === 0)).toBe(true)

      let rightTile = new PixelTile(
        0,
        3, // x: 12
        0,
        config.tileSize,
        config.tileArea,
      )
      accumulator.extractState(rightTile)
      expect(rightTile.data32.every(v => v === 0)).toBe(true)
    })

    it('should zero out the tile if completely outside the canvas (top and bottom)', () => {
      let topTile = new PixelTile(
        0,
        0,
        -1, // y: -4
        config.tileSize,
        config.tileArea,
      )
      accumulator.extractState(topTile)
      expect(topTile.data32.every(v => v === 0)).toBe(true)

      let bottomTile = new PixelTile(
        0,
        0,
        3, // y: 12
        config.tileSize,
        config.tileArea,
      )
      accumulator.extractState(bottomTile)
      expect(bottomTile.data32.every(v => v === 0)).toBe(true)
    })
  })

  describe('extractPatch', () => {
    it('should extract the modified state of the target', () => {
      // 1. Store initial state
      let finalize = accumulator.storePixelBeforeState(1, 1)
      finalize(true)

      let originalValue = target.data32[1 * IMAGE_WIDTH + 1]

      // 2. Modify the target data
      let newValue = 0xFFFFFFFF
      target.data32[1 * IMAGE_WIDTH + 1] = newValue

      // 3. Extract "after" state
      let patch = accumulator.extractPatch()

      expect(patch.afterTiles.length).toBe(1)

      let afterTile = patch.afterTiles[0]
      let beforeTile = patch.beforeTiles[0]
      let localIndex = 1 * TILE_SIZE + 1

      expect(beforeTile.data32[localIndex]).toBe(originalValue)
      expect(afterTile.data32[localIndex]).toBe(newValue)

      // Should clear accumulator internals
      expect(accumulator.beforeTiles.length).toBe(0)
      expect(accumulator.lookup.length).toBe(0)
    })
  })

  describe('rollback', () => {
    it('should physically restore pixels, clear arrays, and release to pool', () => {
      // 1. Store state
      let finalize = accumulator.storePixelBeforeState(1, 1)
      finalize(true)

      let originalValue = target.data32[1 * IMAGE_WIDTH + 1]

      // 2. Ruin the canvas
      let newValue = 0xFFFFFFFF
      target.data32[1 * IMAGE_WIDTH + 1] = newValue
      expect(target.data32[1 * IMAGE_WIDTH + 1]).toBe(newValue)

      // 3. Hard rollback (e.g. user pressed Escape)
      accumulator.rollback()

      // 4. Verify physical canvas restoration
      expect(target.data32[1 * IMAGE_WIDTH + 1]).toBe(originalValue)

      // 5. Verify cleanup
      expect(accumulator.beforeTiles.length).toBe(0)
      expect(accumulator.lookup.length).toBe(0)
      expect(tilePool.pool.length).toBe(1) // Returned the captured tile to pool
    })
  })
})
