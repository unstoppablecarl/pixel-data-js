import type { PixelTile } from '@/index'
import { eachTileInBounds, PixelEngineConfig } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('eachTileInBounds', () => {
  let config: PixelEngineConfig
  let tilePool: any

  const tileSize = 256

  beforeEach(() => {
    const target = {
      w: 1024,
      h: 1024,
    } as any

    // 256px tile size (tileShift = 8)
    config = new PixelEngineConfig(
      tileSize,
      target,
    )

    tilePool = {
      getTile: vi.fn((id, tx, ty) => {
        return {
          id: id,
          tx: tx,
          ty: ty,
        }
      }),
    }
  })

  it('should call the callback once for bounds within a single tile', () => {
    const callback = vi.fn()
    const bounds = {
      x: 10,
      y: 10,
      w: 50,
      h: 50,
    }
    const lookup: any[] = []

    eachTileInBounds(config, lookup, tilePool, bounds, callback)

    expect(callback).toHaveBeenCalledTimes(1)
    // callback(tile, bX, bY, bW, bH) -> 5 args, so multi-line
    expect(callback).toHaveBeenCalledWith(
      expect.any(Object),
      10,
      10,
      50,
      50,
    )
  })

  it('should span two tiles horizontally when bounds cross the 256px mark', () => {
    const callback = vi.fn()
    const bounds = {
      x: 250,
      y: 10,
      w: 20,
      h: 10,
    }

    const lookup: any[] = []

    eachTileInBounds(config, lookup, tilePool, bounds, callback)

    // Should call for tile (0,0) and tile (1,0)
    expect(callback).toHaveBeenCalledTimes(2)

    // First tile (0,0) part: x=250 to 256 (width 6)
    expect(callback).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ tx: 0, ty: 0 }),
      250,
      10,
      6,
      10,
    )

    // Second tile (1,0) part: x=256 to 270 (width 14)
    expect(callback).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ tx: 1, ty: 0 }),
      tileSize,
      10,
      14,
      10,
    )
  })

  it('should iterate over 4 tiles (2x2) when bounds cross both X and Y boundaries', () => {
    const callback = vi.fn()
    const bounds = {
      x: 250,
      y: 250,
      w: 20,
      h: 20,
    }

    const lookup: any[] = []

    eachTileInBounds(config, lookup, tilePool, bounds, callback)
    const calls = callback.mock.calls

    expect(calls[0]).toEqual([
      {
        id: 0,
        tx: 0,
        ty: 0,
      },
      bounds.x,
      bounds.y,
      6,
      6,
    ])

    expect(callback).toHaveBeenCalledTimes(4)
  })

  it('should return early and not call the callback if bounds are out of range', () => {
    const callback = vi.fn()
    const bounds = {
      x: -100,
      y: -100,
      w: 50,
      h: 50,
    }

    const lookup: any[] = []

    eachTileInBounds(config, lookup, tilePool, bounds, callback)
    expect(callback).not.toHaveBeenCalled()
  })

  it('should use lookup cache', () => {
    const callback = vi.fn()
    const bounds = {
      x: 10,
      y: 10,
      w: 400,
      h: 400,
    }

    const lookup: any[] = []

    const tile = {
      id: 5,
      tx: 2,
      ty: 1,
      w: tileSize,
      h: tileSize,
    } as PixelTile

    lookup[tile.id] = tile

    eachTileInBounds(config, lookup, tilePool, bounds, callback)

    const calls = callback.mock.calls
    expect(calls[0]).toEqual([
      {
        id: 0,
        tx: 0,
        ty: 0,
      },
      bounds.x,
      bounds.y,
      246,
      246,
    ])

    expect(calls[1]).toEqual([
      {
        id: 1,
        tx: 1,
        ty: 0,
      },
      tileSize,
      10,
      154,
      246,
    ])

    expect(callback).toHaveBeenCalledTimes(4)
    expect(tilePool.getTile).toHaveBeenCalledTimes(3)
  })
})
