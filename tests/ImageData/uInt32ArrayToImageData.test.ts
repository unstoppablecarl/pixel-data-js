import { describe, expect, it } from 'vitest'
import { uInt32ArrayToImageData, uInt32ArrayToImageDataLike } from '../../src/ImageData/uInt32ArrayToImageData'

describe('uInt32ArrayToImageData', () => {
  it('should correctly map a Uint32Array to ImageData', () => {
    const width = 1
    const height = 1
    const data = new Uint32Array([0xff0000ff])
    const result = uInt32ArrayToImageData(data, width, height)
    expect(result.width).toBe(width)
    expect(result.height).toBe(height)
    expect(result.data.constructor.name).toBe('Uint8ClampedArray')
    // Checking byte order (assuming Little-Endian for RGBA)
    expect(result.data[0]).toBe(0xff)
    expect(result.data[3]).toBe(0xff)
  })

  it('should map Uint32Array to specific RGBA byte offsets', () => {
    const width = 1
    const height = 1
    const data = new Uint32Array(1)
    const view = new DataView(data.buffer)

    // Explicitly set bytes so we know exactly what to expect
    // Offset 0 = R, 1 = G, 2 = B, 3 = A
    view.setUint8(0, 255)
    view.setUint8(1, 128)
    view.setUint8(2, 64)
    view.setUint8(3, 200)

    const result = uInt32ArrayToImageData(data, width, height)

    // Now we are testing the actual mapping logic
    expect(result.data[0]).toBe(255)
    expect(result.data[1]).toBe(128)
    expect(result.data[2]).toBe(64)
    expect(result.data[3]).toBe(200)
  })
})

describe('uInt32ArrayToImageDataLike', () => {
  it('should return a compatible object structure', () => {
    const width = 2
    const height = 1
    const data = new Uint32Array([0, 0])
    const result = uInt32ArrayToImageDataLike(data, width, height)
    expect(result).toHaveProperty('width', 2)
    expect(result).toHaveProperty('height', 1)
    expect(result.data.length).toBe(8)
  })

  it('should handle sliced views of a buffer', () => {
    const fullData = new Uint32Array([0x11223344, 0x55667788])
    const slicedData = fullData.subarray(1, 2)
    const result = uInt32ArrayToImageDataLike(slicedData, 1, 1)
    const expectedByte = 0x88
    expect(result.data[0]).toBe(expectedByte)
  })
  it('should maintain a live reference in the Like version', () => {
    const width = 1
    const height = 1
    const data = new Uint32Array([0x00000000])
    const result = uInt32ArrayToImageDataLike(data, width, height)

    // Initial check
    expect(result.data[0]).toBe(0)

    // Mutate the original Uint32Array
    data[0] = 0xffffffff

    // This will now pass because it's the same memory reference
    expect(result.data[0]).toBe(255)
    expect(result.data[3]).toBe(255)
  })
})
