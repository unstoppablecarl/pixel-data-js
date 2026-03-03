import { describe, expect, it } from 'vitest'
import { makeIndexedImage } from '../../src'
import { indexedImageToImageData } from '../../src/IndexedImage/indexedImageToImageData'

describe('IndexedImage conversions', () => {
  it('should round-trip ImageData correctly', () => {
    const width = 2
    const height = 2
    const imageData = new ImageData(width, height)
    const data32 = new Uint32Array(imageData.data.buffer)

    // Set some test pixels (ABGR/RGBA depending on platform, but should be consistent)
    data32[0] = 0xFF0000FF // Red
    data32[1] = 0xFF00FF00 // Green
    data32[2] = 0xFFFF0000 // Blue
    data32[3] = 0x00000000 // Transparent

    const indexed = makeIndexedImage(imageData)
    const result = indexedImageToImageData(indexed)
    const result32 = new Uint32Array(result.data.buffer)

    expect(result.width).toBe(width)
    expect(result.height).toBe(height)
    expect(result32[0]).toBe(data32[0])
    expect(result32[1]).toBe(data32[1])
    expect(result32[2]).toBe(data32[2])
    expect(result32[3]).toBe(data32[3])
  })

  it('should handle manual Uint8ClampedArray input', () => {
    const width = 1
    const height = 1
    const data = new Uint8ClampedArray([255, 0, 0, 255])

    const indexed = makeIndexedImage(data, width, height)

    expect(indexed.width).toBe(1)
    expect(indexed.height).toBe(1)
    expect(indexed.palette.length).toBe(2) // Transparent (0) + Red (1)
  })

  it('should map multiple identical pixels to the same palette index', () => {
    const width = 4
    const height = 1
    const imageData = new ImageData(width, height)
    const data32 = new Uint32Array(imageData.data.buffer)
    const color = 0xFFEEDDCC

    data32.fill(color)

    const indexed = makeIndexedImage(imageData)

    // Palette should only have 2 entries: [Transparent, Color]
    expect(indexed.palette.length).toBe(2)
    expect(indexed.data[0]).toBe(1)
    expect(indexed.data[3]).toBe(1)
  })

  it('should treat all fully transparent pixels as the transparentPalletIndex', () => {
    const width = 2
    const height = 1
    const imageData = new ImageData(width, height)
    const data32 = new Uint32Array(imageData.data.buffer)

    // Different RGB values but both 0 alpha
    data32[0] = 0x00112233
    data32[1] = 0x00445566

    const indexed = makeIndexedImage(imageData)

    expect(indexed.data[0]).toBe(indexed.transparentPalletIndex)
    expect(indexed.data[1]).toBe(indexed.transparentPalletIndex)
    expect(indexed.palette.length).toBe(1)
  })
})
