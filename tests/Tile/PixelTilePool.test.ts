import { makePixelTile, type PixelEngineConfig, type PixelTile, TilePool } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('TilePool', () => {
  const mockConfig = {
    tileSize: 256,
    tileArea: 65536,
  } as unknown as PixelEngineConfig

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with an empty pool and correct config values', () => {
    let tilePool = new TilePool(mockConfig, makePixelTile)

    expect(tilePool.pool.length).toBe(0)
  })

  describe('getTile', () => {
    it('creates a new PixelTile when the pool is empty', () => {
      let tilePool = new TilePool(mockConfig, makePixelTile)

      let tile = tilePool.getTile(1, 5, 10)

      expect(tile.id).toBe(1)
      expect(tile.tx).toBe(5)
      expect(tile.ty).toBe(10)
      expect(tile.w).toBe(mockConfig.tileSize)
      expect(tile.data.length).toBe(mockConfig.tileArea)

    })

    it('reuses an existing tile from the pool', () => {
      let tilePool = new TilePool(mockConfig, makePixelTile)

      // Populate the pool
      let initialTile = tilePool.getTile(1, 5, 10)
      tilePool.releaseTile(initialTile)

      expect(tilePool.pool.length).toBe(1)

      // Retrieve it again
      let reusedTile = tilePool.getTile(2, 20, 30)

      expect(tilePool.pool.length).toBe(0)
      expect(reusedTile).toBe(initialTile)
      expect(reusedTile.id).toBe(2)
      expect(reusedTile.tx).toBe(20)
      expect(reusedTile.ty).toBe(30)
    })

    it('clears the dirty data32 memory when reusing a tile', () => {
      let tilePool = new TilePool(mockConfig, makePixelTile)

      let initialTile = tilePool.getTile(1, 0, 0)
      initialTile.data.fill(1)
      tilePool.releaseTile(initialTile)

      let reusedTile = tilePool.getTile(2, 0, 0)

      expect(reusedTile.data.some(v => v === 1)).toBe(false)
    })
  })

  describe('releaseTile', () => {
    it('adds a single tile back to the pool', () => {
      let tilePool = new TilePool(mockConfig, makePixelTile)
      let tile = tilePool.getTile(1, 0, 0)

      expect(tilePool.pool.length).toBe(0)

      tilePool.releaseTile(tile)

      expect(tilePool.pool.length).toBe(1)
      expect(tilePool.pool[0]).toBe(tile)
    })
  })

  describe('releaseTiles', () => {
    it('adds an array of tiles back to the pool and clears the input array', () => {
      let tilePool = new TilePool(mockConfig, makePixelTile)
      let tile1 = tilePool.getTile(1, 0, 0)
      let tile2 = tilePool.getTile(2, 1, 0)

      let tilesToRelease = [
        tile1,
        tile2,
      ]

      tilePool.releaseTiles(tilesToRelease)

      expect(tilePool.pool.length).toBe(2)
      expect(tilePool.pool).toContain(tile1)
      expect(tilePool.pool).toContain(tile2)
      expect(tilesToRelease.length).toBe(0)
    })

    it('handles arrays with undefined or null entries gracefully', () => {
      let tilePool = new TilePool(mockConfig, makePixelTile)
      let tile1 = tilePool.getTile(1, 0, 0)

      let sparseArray = [
        tile1,
        undefined as unknown as PixelTile,
        null as unknown as PixelTile,
      ]

      tilePool.releaseTiles(sparseArray)

      expect(tilePool.pool.length).toBe(1)
      expect(tilePool.pool[0]).toBe(tile1)
      expect(sparseArray.length).toBe(0)
    })
  })
})
