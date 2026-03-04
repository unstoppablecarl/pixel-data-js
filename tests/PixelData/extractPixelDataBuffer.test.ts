import { describe, expect, it } from 'vitest'
import { ImageData as NapiImageData } from '@napi-rs/canvas'
import { extractPixelDataBuffer, PixelData } from '../../src'
import { type Rect } from '../../src'

describe('extractPixelDataBuffer', () => {
  const createTestPixelData = (w: number, h: number) => {
    const buffer = new Uint8ClampedArray(w * h * 4)
    const imageData = new NapiImageData(buffer, w, h) as unknown as ImageData
    const pd = new PixelData(imageData)

    // Fill with unique 32-bit values for identification
    for (let i = 0; i < pd.data32.length; i++) {
      pd.data32[i] = i + 1
    }

    return pd
  }

  it('should extract a centered sub-region correctly', () => {
    const source = createTestPixelData(4, 4)
    // Extract middle 2x2
    const result = extractPixelDataBuffer(source, 1, 1, 2, 2)

    expect(result).toBeInstanceOf(Uint32Array)
    expect(result.length).toBe(4)

    // Expected indices from 4x4:
    // [ (1,1), (2,1) ] -> [ 5, 6 ] (0-indexed was 5,6)
    // [ (1,2), (2,2) ] -> [ 9, 10 ]
    expect(result[0]).toBe(6)
    expect(result[1]).toBe(7)
    expect(result[2]).toBe(10)
    expect(result[3]).toBe(11)
  })

  it('should handle out-of-bounds extraction by padding with zeros', () => {
    const source = createTestPixelData(2, 2)
    // Source is [[1,2], [3,4]]. Extract 2x2 starting at (-1, -1)
    const result = extractPixelDataBuffer(source, -1, -1, 2, 2)

    expect(result.length).toBe(4)
    // (-1,-1) is OOB -> 0
    // (0,-1) is OOB -> 0
    // (-1,0) is OOB -> 0
    // (0,0) is IB -> 1
    expect(result[0]).toBe(0)
    expect(result[1]).toBe(0)
    expect(result[2]).toBe(0)
    expect(result[3]).toBe(1)
  })

  it('should return an empty Uint32Array for zero dimensions', () => {
    const source = createTestPixelData(2, 2)
    const result = extractPixelDataBuffer(source, 0, 0, 0, 0)

    expect(result.length).toBe(0)
    expect(result).toBeInstanceOf(Uint32Array)
  })

  it('should handle fully out-of-bounds regions', () => {
    const source = createTestPixelData(2, 2)
    const result = extractPixelDataBuffer(source, 10, 10, 2, 2)

    expect(result.length).toBe(4)
    expect(result.every((val) => val === 0)).toBe(true)
  })

  it('should maintain bitwise integrity of RGBA values', () => {
    const buffer = new Uint8ClampedArray([255, 128, 64, 200])
    const img = new NapiImageData(buffer, 1, 1) as unknown as ImageData
    const source = new PixelData(img)

    const result = extractPixelDataBuffer(source, 0, 0, 1, 1)

    // Check that the 32-bit value matches exactly
    expect(result[0]).toBe(source.data32[0])
  })

  describe('extractPixelDataBuffer - Rect Overload', () => {
    const createTestPixelData = (w: number, h: number) => {
      const buffer = new Uint8ClampedArray(w * h * 4)
      const imageData = new NapiImageData(buffer, w, h) as unknown as ImageData
      const pd = new PixelData(imageData)

      for (let i = 0; i < pd.data32.length; i++) {
        pd.data32[i] = i + 1
      }

      return pd
    }

    it('should extract correctly when passed a Rect object', () => {
      const source = createTestPixelData(4, 4)
      const rect: Rect = {
        x: 1,
        y: 1,
        w: 2,
        h: 2
      }

      const result = extractPixelDataBuffer(source, rect)

      expect(result).toBeInstanceOf(Uint32Array)
      expect(result.length).toBe(4)

      // Check expected 32-bit values from the 4x4 grid
      // Row 1: indices 5, 6 -> values 6, 7
      // Row 2: indices 9, 10 -> values 10, 11
      expect(result[0]).toBe(6)
      expect(result[1]).toBe(7)
      expect(result[2]).toBe(10)
      expect(result[3]).toBe(11)
    })

    it('should handle a Rect object with negative coordinates', () => {
      const source = createTestPixelData(2, 2)
      const rect: Rect = {
        x: -1,
        y: 0,
        w: 2,
        h: 1
      }

      const result = extractPixelDataBuffer(source, rect)

      expect(result.length).toBe(2)
      // index (-1, 0) -> 0 (OOB)
      // index (0, 0) -> 1 (IB)
      expect(result[0]).toBe(0)
      expect(result[1]).toBe(1)
    })

    it('should work with different Rect object shapes (Duck Typing)', () => {
      const source = createTestPixelData(2, 2)
      // Testing that it accepts anything matching the Rect interface
      const customRect = {
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        otherParam: 'ignored'
      }

      const result = extractPixelDataBuffer(source, customRect as Rect)

      expect(result.length).toBe(1)
      expect(result[0]).toBe(1)
    })
  })
})
