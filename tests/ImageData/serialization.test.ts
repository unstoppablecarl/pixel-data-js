import { describe, expect, it } from 'vitest'
import {
  deserializeImageData,
  deserializeNullableImageData,
  type SerializedImageData,
  serializeImageData,
  serializeNullableImageData,
} from '../../src'

describe('ImageData Serialization Utilities', () => {

  // Helper to create a dummy ImageData object
  const createMockImageData = (w: number, h: number) => {
    const pixels = new Uint8ClampedArray(w * h * 4).fill(255) // Solid white
    // Set first pixel to Red for integrity check
    pixels[0] = 255
    pixels[1] = 0
    pixels[2] = 0
    pixels[3] = 255
    return new ImageData(pixels, w, h)
  }

  describe('serializeImageData', () => {
    it('should correctly serialize ImageData to base64', () => {
      const img = createMockImageData(2, 2)
      const serialized = serializeImageData(img)

      expect(serialized.width).toBe(2)
      expect(serialized.height).toBe(2)
      expect(typeof serialized.data).toBe('string')
      expect(serialized.data.length).toBeGreaterThan(0)
    })
  })

  describe('deserializeImageData', () => {
    it('should correctly reconstruct ImageData from serialized string', () => {
      const original = createMockImageData(1, 1)
      const serialized = serializeImageData(original)
      const deserialized = deserializeImageData(serialized)

      expect(deserialized.width).toBe(original.width)
      expect(deserialized.height).toBe(original.height)
      expect(deserialized.data).toEqual(original.data)
      // Check specific pixel value (Red)
      expect(deserialized.data[0]).toBe(255)
      expect(deserialized.data[1]).toBe(0)
    })
  })

  describe('Nullable Variants', () => {
    it('serializeNullableImageData returns null when input is null', () => {
      const result = serializeNullableImageData(null)
      expect(result).toBeNull()
    })

    it('serializeNullableImageData serializes when input is valid', () => {
      const img = createMockImageData(1, 1)
      const result = serializeNullableImageData(img)
      expect(result).not.toBeNull()
      expect(result?.width).toBe(1)
    })

    it('deserializeNullableImageData returns null when input is null', () => {
      const result = deserializeNullableImageData(null)
      expect(result).toBeNull()
    })

    it('deserializeNullableImageData deserializes when input is valid', () => {
      const data: SerializedImageData = {
        width: 1,
        height: 1,
        data: btoa(String.fromCharCode(...new Uint8Array([255, 0, 0, 255]))),
      }
      const result = deserializeNullableImageData(data)
      expect(result).toBeInstanceOf(ImageData)
      expect(result?.data[0]).toBe(255)
    })
  })

  describe('Edge Cases & Data Integrity', () => {
    it('handles very small images (1x1)', () => {
      const img = new ImageData(new Uint8ClampedArray([0, 0, 0, 0]), 1, 1)
      const serialized = serializeImageData(img)
      const deserialized = deserializeImageData(serialized)
      expect(deserialized.width).toBe(1)
    })

    it('maintains integrity of transparent pixels', () => {
      const img = new ImageData(new Uint8ClampedArray([0, 0, 0, 0]), 1, 1)
      const serialized = serializeImageData(img)
      const deserialized = deserializeImageData(serialized)
      expect(deserialized.data[3]).toBe(0)
    })

    it('handles different buffer types if passed (generics check)', () => {
      // Testing the generic <T extends ImageData>
      const customImg = {
        width: 1,
        height: 1,
        data: new Uint8ClampedArray([1, 2, 3, 4]),
        colorSpace: 'srgb',
      } as ImageData

      const result = serializeImageData(customImg)
      expect(result.data).toBe(btoa(String.fromCharCode(1, 2, 3, 4)))
    })
  })
})
