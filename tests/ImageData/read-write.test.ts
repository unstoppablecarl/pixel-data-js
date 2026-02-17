import { beforeEach, describe, expect, it } from 'vitest'
import type { Color32, ImageDataLike } from '../../src/_types'
import { makeImageDataColor32Adapter } from '../../src/ImageData/read-write-pixels'

describe('makeImageDataColor32Adapter', () => {
  let mockImageData: ImageDataLike
  const width = 4
  const height = 4

  beforeEach(() => {
    // Create a 4x4 image (16 pixels, 64 bytes)
    const buffer = new ArrayBuffer(width * height * 4)
    mockImageData = {
      width,
      height,
      data: new Uint8ClampedArray(buffer),
    }
  })

  describe('Initialization', () => {
    it('should create a Uint32Array view of the same buffer', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      expect(adapter.data32).toBeInstanceOf(Uint32Array)
      expect(adapter.data32.length).toBe(width * height)
      expect(adapter.data32.buffer).toBe(mockImageData.data.buffer)
    })
  })

  describe('inBounds', () => {
    it('should return true for coordinates outside the image', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      expect(adapter.inBounds(-1, 0)).toBe(true)
      expect(adapter.inBounds(width, 0)).toBe(true)
      expect(adapter.inBounds(0, -1)).toBe(true)
      expect(adapter.inBounds(0, height)).toBe(true)
    })

    it('should return false for coordinates inside the image', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      expect(adapter.inBounds(0, 0)).toBe(false)
      expect(adapter.inBounds(width - 1, height - 1)).toBe(false)
    })
  })

  describe('setPixel and getPixel', () => {
    it('should set and get a 32-bit color correctly', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      const color = 0xFFAABBCC as Color32 // A: 255, B: 170, G: 187, R: 204

      adapter.setPixel(1, 1, color)
      expect(adapter.getPixel(1, 1)).toBe(color)
    })

    it('should update the underlying Uint8ClampedArray', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      // 0xAABBGGRR -> In Little Endian R is first byte
      const color = 0xFF332211 as Color32

      adapter.setPixel(0, 0, color)

      // index (0,0) starts at byte 0
      expect(mockImageData.data[0]).toBe(0x11) // R
      expect(mockImageData.data[1]).toBe(0x22) // G
      expect(mockImageData.data[2]).toBe(0x33) // B
      expect(mockImageData.data[3]).toBe(0xFF) // A
    })

    it('should return undefined when getting out of bounds', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      expect(adapter.getPixel(99, 99)).toBeUndefined()
    })

    it('should not throw or modify data when setting out of bounds', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      const color = 0xFFFFFFFF as Color32

      adapter.setPixel(-1, -1, color)

      // Verify no data was changed in the buffer
      const allZeros = Array.from(mockImageData.data).every(v => v === 0)
      expect(allZeros).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('should handle a 1x1 image', () => {
      const tinyData: ImageDataLike = {
        width: 1,
        height: 1,
        data: new Uint8ClampedArray(4),
      }
      const adapter = makeImageDataColor32Adapter(tinyData)
      const color = 0x12345678 as Color32

      adapter.setPixel(0, 0, color)
      expect(adapter.getPixel(0, 0)).toBe(color)
    })

    it('should reflect changes made directly to data32', () => {
      const adapter = makeImageDataColor32Adapter(mockImageData)
      const color = 0xDEADC0DE as Color32

      adapter.data32[0] = color
      expect(adapter.getPixel(0, 0)).toBe(color)
    })
  })
})
