import { makePixelTile, PixelAccumulator, type PixelData, PixelEngineConfig, PixelTilePool } from '@/index'
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
      let tile = makePixelTile(
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
      let tile = makePixelTile(
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
      let tile = makePixelTile(
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
      let tile = makePixelTile(
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
      let tile = makePixelTile(
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
      let leftTile = makePixelTile(
        0,
        -1, // x: -4
        0,
        config.tileSize,
        config.tileArea,
      )
      accumulator.extractState(leftTile)
      expect(leftTile.data32.every(v => v === 0)).toBe(true)

      let rightTile = makePixelTile(
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
      let topTile = makePixelTile(
        0,
        0,
        -1, // y: -4
        config.tileSize,
        config.tileArea,
      )
      accumulator.extractState(topTile)
      expect(topTile.data32.every(v => v === 0)).toBe(true)

      let bottomTile = makePixelTile(
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

  it('recyclePatch should release both before and after tiles to the pool', () => {
    const config = {} as any
    const releaseTiles = vi.fn()
    const tilePool = {
      releaseTiles: releaseTiles,
    } as any
    const accumulator = new PixelAccumulator(config, tilePool)
    const patch = {
      beforeTiles: [
        'before-1',
        'before-2',
      ],
      afterTiles: [
        'after-1',
      ],
    } as any

    accumulator.recyclePatch(patch)
    expect(releaseTiles.mock.calls).toEqual([
      [['before-1', 'before-2']],
      [['after-1']],
    ])
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
      accumulator.rollbackAfterError()

      // 4. Verify physical canvas restoration
      expect(target.data32[1 * IMAGE_WIDTH + 1]).toBe(originalValue)

      // 5. Verify cleanup
      expect(accumulator.beforeTiles.length).toBe(0)
      expect(accumulator.lookup.length).toBe(0)
      expect(tilePool.pool.length).toBe(1) // Returned the captured tile to pool
    })
  })

  describe('storeTileBeforeState', () => {
    let config: any
    let tilePool: any
    let accumulator: any
    let mockTile: any

    beforeEach(() => {
      config = {
        target: { width: 32, height: 32 },
        tileSize: 8,
        tileShift: 3,
        targetColumns: 4,
      }

      mockTile = {
        id: 5,
        tx: 1,
        ty: 1,
        data32: new Uint32Array(64),
      }

      tilePool = {
        getTile: vi.fn().mockReturnValue(mockTile),
        releaseTile: vi.fn(),
        releaseTiles: vi.fn(),
      }

      accumulator = new PixelAccumulator(config, tilePool)

      // Spy on extractState to avoid running the complex canvas math during state tests
      vi.spyOn(accumulator, 'extractState').mockImplementation(() => {
      })
    })

    it('should fetch a new tile, extract state, and store it if not present', () => {
      const didChange = accumulator.storeTileBeforeState(5, 1, 1)

      expect(tilePool.getTile).toHaveBeenCalledWith(5, 1, 1)
      expect(accumulator.extractState).toHaveBeenCalledWith(mockTile)
      expect(accumulator.lookup[5]).toBe(mockTile)
      expect(accumulator.beforeTiles).toContain(mockTile)
      expect(typeof didChange).toBe('function')
    })

    it('should keep the tile in the accumulator if the callback is called with true', () => {
      const didChange = accumulator.storeTileBeforeState(5, 1, 1)

      const result = didChange(true)

      expect(result).toBe(true)
      expect(accumulator.lookup[5]).toBe(mockTile)
      expect(accumulator.beforeTiles).toContain(mockTile)
      expect(tilePool.releaseTile).not.toHaveBeenCalled()
    })

    it('should remove and release the tile if the callback is called with false', () => {
      const didChange = accumulator.storeTileBeforeState(5, 1, 1)

      const result = didChange(false)

      expect(result).toBe(false)
      expect(accumulator.lookup[5]).toBeUndefined()
      expect(accumulator.beforeTiles).not.toContain(mockTile)
      expect(tilePool.releaseTile).toHaveBeenCalledWith(mockTile)
    })

    it('should not add a duplicate tile if it already existed in the lookup', () => {
      // Pre-populate the accumulator manually
      accumulator.lookup[5] = mockTile
      accumulator.beforeTiles.push(mockTile)

      accumulator.storeTileBeforeState(5, 1, 1)

      // Should not have fetched a new one or extracted state
      expect(tilePool.getTile).not.toHaveBeenCalled()
      expect(accumulator.extractState).not.toHaveBeenCalled()
      expect(accumulator.beforeTiles.length).toBe(1) // Still just the original one
    })

    it('should not release the tile on rollback if it existed before this operation', () => {
      accumulator.lookup[5] = mockTile
      accumulator.beforeTiles.push(mockTile)

      const didChange = accumulator.storeTileBeforeState(5, 1, 1)

      // Rollback this specific action
      didChange(false)

      // The tile should still remain because it was added by a previous action
      expect(accumulator.lookup[5]).toBe(mockTile)
      expect(accumulator.beforeTiles).toContain(mockTile)
      expect(tilePool.releaseTile).not.toHaveBeenCalled()
    })
  })

})
