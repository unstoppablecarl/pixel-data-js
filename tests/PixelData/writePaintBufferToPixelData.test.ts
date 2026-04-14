import { makePixelTile, writePaintBufferToPixelData } from '@/index'
import { describe, expect, it, vi } from 'vitest'

describe('writePaintBufferToPixelData', () => {
  it('should not call the write function if the lookup table is empty', () => {
    const target = {} as any
    const paintBuffer = {
      config: { tileShift: 3 },
      lookup: [],
    } as any
    const writeFn = vi.fn()

    writePaintBufferToPixelData(target, paintBuffer, writeFn)

    expect(writeFn).not.toHaveBeenCalled()
  })

  it('should skip null or undefined tiles in a sparse lookup array', () => {
    const target = {} as any
    const paintBuffer = {
      config: { tileShift: 3 },
      lookup: [null, undefined],
    } as any
    const writeFn = vi.fn()

    writePaintBufferToPixelData(target, paintBuffer, writeFn)

    expect(writeFn).not.toHaveBeenCalled()
  })

  it('should calculate correct dx/dy using tileShift and call the writer', () => {
    const target = { w: 32, h: 32 } as any
    const dataA = new Uint32Array(64)
    const dataB = new Uint32Array(64)

    const tileSize = 8
    const tileA = makePixelTile(98, 1, 0, tileSize, tileSize * tileSize)
    const tileB = makePixelTile(99, 0, 2, tileSize, tileSize * tileSize)

    const paintBuffer = {
      config: {},
      lookup: [tileA, tileB],
    } as any
    const writeFn = vi.fn()

    writePaintBufferToPixelData(target, paintBuffer, writeFn)

    expect(writeFn).toHaveBeenCalledTimes(2)

    // Verify coordinates for Tile A
    expect(writeFn).toHaveBeenNthCalledWith(
      1,
      target,
      dataA,
      8,
      0,
      8,
      8,
    )

    // Verify coordinates for Tile B
    expect(writeFn).toHaveBeenNthCalledWith(
      2,
      target,
      dataB,
      0,
      16,
      8,
      8,
    )
  })
})
