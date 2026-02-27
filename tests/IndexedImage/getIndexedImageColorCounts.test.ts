import { describe, expect, it } from 'vitest'
import type { IndexedImage } from '../../src'
import { getIndexedImageColorCounts } from '../../src/IndexedImage/getIndexedImageColorCounts'


describe('getIndexedImageColorCounts', () => {
  it('should correctly count color frequencies mapping to palette indices', () => {
    const mockImage: IndexedImage = {
      width: 2,
      height: 2,
      data: new Int32Array([0, 1, 1, 2]),
      palette: new Int32Array([0xFF000000, 0xFFFFFFFF, 0xFFFF0000]),
      transparentPalletIndex: 0
    }

    const counts = getIndexedImageColorCounts(mockImage)

    expect(counts).toBeInstanceOf(Int32Array)
    expect(counts.length).toBe(3)
    expect(counts[0]).toBe(1)
    expect(counts[1]).toBe(2)
    expect(counts[2]).toBe(1)
  })

  it('should return zeros for palette indices not present in the data', () => {
    const mockImage: IndexedImage = {
      width: 2,
      height: 1,
      data: new Int32Array([0, 0]),
      palette: new Int32Array([0x00, 0x01, 0x02]),
      transparentPalletIndex: 0
    }

    const counts = getIndexedImageColorCounts(mockImage)

    expect(counts[0]).toBe(2)
    expect(counts[1]).toBe(0)
    expect(counts[2]).toBe(0)
  })

  it('should handle an empty data array', () => {
    const mockImage: IndexedImage = {
      width: 0,
      height: 0,
      data: new Int32Array([]),
      palette: new Int32Array([0x00, 0x01]),
      transparentPalletIndex: 0
    }

    const counts = getIndexedImageColorCounts(mockImage)

    expect(counts).toEqual(new Int32Array([0, 0]))
  })

  it('should match the length of the palette regardless of data values', () => {
    const palette = new Int32Array(10)
    const mockImage: IndexedImage = {
      width: 1,
      height: 1,
      data: new Int32Array([5]),
      palette: palette,
      transparentPalletIndex: 0
    }

    const counts = getIndexedImageColorCounts(mockImage)

    expect(counts.length).toBe(10)
    expect(counts[5]).toBe(1)
  })
})
