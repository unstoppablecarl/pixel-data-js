import { describe, expect, it } from 'vitest'
import { type IndexedImage, indexedImageToAverageColor, makeIndexedImage, packRGBA } from '../../src'
import { pack } from '../_helpers'

describe('indexedImageToAverageColor', () => {
  it('should return a zeroed RGBA object for an empty image', () => {
    const indexedImage: IndexedImage = {
      width: 0,
      height: 0,
      data: new Int32Array([]),
      palette: new Int32Array([]),
      transparentPalletIndex: 0,
    }

    const result = indexedImageToAverageColor(indexedImage)

    expect(result).toEqual(packRGBA({
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    }))
  })

  it('should calculate the average color weighted by pixel frequency', () => {
    // 3 pixels: 2 Red, 1 Blue
    const indexedImage: IndexedImage = {
      width: 3,
      height: 1,
      data: new Int32Array([1, 1, 2]),
      palette: new Int32Array([
        pack(0, 0, 0, 0),       // ID 0: Transparent
        pack(255, 0, 0, 255),   // ID 1: Red
        pack(0, 0, 255, 255),   // ID 2: Blue
      ]),
      transparentPalletIndex: 0,
    }

    const result = indexedImageToAverageColor(indexedImage)

    // (255 * 2 + 0 * 1) / 3 = 170
    // (0 * 2 + 0 * 1) / 3 = 0
    // (0 * 2 + 255 * 1) / 3 = 85
    expect(result).toEqual(packRGBA({
      r: 170,
      g: 0,
      b: 85,
      a: 255,
    }))
  })

  it('should ignore transparent pixels when includeTransparent is false', () => {
    // 2 pixels: 1 Red, 1 Transparent
    const indexedImage: IndexedImage = {
      width: 2,
      height: 1,
      data: new Int32Array([0, 1]),
      palette: new Int32Array([
        pack(0, 0, 0, 0),
        pack(255, 0, 0, 255),
      ]),
      transparentPalletIndex: 0,
    }

    const result = indexedImageToAverageColor(indexedImage, false)

    // Only the Red pixel should count
    expect(result).toEqual(packRGBA({
      r: 255,
      g: 0,
      b: 0,
      a: 255,
    }))
  })

  it('should include transparent pixels in the average when includeTransparent is true', () => {
    const indexedImage: IndexedImage = {
      width: 2,
      height: 1,
      data: new Int32Array([0, 1]),
      palette: new Int32Array([
        pack(0, 0, 0, 0),
        pack(255, 0, 0, 255),
      ]),
      transparentPalletIndex: 0,
    }

    const result = indexedImageToAverageColor(indexedImage, true)

    // (0 + 255) / 2 = 127
    // (0 + 255) / 2 = 127
    expect(result).toEqual(packRGBA({
      r: 127,
      g: 0,
      b: 0,
      a: 127,
    }))
  })

  it('should include transparent pixels in the average when includeTransparent is indexedImage compatibility', () => {
    const width = 2
    const height = 1
    const imageData = new ImageData(width, height)
    const data = imageData.data

    // Pixel 0: Fully Transparent (0, 0, 0, 0)
    data[0] = 0
    data[1] = 0
    data[2] = 0
    data[3] = 0

    // Pixel 1: Solid Red (255, 0, 0, 255)
    data[4] = 255
    data[5] = 0
    data[6] = 0
    data[7] = 255

    const indexedImage = makeIndexedImage(imageData)

    const result = indexedImageToAverageColor(indexedImage, true)

    // Average calculation:
    // R: (0 + 255) / 2 = 127.5 -> 127
    // G: (0 + 0) / 2 = 0
    // B: (0 + 0) / 2 = 0
    // A: (0 + 255) / 2 = 127.5 -> 127
    expect(result).toEqual(packRGBA({
      r: 127,
      g: 0,
      b: 0,
      a: 127,
    }))

  })

  it('should skip palette colors that do not appear in the data', () => {
    const indexedImage: IndexedImage = {
      width: 1,
      height: 1,
      data: new Int32Array([1]),
      palette: new Int32Array([
        pack(0, 0, 0, 0),
        pack(255, 255, 255, 255),
        pack(100, 100, 100, 255), // Unused
      ]),
      transparentPalletIndex: 0,
    }

    const result = indexedImageToAverageColor(indexedImage)

    expect(result).toEqual(packRGBA({
      r: 255,
      g: 255,
      b: 255,
      a: 255,
    }))
  })

  it('should return zeros if all pixels are filtered out', () => {
    const indexedImage: IndexedImage = {
      width: 1,
      height: 1,
      data: new Int32Array([0]),
      palette: new Int32Array([pack(0, 0, 0, 0)]),
      transparentPalletIndex: 0,
    }

    const result = indexedImageToAverageColor(indexedImage, false)

    expect(result).toEqual(packRGBA({
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    }))
  })
})
