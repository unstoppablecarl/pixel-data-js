import { describe, expect, it } from 'vitest'
import { invertPixelData, type BinaryMask } from '../../src'
import { makeTestPixelData, pack } from '../_helpers'

describe('PixelData Inversion', () => {
  const RED = pack(255, 0, 0, 255)
  const CYAN = pack(0, 255, 255, 255)
  const GREEN_HALF = pack(0, 255, 0, 128)

  it('correctly inverts a Red pixel to Cyan via the 32-bit view', () => {
    const pixels = makeTestPixelData(1, 1, RED)

    invertPixelData(pixels)

    // Expected Cyan: 0, 255, 255, 255
    expect(pixels.data32[0]).toBe(CYAN)

    // Also verify the original buffer was updated via the underlying buffer view
    expect(pixels.imageData.data[0]).toBe(0)
    expect(pixels.imageData.data[1]).toBe(255)
    expect(pixels.imageData.data[2]).toBe(255)
  })

  it('preserves the Alpha channel exactly', () => {
    const pixels = makeTestPixelData(1, 1, GREEN_HALF)

    invertPixelData(pixels)

    // Alpha is the 4th byte.
    expect(pixels.imageData.data[3]).toBe(128)
  })

  it('handles bitwise shift logic for data32 length', () => {
    const pixels = makeTestPixelData(2, 2)

    // 16 bytes >> 2 = 4 elements in Uint32Array
    expect(pixels.data32.length).toBe(4)
  })

  it('inverts only a specified sub-rectangle', () => {
    const pixels = makeTestPixelData(2, 2, RED)

    // Invert only the bottom-right pixel
    invertPixelData(pixels, { x: 1, y: 1, w: 1, h: 1 })

    // data32 is in row-major order: (0,0), (1,0), (0,1), (1,1)
    expect(pixels.data32[0]).toBe(RED) // top-left
    expect(pixels.data32[1]).toBe(RED) // top-right
    expect(pixels.data32[2]).toBe(RED) // bottom-left
    expect(pixels.data32[3]).toBe(CYAN) // bottom-right
  })

  it('correctly applies a binary mask', () => {
    const pixels = makeTestPixelData(2, 2, RED)
    const mask = new Uint8Array([
      1, 0, // top row
      0, 1, // bottom row
    ]) as BinaryMask

    invertPixelData(pixels, { mask })

    expect(pixels.data32[0]).toBe(CYAN) // (0,0) - mask=1
    expect(pixels.data32[1]).toBe(RED)  // (1,0) - mask=0
    expect(pixels.data32[2]).toBe(RED)  // (0,1) - mask=0
    expect(pixels.data32[3]).toBe(CYAN) // (1,1) - mask=1
  })

  it('correctly applies an inverted binary mask', () => {
    const pixels = makeTestPixelData(2, 2, RED)
    const mask = new Uint8Array([
      1, 0, // top row
      0, 1, // bottom row
    ]) as BinaryMask

    invertPixelData(pixels, { mask, invertMask: true })

    expect(pixels.data32[0]).toBe(RED)  // (0,0) - mask=1, inverted
    expect(pixels.data32[1]).toBe(CYAN) // (1,0) - mask=0, inverted
    expect(pixels.data32[2]).toBe(CYAN) // (0,1) - mask=0, inverted
    expect(pixels.data32[3]).toBe(RED)  // (1,1) - mask=1, inverted
  })

  it('clips the operation if the rectangle is out of bounds', () => {
    const pixels = makeTestPixelData(2, 2, RED)

    // This rect is 2x2 but starts at (1,1), so only one pixel is inside the image
    invertPixelData(pixels, { x: 1, y: 1, w: 2, h: 2 })

    expect(pixels.data32[0]).toBe(RED)
    expect(pixels.data32[1]).toBe(RED)
    expect(pixels.data32[2]).toBe(RED)
    expect(pixels.data32[3]).toBe(CYAN) // Only (1,1) should be inverted
  })

  it('handles negative coordinates by clipping', () => {
    const pixels = makeTestPixelData(2, 2, RED)

    // This rect is 2x2 but starts at (-1,-1), so only one pixel (0,0) is inside the image
    invertPixelData(pixels, { x: -1, y: -1, w: 2, h: 2 })

    expect(pixels.data32[0]).toBe(CYAN) // Only (0,0) should be inverted
    expect(pixels.data32[1]).toBe(RED)
    expect(pixels.data32[2]).toBe(RED)
    expect(pixels.data32[3]).toBe(RED)
  })

  it('does nothing if the rectangle is entirely out of bounds', () => {
    const pixels = makeTestPixelData(2, 2, RED)
    const originalData = new Uint32Array(pixels.data32)

    invertPixelData(pixels, { x: 10, y: 10, w: 2, h: 2 })

    expect(pixels.data32).toEqual(originalData)
  })
})
