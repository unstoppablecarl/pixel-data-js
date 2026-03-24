import { createImageData } from '@napi-rs/canvas/node-canvas'
import { describe, expect, it } from 'vitest'
import { type ImageDataLike, PixelData } from '@/index'

describe('PixelData', () => {
  it('should initialize width, height, and data32 view', () => {
    const width = 2
    const height = 2
    // 4 pixels * 4 bytes = 16 bytes
    const buffer = new Uint8ClampedArray(16)
    const imageData = createImageData(buffer, width, height) as ImageData

    const pixelData = new PixelData(imageData)

    expect(pixelData.width).toBe(width)
    expect(pixelData.height).toBe(height)
    expect(pixelData.data32.length).toBe(4)
  })

  it('should correctly map Uint8 colors to a single Uint32 value', () => {
    const buffer = new Uint8ClampedArray(4)
    // RGBA: 255, 0, 0, 255 (Red)
    buffer[0] = 255
    buffer[1] = 0
    buffer[2] = 0
    buffer[3] = 255
    const imageData = createImageData(buffer, 1, 1) as ImageData

    const pixelData = new PixelData(imageData)

    // On little-endian systems, 0xFF0000FF is Red
    // 0x (Alpha)(Blue)(Green)(Red) -> 0xFF 00 00 FF
    expect(pixelData.data32[0]).toBe(0xFF0000FF)
  })

  it('should create a deep copy with the copy() method', () => {
    const buffer = new Uint8ClampedArray(4)
    buffer.fill(255)
    const imageData = createImageData(buffer, 1, 1) as ImageData

    const original = new PixelData(imageData)
    const clone = original.copy()

    // Modify the original
    original.data32[0] = 0x00000000

    expect(clone.data32[0]).toBe(0xFFFFFFFF)
    expect(clone.width).toBe(original.width)
    expect(clone.height).toBe(original.height)
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

    const pixelData = new PixelData<MockImageData>(new MockImageData(new Uint8ClampedArray(4), 1, 1))
    const copied = pixelData.copy()

    expect(copied.width).toBe(1)
    expect(copied.height).toBe(1)
    expect(copied.imageData).toBeInstanceOf(MockImageData)
  })
  it('should fallback to a plain object when constructor is not a valid class', () => {
    const width = 1
    const height = 1
    const data = new Uint8ClampedArray([255, 0, 0, 255])

    // Create a plain object (ImageDataLike)
    // This ensures .constructor === Object
    const plainImageData: ImageDataLike = {
      width,
      height,
      data,
    }

    const pixelData = new PixelData<ImageDataLike>(plainImageData)
    const clone = pixelData.copy()

    // Verify the copy was successful
    expect(clone.width).toBe(1)
    expect(clone.imageData.data[0]).toBe(255)

    // Verify it is a plain object and not a class instance
    // (Plain objects shouldn't have a custom constructor name)
    const constructorName = clone.imageData.constructor.name
    expect(constructorName).toBe('Object')

    // Verify deep copy of the buffer
    clone.imageData.data[0] = 100
    expect(pixelData.imageData.data[0]).toBe(255)
  })
})
