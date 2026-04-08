import { getIndexedImageColor, makeIndexedImageFromImageData, makeIndexedImageFromImageDataRaw } from '@/index'
import { describe, expect, it } from 'vitest'

describe('IndexedImage', () => {
  it('should initialize with a width and height', () => {
    const data = new Uint8ClampedArray(4).fill(0)
    const imageData = new ImageData(data, 1, 1)
    const result = makeIndexedImageFromImageData(imageData)

    expect(result.w).toBe(1)
    expect(result.h).toBe(1)
  })

  it('should normalize all transparent pixels to transparentPalletIndex 0', () => {
    // 2 pixels: one transparent black, one transparent red (alpha is 0)
    const data = new Uint8ClampedArray([
      0, 0, 0, 0,   // Transparent Black
      255, 0, 0, 0, // Transparent Red (still transparent)
    ])
    const imageData = new ImageData(data, 2, 1)
    const result = makeIndexedImageFromImageData(imageData)

    expect(result.transparentPalletIndex).toBe(0)
    expect(result.data[0]).toBe(0)
    expect(result.data[1]).toBe(0)

    // Palette index 0 should be 0 (0x00000000)
    expect(result.palette[0]).toBe(0)
    expect(result.palette instanceof Uint32Array).toBe(true)
  })
  it('should map unique opaque colors to sequential indices', () => {
    const r = 255
    const g = 128
    const b = 64
    const a = 255

    // Force this to be a un-signed 32-bit integer to match Int32Array's behavior
    const expectedColor = ((a << 24) | (b << 16) | (g << 8) | r) >>> 0

    const data = new Uint8ClampedArray([
      0, 0, 0, 0, // ID 0
      r, g, b, a, // ID 1
      0, 255, 0, 255, // ID 2
      r, g, b, a, // ID 1 (repeated)
    ])
    const imageData = new ImageData(data, 4, 1)
    const result = makeIndexedImageFromImageData(imageData)

    expect(result.data[0]).toBe(0)
    expect(result.data[1]).toBe(1)
    expect(result.data[2]).toBe(2)
    expect(result.data[3]).toBe(1)

    // Check palette contents
    expect(result.palette[0]).toBe(0)
    // Comparing signed to signed now
    expect(result.palette[1]).toBe(expectedColor)
  })

  it('should handle an image with no transparent pixels', () => {
    const data = new Uint8ClampedArray([
      255, 255, 255, 255, // White
      100, 100, 100, 255, // Gray
    ])
    const imageData = new ImageData(data, 2, 1)
    const result = makeIndexedImageFromImageData(imageData)

    // Index 0 is reserved for transparency
    expect(result.transparentPalletIndex).toBe(0)
    expect(result.data[0]).toBe(1)
    expect(result.data[1]).toBe(2)

    // 1 (transparent) + 2 (unique colors) = 3 total entries
    expect(result.palette.length).toBe(3)
  })

  it('should correctly calculate data length based on pixels', () => {
    const width = 10
    const height = 10
    const data = new Uint8ClampedArray(width * height * 4).fill(255)
    const imageData = new ImageData(data, width, height)
    const result = makeIndexedImageFromImageData(imageData)

    expect(result.data.length).toBe(100)
    expect(result.data instanceof Uint32Array).toBe(true)
    expect(result.palette instanceof Uint32Array).toBe(true)
  })

  describe('makeIndexedImageFromImageData Overload', () => {
    it('should create an IndexedImage from raw Uint8ClampedArray, width, and height', () => {
      const width = 2
      const height = 1
      const data = new Uint8ClampedArray([
        255, 0, 0, 255, // Red
        0, 255, 0, 0,   // Transparent Green (should be indexed as transparent)
      ])

      // Call using the raw data overload
      const result = makeIndexedImageFromImageDataRaw(data, width, height)

      expect(result.w).toBe(2)
      expect(result.h).toBe(1)
      expect(result.data.length).toBe(2)

      // The second pixel was transparent (alpha 0), so it should map to index 0
      expect(result.data[1]).toBe(result.transparentPalletIndex)

      // Ensure the palette is a Uint32Array and contains the colors
      expect(result.palette).toBeInstanceOf(Uint32Array)
      expect(result.palette.length).toBe(2)
    })

    it('should produce identical results for both overloads', () => {
      const width = 1
      const height = 1
      const buffer = new Uint8ClampedArray([0, 0, 255, 255])

      const imageData = new ImageData(new Uint8ClampedArray(buffer), width, height)

      const resA = makeIndexedImageFromImageData(imageData)
      const resB = makeIndexedImageFromImageDataRaw(buffer, width, height)

      expect(resA.w).toBe(resB.w)
      expect(resA.data[0]).toBe(resB.data[0])
      expect(resA.palette[0]).toBe(resB.palette[0])
    })

    it('should correctly pack colors as unsigned 32-bit integers in the palette', () => {
      const width = 1
      const height = 1
      // White: 0xFFFFFFFF
      const data = new Uint8ClampedArray([255, 255, 255, 255])

      const result = makeIndexedImageFromImageDataRaw(data, width, height)

      // Using >>> 0 ensures it's compared as a large positive integer, not -1
      const expectedColor = 0xFFFFFFFF >>> 0

      expect(result.palette[1]).toBe(expectedColor)
      expect(result.palette[1]).toBeGreaterThan(0)
    })
  })

  describe('IndexedImage.getColorAt', () => {
    it('should return the correct packed color for given coordinates', () => {
      const width = 2
      const height = 2
      const data = new Uint8ClampedArray(width * height * 4)

      // Red pixel at (0, 0)
      data[0] = 255
      data[1] = 0
      data[2] = 0
      data[3] = 255

      // Green pixel at (1, 1)
      const offset = (1 + 1 * width) * 4
      data[offset] = 0
      data[offset + 1] = 255
      data[offset + 2] = 0
      data[offset + 3] = 255

      const img = makeIndexedImageFromImageDataRaw(data, width, height)

      // Verify Red at (0, 0)
      // 0xFF0000FF in little-endian is typically 4278190335
      const colorRed = getIndexedImageColor(img, 0, 0)
      expect(colorRed).not.toBe(0)

      // Verify Green at (1, 1)
      const colorGreen = getIndexedImageColor(img, 1, 1)
      expect(colorGreen).not.toBe(colorRed)

      // Verify transparency normalization at (1, 0) - untouched pixels are 0,0,0,0
      const colorTrans = getIndexedImageColor(img, 1, 0)
      expect(colorTrans).toBe(0)
    })

    it('should handle images where width and height differ', () => {
      const width = 5
      const height = 2
      const data = new Uint8ClampedArray(width * height * 4)

      // Set pixel at (4, 1) - the very last pixel
      const lastPixelIdx = (4 + 1 * width) * 4
      data[lastPixelIdx] = 123
      data[lastPixelIdx + 3] = 255

      const img = makeIndexedImageFromImageDataRaw(data, width, height)
      const result = getIndexedImageColor(img, 4, 1)

      // Check that the blue channel or alpha is present in the packed int
      expect(result).toBeGreaterThan(0)
    })
  })
})
