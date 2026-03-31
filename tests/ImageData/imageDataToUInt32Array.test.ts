import { imageDataToUInt32Array } from '@/index'
import { describe, expect, it } from 'vitest'

describe('imageDataToUInt32Array', () => {
  it('should create a 32-bit view that maps correctly to 8-bit color data', () => {
    // Create a 2x1 buffer (8 bytes total)
    const buffer = new Uint8ClampedArray([
      255, 0, 0, 255, // Red
      0, 255, 0, 255, // Green
    ])

    const imageData = {
      data: buffer,
      width: 2,
      height: 1,
    }

    const data32 = imageDataToUInt32Array(imageData)

    // Verify length (8 bytes >> 2 = 2 pixels)
    expect(data32.length).toBe(2)

    // Verify little-endian pixel packing (0xAABBGGRR)
    // Red: 255, 0, 0, 255 -> 0xFF0000FF
    expect(data32[0]).toBe(0xFF0000FF >>> 0)

    // Verify Green: 0, 255, 0, 255 -> 0xFF00FF00
    expect(data32[1]).toBe(0xFF00FF00 >>> 0)
  })

  it('should maintain a live reference to the original buffer', () => {
    const buffer = new Uint8ClampedArray(4)
    const imageData = {
      data: buffer,
      width: 1,
      height: 1,
    }

    const data32 = imageDataToUInt32Array(imageData)

    // Modify the 32-bit view
    data32[0] = 0xFFFFFFFF

    // Verify the 8-bit buffer updated
    expect(buffer[0]).toBe(255)
    expect(buffer[3]).toBe(255)
  })

  it('should handle byte offsets correctly', () => {
    // Create a larger buffer and a view into the middle of it
    const fullBuffer = new Uint8ClampedArray(12)
    const offsetBuffer = new Uint8ClampedArray(
      fullBuffer.buffer,
      4, // Offset by 4 bytes (1 pixel)
      8, // Length of 8 bytes (2 pixels)
    )

    const imageData = {
      data: offsetBuffer,
      width: 2,
      height: 1,
    }

    const data32 = imageDataToUInt32Array(imageData)

    expect(data32.length).toBe(2)
    expect(data32.byteOffset).toBe(4)
  })
})
