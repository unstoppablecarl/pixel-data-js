import { writePaintBufferToPixelData } from '@/index'
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
    const tileShift = 3 // Tiles are 8x8
    const dataA = new Uint32Array(64)
    const dataB = new Uint32Array(64)

    const tileA = {
      tx: 1, // 1 << 3 = 8
      ty: 0, // 0 << 3 = 0
      data32: dataA,
      w: 8,
      h: 8,
    }

    const tileB = {
      tx: 0, // 0 << 3 = 0
      ty: 2, // 2 << 3 = 16
      data32: dataB,
      w: 8,
      h: 8,
    }

    const paintBuffer = {
      config: { tileShift },
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
