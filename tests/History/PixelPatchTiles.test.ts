import { applyPatchTiles, makePixelData, makePixelTile, type PixelData } from '@/index'
import { beforeEach, describe, expect, it } from 'vitest'

describe('PixelPatchTiles', () => {
  let targetPixelData: PixelData
  const tileSize = 4

  beforeEach(() => {
    // Create a 10x10 image, initialized to black (0)
    const imageData = new ImageData(10, 10)
    targetPixelData = makePixelData(imageData)
  })

  describe('applyPatchTiles', () => {
    const tileArea = tileSize * tileSize
    it('should apply a single tile to the target', () => {
      const tile = makePixelTile(0, 1, 1, tileSize, tileArea)
      // Fill the tile with a solid color (white)
      tile.data32.fill(0xFFFFFFFF)

      applyPatchTiles(targetPixelData, [tile], tileSize)

      // The tile is at (tx=1, ty=1) with TILE_SIZE=4, so it covers x=4-7, y=4-7
      for (let y = 4; y < 8; y++) {
        for (let x = 4; x < 8; x++) {
          const idx = y * targetPixelData.w + x
          expect(targetPixelData.data32[idx]).toBe(0xFFFFFFFF)
        }
      }

      // Check a pixel outside the tile to ensure it wasn't modified
      expect(targetPixelData.data32[0]).toBe(0)
    })

    it('should apply multiple tiles', () => {
      const tile1 = makePixelTile(0, 0, 0, tileSize, tileArea)
      tile1.data32.fill(0xFF0000FF) // Red

      const tile2 = makePixelTile(1, 1, 0, tileSize, tileArea)
      tile2.data32.fill(0x00FF00FF) // Green

      applyPatchTiles(targetPixelData, [tile1, tile2], tileSize)

      // Check tile1 area (0,0) -> (3,3)
      expect(targetPixelData.data32[0]).toBe(0xFF0000FF)
      expect(targetPixelData.data32[3 * targetPixelData.w + 3]).toBe(0xFF0000FF)

      // Check tile2 area (4,0) -> (7,3)
      expect(targetPixelData.data32[4]).toBe(0x00FF00FF)
      expect(targetPixelData.data32[3 * targetPixelData.w + 7]).toBe(0x00FF00FF)
    })

    it('should correctly clamp tiles at the image boundaries', () => {
      // A tile at (tx=2, ty=2) would be at pixel coords (8,8)
      // For a 10x10 image, this tile should only draw in a 2x2 area (x=8,9 y=8,9)
      const tile = makePixelTile(0, 2, 2, tileSize, tileArea)

      // Fill the tile with a pattern to check correctness
      for (let i = 0; i < tile.data32.length; i++) {
        tile.data32[i] = i + 1
      }

      applyPatchTiles(targetPixelData, [tile], tileSize)

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
      const tile = makePixelTile(0, 3, 3, tileSize, tileArea) // Starts at pixel (12,12)
      tile.data32.fill(0xFFFFFFFF)

      applyPatchTiles(targetPixelData, [tile], tileSize)

      // The entire data array should still be 0
      targetPixelData.data32.forEach(pixel => expect(pixel).toBe(0))
    })

    it('should handle an empty array of tiles', () => {
      const originalData = new Uint32Array(targetPixelData.data32)
      applyPatchTiles(targetPixelData, [], tileSize)
      expect(targetPixelData.data32).toEqual(originalData)
    })

    it('should skip undefined or null tiles in the array', () => {
      const tile = makePixelTile(0, 0, 0, tileSize, tileArea)
      tile.data32.fill(0xFFFFFFFF)

      // Pass an array with undefined/null values
      // Casting to any to allow passing undefined/null which might not be strictly allowed by type but happens in JS
      applyPatchTiles(targetPixelData, [undefined, tile, null] as any[], tileSize)

      // The valid tile should still be applied
      expect(targetPixelData.data32[0]).toBe(0xFFFFFFFF)
    })
  })
})
