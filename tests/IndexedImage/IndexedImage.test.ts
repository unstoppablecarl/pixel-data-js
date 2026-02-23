import { describe, expect, it } from 'vitest'
import { makeIndexedImage } from '../../src/IndexedImage/IndexedImage'

describe('makeIndexedImage', () => {
  it('should initialize with a width and height', () => {
    const data = new Uint8ClampedArray(4).fill(0)
    const imageData = new ImageData(data, 1, 1)
    const result = makeIndexedImage(imageData)

    expect(result.width).toBe(1)
    expect(result.height).toBe(1)
  })

  it('should normalize all transparent pixels to transparentPalletIndex 0', () => {
    // 2 pixels: one transparent black, one transparent red
    const data = new Uint8ClampedArray([
      0, 0, 0, 0,   // Transparent Black
      255, 0, 0, 0, // Transparent Red
    ])
    const imageData = new ImageData(data, 2, 1)
    const result = makeIndexedImage(imageData)

    expect(result.transparentPalletIndex).toBe(0)
    expect(result.data[0]).toBe(0)
    expect(result.data[1]).toBe(0)
    // Palette should only have one entry for transparency (4 bytes)
    // plus any other unique colors found later
    expect(result.palette.slice(0, 4)).toEqual(new Uint8Array([0, 0, 0, 0]))
  })

  it('should map unique opaque colors to sequential indices', () => {
    const r = 255
    const g = 128
    const b = 64
    const a = 255

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
    // Index 0: 0,0,0,0
    // Index 1: r,g,b,a
    expect(result.palette[4]).toBe(r)
    expect(result.palette[5]).toBe(g)
    expect(result.palette[6]).toBe(b)
    expect(result.palette[7]).toBe(a)
  })

  it('should handle an image with no transparent pixels', () => {
    const data = new Uint8ClampedArray([
      255, 255, 255, 255,
      100, 100, 100, 255,
    ])
    const imageData = new ImageData(data, 2, 1)
    const result = makeIndexedImage(imageData)

    // Even if no transparent pixels exist in source,
    // index 0 is reserved for transparency by the implementation
    expect(result.transparentPalletIndex).toBe(0)
    expect(result.data[0]).toBe(1)
    expect(result.data[1]).toBe(2)
    expect(result.palette.length).toBe(12) // 3 colors * 4 bytes
  })

  it('should correctly calculate data length based on pixels', () => {
    const width = 10
    const height = 10
    const data = new Uint8ClampedArray(width * height * 4).fill(255)
    const imageData = new ImageData(data, width, height)
    const result = makeIndexedImage(imageData)

    expect(result.data.length).toBe(100)
    expect(result.data instanceof Int32Array).toBe(true)
    expect(result.palette instanceof Uint8Array).toBe(true)
  })
})
