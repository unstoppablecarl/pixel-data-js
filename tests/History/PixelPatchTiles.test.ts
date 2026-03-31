import { applyPatchTiles, PixelData, PixelTile } from '@/index'
import { beforeEach, describe, expect, it } from 'vitest'

describe('PixelPatchTiles', () => {
  let targetPixelData: PixelData
  const TILE_SIZE = 4 // Use a small tile size for easier testing

  beforeEach(() => {
    // Create a 10x10 image, initialized to black (0)
    const imageData = new ImageData(10, 10)
    targetPixelData = new PixelData(imageData)
  })

  describe('PixelTile', () => {
    it('should be constructed correctly', () => {
      const tile = new PixelTile(0, 1, 2, TILE_SIZE * TILE_SIZE)
      expect(tile.id).toBe(0)
      expect(tile.tx).toBe(1)
      expect(tile.ty).toBe(2)
      expect(tile.data32).toBeInstanceOf(Uint32Array)
      expect(tile.data32.length).toBe(TILE_SIZE * TILE_SIZE)
    })
  })

  describe('applyPatchTiles', () => {
    it('should apply a single tile to the target', () => {
      const tile = new PixelTile(0, 1, 1, TILE_SIZE * TILE_SIZE)
      // Fill the tile with a solid color (white)
      tile.data32.fill(0xFFFFFFFF)

      applyPatchTiles(targetPixelData, [tile], TILE_SIZE)

      // The tile is at (tx=1, ty=1) with TILE_SIZE=4, so it covers x=4-7, y=4-7
      for (let y = 4; y < 8; y++) {
        for (let x = 4; x < 8; x++) {
          const idx = y * targetPixelData.width + x
          expect(targetPixelData.data32[idx]).toBe(0xFFFFFFFF)
        }
      }

      // Check a pixel outside the tile to ensure it wasn't modified
      expect(targetPixelData.data32[0]).toBe(0)
    })

    it('should apply multiple tiles', () => {
      const tile1 = new PixelTile(0, 0, 0, TILE_SIZE * TILE_SIZE)
      tile1.data32.fill(0xFF0000FF) // Red

      const tile2 = new PixelTile(1, 1, 0, TILE_SIZE * TILE_SIZE)
      tile2.data32.fill(0x00FF00FF) // Green

      applyPatchTiles(targetPixelData, [tile1, tile2], TILE_SIZE)

      // Check tile1 area (0,0) -> (3,3)
      expect(targetPixelData.data32[0]).toBe(0xFF0000FF)
      expect(targetPixelData.data32[3 * targetPixelData.width + 3]).toBe(0xFF0000FF)

      // Check tile2 area (4,0) -> (7,3)
      expect(targetPixelData.data32[4]).toBe(0x00FF00FF)
      expect(targetPixelData.data32[3 * targetPixelData.width + 7]).toBe(0x00FF00FF)
    })

    it('should correctly clamp tiles at the image boundaries', () => {
      // A tile at (tx=2, ty=2) would be at pixel coords (8,8)
      // For a 10x10 image, this tile should only draw in a 2x2 area (x=8,9 y=8,9)
      const tile = new PixelTile(0, 2, 2, TILE_SIZE * TILE_SIZE)

      // Fill the tile with a pattern to check correctness
      for (let i = 0; i < tile.data32.length; i++) {
        tile.data32[i] = i + 1
      }

      applyPatchTiles(targetPixelData, [tile], TILE_SIZE)

      // The top-left 2x2 of the tile should be copied
      // Tile data is 1, 2, 3, 4, 5, 6, 7, 8...
      // Expected layout on target:
      // [8,8] = 1, [8,9] = 2
      // [9,8] = 5, [9,9] = 6
      expect(targetPixelData.data32[8 * 10 + 8]).toBe(1)
      expect(targetPixelData.data32[8 * 10 + 9]).toBe(2)
      expect(targetPixelData.data32[9 * 10 + 8]).toBe(5)
      expect(targetPixelData.data32[9 * 10 + 9]).toBe(6)

      // Check that pixels outside this 2x2 area are not touched
      expect(targetPixelData.data32[7 * 10 + 8]).toBe(0) // Above
      expect(targetPixelData.data32[8 * 10 + 7]).toBe(0) // Left
    })

    it('should do nothing if a tile is outside the image bounds', () => {
      const tile = new PixelTile(0, 3, 3, TILE_SIZE * TILE_SIZE) // Starts at pixel (12,12)
      tile.data32.fill(0xFFFFFFFF)

      applyPatchTiles(targetPixelData, [tile], TILE_SIZE)

      // The entire data array should still be 0
      targetPixelData.data32.forEach(pixel => expect(pixel).toBe(0))
    })

    it('should handle an empty array of tiles', () => {
      const originalData = new Uint32Array(targetPixelData.data32)
      applyPatchTiles(targetPixelData, [], TILE_SIZE)
      expect(targetPixelData.data32).toEqual(originalData)
    })

    it('should skip undefined or null tiles in the array', () => {
      const tile = new PixelTile(0, 0, 0, TILE_SIZE * TILE_SIZE)
      tile.data32.fill(0xFFFFFFFF)

      // Pass an array with undefined/null values
      // Casting to any to allow passing undefined/null which might not be strictly allowed by type but happens in JS
      applyPatchTiles(targetPixelData, [undefined, tile, null] as any[], TILE_SIZE)

      // The valid tile should still be applied
      expect(targetPixelData.data32[0]).toBe(0xFFFFFFFF)
    })
  })
})
