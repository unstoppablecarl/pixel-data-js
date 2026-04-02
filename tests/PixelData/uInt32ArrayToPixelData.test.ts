import { describe, expect, it } from 'vitest'
import { copyPixelData } from '../_helpers'
import { uInt32ArrayToPixelData } from './uInt32ArrayToPixelData'

describe('uInt32ArrayToPixelData', () => {
  it('should create a PixelData instance with correct dimensions', () => {
    const width = 2
    const height = 2
    const data = new Uint32Array(4)
    const result = uInt32ArrayToPixelData(data, width, height)
    expect(result.width).toBe(width)
    expect(result.height).toBe(height)
    expect(result.data32.length).toBe(4)
  })

  it('should map color values correctly via the ImageData bridge', () => {
    const width = 1
    const height = 1
    const color = 0xff0000ff
    const data = new Uint32Array([color])
    const result = uInt32ArrayToPixelData(data, width, height)
    // This verifies the byte-shuffle through the constructor works
    expect(result.data32[0]).toBe(color)
  })

  it('should contain a distinct buffer from the input due to ImageData copy', () => {
    const data = new Uint32Array([0x00000000])
    const result = uInt32ArrayToPixelData(data, 1, 1)
    // Mutating the input
    data[0] = 0xffffffff
    // Because of the native ImageData constructor, this should NOT change
    // If you need it to change, you'd use a "Like" version instead
    expect(result.data32[0]).toBe(0)
  })
})

describe('PixelData Class Methods', () => {
  it('should correctly copy a PixelData instance', () => {
    const data = new Uint32Array([0xffffffff])
    const original = uInt32ArrayToPixelData(data, 1, 1)
    const clone = copyPixelData(original)
    expect(clone.width).toBe(original.width)
    expect(clone.data32[0]).toBe(0xffffffff)
    // Verify they are independent memory blocks
    clone.data32[0] = 0x00000000
    expect(original.data32[0]).toBe(0xffffffff)
  })

  it('should update properties when using set()', () => {
    const initial = uInt32ArrayToPixelData(new Uint32Array([0]), 1, 1)
    const newBuffer = new Uint8ClampedArray([255, 255, 255, 255])
    const newImg = new ImageData(newBuffer, 1, 1)
    initial.set(newImg)
    expect(initial.data32[0]).toBe(0xffffffff)
  })
})
