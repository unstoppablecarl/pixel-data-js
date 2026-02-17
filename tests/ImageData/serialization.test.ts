import { describe, expect, it } from 'vitest'
import {
  base64DecodeArrayBuffer,
  base64EncodeArrayBuffer,
  deserializeImageData,
  deserializeNullableImageData,
  deserializeRawImageData,
  serializeImageData,
  serializeNullableImageData,
} from '../../src'

describe('ImageData Serialization Utilities', () => {

  const mockRGBA = new Uint8ClampedArray([255, 0, 0, 255, 0, 255, 0, 255]) // Red pixel, Green pixel
  const mockImageDataLike = {
    width: 2,
    height: 1,
    data: mockRGBA,
  }

  describe('Base64 Low-level Helpers', () => {
    it('should encode ArrayBuffer to base64 string', () => {
      const buffer = new Uint8Array([71, 101, 109, 105, 110, 105]).buffer // "Gemini"
      const encoded = base64EncodeArrayBuffer(buffer)
      expect(encoded).toBe(btoa('Gemini'))
    })

    it('should decode base64 string back to Uint8ClampedArray', () => {
      const encoded = btoa(String.fromCharCode(10, 20, 30, 40))
      const decoded = base64DecodeArrayBuffer(encoded as any)

      expect(decoded).toBeInstanceOf(Uint8ClampedArray)
      expect(Array.from(decoded)).toEqual([10, 20, 30, 40])
    })
  })

  describe('Serialization Flow', () => {
    it('serializeImageData should convert ImageDataLike to SerializedImageData', () => {
      const result = serializeImageData(mockImageDataLike)
      expect(result.width).toBe(2)
      expect(result.height).toBe(1)
      expect(typeof result.data).toBe('string')
      // Decode back to check integrity
      expect(atob(result.data).charCodeAt(0)).toBe(255)
    })

    it('serializeNullableImageData should handle null and valid data', () => {
      expect(serializeNullableImageData(null)).toBeNull()
      const result = serializeNullableImageData(mockImageDataLike)
      expect(result).not.toBeNull()
      expect(result?.width).toBe(2)
    })
  })

  describe('Deserialization Flow', () => {
    const serialized = {
      width: 2,
      height: 1,
      data: btoa(String.fromCharCode(...mockRGBA)) as any,
    }

    it('deserializeRawImageData should return a plain object (ImageDataLike)', () => {
      const raw = deserializeRawImageData(serialized)
      expect(raw.width).toBe(2)
      expect(raw.data).toBeInstanceOf(Uint8ClampedArray)
      // Ensure it's not an actual ImageData instance if you just want the raw object
      expect(raw.constructor.name).not.toBe('ImageData')
    })

    it('deserializeImageData should return a real ImageData instance', () => {
      const img = deserializeImageData(serialized)
      expect(img).toBeInstanceOf(ImageData)
      expect(img.width).toBe(2)
      expect(img.data[0]).toBe(255)
    })

    it('deserializeNullableImageData should handle null and valid data', () => {
      expect(deserializeNullableImageData(null)).toBeNull()
      const result = deserializeNullableImageData(serialized)
      expect(result).toBeInstanceOf(ImageData)
    })
  })

  describe('Edge Cases & Integrity', () => {
    it('should preserve transparency (alpha channel)', () => {
      const transparent = new Uint8ClampedArray([0, 0, 0, 0])
      const data = { width: 1, height: 1, data: transparent }
      const roundTrip = deserializeImageData(serializeImageData(data))
      expect(roundTrip.data[3]).toBe(0)
    })

    it('should handle empty/zeroed buffers', () => {
      const zeroed = new Uint8ClampedArray(4).fill(0)
      const data = { width: 1, height: 1, data: zeroed }
      const serialized = serializeImageData(data)
      expect(serialized.data).toBe(btoa(String.fromCharCode(0, 0, 0, 0)))
    })
  })
})
