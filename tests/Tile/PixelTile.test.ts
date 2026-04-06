import { makePixelTile } from '@/index'
import { describe, expect, it } from 'vitest'

describe('PixelTile', () => {
  const tileSize = 4
  const tileArea = tileSize * tileSize

  it('should be constructed correctly', () => {

    const tile = makePixelTile(0, 1, 2, tileSize, tileArea)
    expect(tile.id).toBe(0)
    expect(tile.tx).toBe(1)
    expect(tile.ty).toBe(2)
    expect(tile.data).toBeInstanceOf(Uint32Array)
    expect(tile.data.length).toBe(tileArea)
  })
})
