import { describe, expect, it } from 'vitest'
import { makeIndexedImage } from '../../src'

describe('makeIndexedImage', () => {
  it('should initialize with a width and height', () => {
    const data = new Uint8ClampedArray(4).fill(0)
    const imageData = new ImageData(data, 1, 1)
    const result = makeIndexedImage(imageData)

    expect(result.width).toBe(1)
    expect(result.height).toBe(1)
  })

  it('should normalize all transparent pixels to transparentPalletIndex 0', () => {
    // 2 pixels: one transparent black, one transparent red (alpha is 0)
    const data = new Uint8ClampedArray([
      0, 0, 0, 0,   // Transparent Black
      255, 0, 0, 0, // Transparent Red (still transparent)
    ])
    const imageData = new ImageData(data, 2, 1)
    const result = makeIndexedImage(imageData)

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
    const result = makeIndexedImage(imageData)

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
    const result = makeIndexedImage(imageData)

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
    const result = makeIndexedImage(imageData)

    expect(result.data.length).toBe(100)
    expect(result.data instanceof Int32Array).toBe(true)
    // Fixed: Test was checking for Uint32Array, updated to match Int32Array palette
    expect(result.palette instanceof Uint32Array).toBe(true)
  })

  describe('makeIndexedImage Overload', () => {
    it('should create an IndexedImage from raw Uint8ClampedArray, width, and height', () => {
      const width = 2
      const height = 1
      const data = new Uint8ClampedArray([
        255, 0, 0, 255, // Red
        0, 255, 0, 0,   // Transparent Green (should be indexed as transparent)
      ])

      // Call using the raw data overload
      const result = makeIndexedImage(data, width, height)

      expect(result.width).toBe(2)
      expect(result.height).toBe(1)
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

      const resA = makeIndexedImage(imageData)
      const resB = makeIndexedImage(buffer, width, height)

      expect(resA.width).toBe(resB.width)
      expect(resA.data[0]).toBe(resB.data[0])
      expect(resA.palette[0]).toBe(resB.palette[0])
    })

    it('should correctly pack colors as unsigned 32-bit integers in the palette', () => {
      const width = 1
      const height = 1
      // White: 0xFFFFFFFF
      const data = new Uint8ClampedArray([255, 255, 255, 255])

      const result = makeIndexedImage(data, width, height)

      // Using >>> 0 ensures it's compared as a large positive integer, not -1
      const expectedColor = 0xFFFFFFFF >>> 0

      expect(result.palette[1]).toBe(expectedColor)
      expect(result.palette[1]).toBeGreaterThan(0)
    })
  })
})
