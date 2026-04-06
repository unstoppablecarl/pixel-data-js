import { makeAlphaMaskTile, makeBinaryMaskTile, MaskType, TileType } from '@/index'
import { describe, expect, it } from 'vitest'

describe('Mask Tile Factories', () => {
  const MOCK_ID = 42
  const MOCK_TX = 2
  const MOCK_TY = 3
  const MOCK_TILE_SIZE = 256
  const MOCK_TILE_AREA = 256 * 256 // 65536

  describe('makeAlphaMaskTile', () => {
    it('should create a valid AlphaMaskTile with correct properties', () => {
      const tile = makeAlphaMaskTile(
        MOCK_ID,
        MOCK_TX,
        MOCK_TY,
        MOCK_TILE_SIZE,
        MOCK_TILE_AREA,
      )

      expect(tile.id).toBe(MOCK_ID)
      expect(tile.tx).toBe(MOCK_TX)
      expect(tile.ty).toBe(MOCK_TY)
      expect(tile.w).toBe(MOCK_TILE_SIZE)
      expect(tile.h).toBe(MOCK_TILE_SIZE)
      expect(tile.tileType).toBe(TileType.MASK)
      expect(tile.type).toBe(MaskType.ALPHA)
    })

    it('should allocate a Uint8Array of the correct size', () => {
      const tile = makeAlphaMaskTile(
        MOCK_ID,
        MOCK_TX,
        MOCK_TY,
        MOCK_TILE_SIZE,
        MOCK_TILE_AREA,
      )

      expect(tile.data).toBeInstanceOf(Uint8Array)
      expect(tile.data.length).toBe(MOCK_TILE_AREA)

      // Ensure the allocated memory is initialized to 0
      expect(tile.data[0]).toBe(0)
      expect(tile.data[MOCK_TILE_AREA - 1]).toBe(0)
    })
  })

  describe('makeBinaryMaskTile', () => {
    it('should create a valid BinaryMaskTile with correct properties', () => {
      const tile = makeBinaryMaskTile(
        MOCK_ID,
        MOCK_TX,
        MOCK_TY,
        MOCK_TILE_SIZE,
        MOCK_TILE_AREA,
      )

      expect(tile.id).toBe(MOCK_ID)
      expect(tile.tx).toBe(MOCK_TX)
      expect(tile.ty).toBe(MOCK_TY)
      expect(tile.w).toBe(MOCK_TILE_SIZE)
      expect(tile.h).toBe(MOCK_TILE_SIZE)
      expect(tile.tileType).toBe(TileType.MASK)
      expect(tile.type).toBe(MaskType.BINARY)
    })

    it('should allocate a Uint8Array of the correct size', () => {
      const tile = makeBinaryMaskTile(
        MOCK_ID,
        MOCK_TX,
        MOCK_TY,
        MOCK_TILE_SIZE,
        MOCK_TILE_AREA,
      )

      expect(tile.data).toBeInstanceOf(Uint8Array)
      expect(tile.data.length).toBe(MOCK_TILE_AREA)

      // Ensure the allocated memory is initialized to 0
      expect(tile.data[0]).toBe(0)
      expect(tile.data[MOCK_TILE_AREA - 1]).toBe(0)
    })
  })
})
