import { type ImageDataLike, makePixelData } from '@/index'
import { createImageData } from '@napi-rs/canvas/node-canvas'
import { describe, expect, it } from 'vitest'
import { copyTestPixelData } from '../_helpers'

describe('PixelData', () => {
  it('should initialize width, height, and data32 view', () => {
    const width = 2
    const height = 2
    // 4 pixels * 4 bytes = 16 bytes
    const buffer = new Uint8ClampedArray(16)
    const imageData = createImageData(buffer, width, height) as ImageData

    const pixelData = makePixelData(imageData)

    expect(pixelData.w).toBe(width)
    expect(pixelData.h).toBe(height)
    expect(pixelData.data.length).toBe(4)
  })

  it('should correctly map Uint8 colors to a single Uint32 value', () => {
    const buffer = new Uint8ClampedArray(4)
    // RGBA: 255, 0, 0, 255 (Red)
    buffer[0] = 255
    buffer[1] = 0
    buffer[2] = 0
    buffer[3] = 255
    const imageData = createImageData(buffer, 1, 1) as ImageData

    const pixelData = makePixelData(imageData)

    // On little-endian systems, 0xFF0000FF is Red
    // 0x (Alpha)(Blue)(Green)(Red) -> 0xFF 00 00 FF
    expect(pixelData.data[0]).toBe(0xFF0000FF)
  })

  it('should create a deep copy with the copy() method', () => {
    const buffer = new Uint8ClampedArray(4)
    buffer.fill(255)
    const imageData = createImageData(buffer, 1, 1) as ImageData

    const original = makePixelData(imageData)
    const clone = copyTestPixelData(original)

    // Modify the original
    original.data[0] = 0x00000000

    expect(clone.data[0]).toBe(0xFFFFFFFF)
    expect(clone.w).toBe(original.w)
    expect(clone.h).toBe(original.h)
    expect(clone).not.toBe(original)
  })

  it('should use the instance constructor when global ImageData is undefined', () => {

    class MockImageData implements ImageDataLike {
      public readonly width: number
      public readonly height: number
      public readonly data: Uint8ClampedArray

      constructor(
        data: Uint8ClampedArray,
        width: number,
        height: number,
      ) {
        this.data = data
        this.width = width
        this.height = height
      }
    }

    const pixelData = makePixelData<MockImageData>(new MockImageData(new Uint8ClampedArray(4), 1, 1))
    const copied = copyTestPixelData(pixelData)

    expect(copied.w).toBe(1)
    expect(copied.h).toBe(1)
    expect(copied.imageData).toBeInstanceOf(MockImageData)
  })
})
