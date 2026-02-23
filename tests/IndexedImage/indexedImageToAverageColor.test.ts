import { describe, expect, it } from 'vitest'
import { type IndexedImage, indexedImageToAverageColor, packRGBA } from '../../src'

describe('indexedImageToAverageColor', () => {
  it('should return a zeroed RGBA object for an empty image', () => {
    const indexedImage: IndexedImage = {
      width: 0,
      height: 0,
      data: new Int32Array([]),
      palette: new Uint8Array([]),
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
      palette: new Uint8Array([
        0, 0, 0, 0,       // ID 0: Transparent
        255, 0, 0, 255,   // ID 1: Red
        0, 0, 255, 255,   // ID 2: Blue
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
      palette: new Uint8Array([
        0, 0, 0, 0,
        255, 0, 0, 255,
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
      palette: new Uint8Array([
        0, 0, 0, 0,
        255, 0, 0, 255,
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

  it('should skip palette colors that do not appear in the data', () => {
    const indexedImage: IndexedImage = {
      width: 1,
      height: 1,
      data: new Int32Array([1]),
      palette: new Uint8Array([
        0, 0, 0, 0,
        255, 255, 255, 255,
        100, 100, 100, 255, // Unused
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
      palette: new Uint8Array([0, 0, 0, 0]),
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
