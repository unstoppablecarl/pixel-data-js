import { PaintBuffer } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('PaintBuffer', () => {
  let mockConfig: any
  let mockTilePool: any
  let buffer: PaintBuffer

  beforeEach(() => {
    mockConfig = {
      tileSize: 16,
      tileShift: 4,
      tileMask: 15,
      targetColumns: 10,
    }

    mockTilePool = {
      getTile: vi.fn((id, tx, ty) => {
        const data32 = new Uint32Array(256)

        return {
          id,
          tx,
          ty,
          data32,
        }
      }),
      // Replicate the actual pool behavior of emptying the array
      releaseTiles: vi.fn((tiles: any[]) => {
        tiles.length = 0
      }),
    }

    buffer = new PaintBuffer(mockConfig, mockTilePool)
  })

  it('initializes with empty lookup', () => {
    expect(buffer.lookup.length).toBe(0)
  })

  it('releases all tiles and clears the lookup array when clear() is called', () => {
    const dummyTileA = {
      id: 1,
    }

    const dummyTileB = {
      id: 2,
    }

    // Populate the lookup with some sparse data
    buffer.lookup[0] = dummyTileA as any
    buffer.lookup[5] = dummyTileB as any

    buffer.clear()

    // Verify the pool was notified
    expect(mockTilePool.releaseTiles).toHaveBeenCalledTimes(1)

    // Verify the lookup array itself was emptied by the pool's release method
    expect(buffer.lookup.length).toBe(0)
  })

  it('writes binary mask rect correctly across multiple tiles', () => {
    const maskData = new Uint8Array(100)

    // Set local pixel (5, 5) which translates to global (15, 15)
    maskData[5 * 10 + 5] = 1

    const mask = {
      x: 10,
      y: 10,
      w: 10,
      h: 10,
      data: maskData,
    }

    const color = 0xff00ff00

    buffer.writeColorBinaryMaskRect(color as any, mask as any)

    // Since the mask goes from (10, 10) to (19, 19), it crosses into 4 tiles
    // tx:0,ty:0 | tx:1,ty:0 | tx:0,ty:1 | tx:1,ty:1
    expect(mockTilePool.getTile).toHaveBeenCalledTimes(4)

    const tile0 = buffer.lookup[0]

    expect(tile0).toBeDefined()

    // Global (15, 15) is inside tile tx:0, ty:0
    // Tile offset: x = 15 & 15 = 15, y = 15 & 15 = 15
    // Index: 15 * 16 + 15 = 255
    expect(tile0!.data32[255]).toBe(color)

    // Ensure surrounding pixels were not painted
    expect(tile0!.data32[254]).toBe(0)
  })

  it('calculates alpha blending correctly when writing alpha mask rect', () => {
    const maskData = new Uint8Array(4)

    // Set a 50% opacity mask pixel (128 out of 255)
    maskData[0] = 128

    const mask = {
      x: 0,
      y: 0,
      w: 2,
      h: 2,
      data: maskData,
    }

    // Color with Hex Alpha = C8 (200 decimal), RGB = AABBCC
    const color = 0xC8AABBCC

    buffer.writeColorAlphaMaskRect(color as any, mask as any)

    const tile0 = buffer.lookup[0]

    expect(tile0).toBeDefined()

    // Expected final Alpha: (200 * 128 + 128) >> 8 = 100 (which is 0x64 in hex)
    // Combined with RGB, it should be 0x64AABBCC
    const expectedColor = 0x64AABBCC

    expect(tile0!.data32[0]).toBe(expectedColor)

    // Unset pixel verification
    expect(tile0!.data32[1]).toBe(0)
  })
})
