import type { Color32, RGBA } from '@/index'
import {
  packColor,
  packRGBA,
  unpackAlpha,
  unpackBlue,
  unpackColor,
  unpackColorTo,
  unpackGreen,
  unpackRed,
} from '@/index'
import { describe, expect, it } from 'vitest'

describe('Packing and Unpacking', () => {
  // Test constants: Red=34 (0x22), Green=68 (0x44), Blue=102 (0x66), Alpha=255 (0xFF)
  // Little-endian packed: 0xFF664422
  const TEST_COLOR_BITS = 0xFF664422 as Color32
  const TEST_RGBA: RGBA = { r: 34, g: 68, b: 102, a: 255 }
  it('should pack individual channels into a Color32', () => {
    const packed = packColor(34, 68, 102, 255)
    expect(packed).toBe(TEST_COLOR_BITS)
  })

  it('should pack an RGBA object into a Color32', () => {
    expect(packRGBA(TEST_RGBA)).toBe(TEST_COLOR_BITS)
  })

  it('should extract individual channels correctly', () => {
    expect(unpackRed(TEST_COLOR_BITS)).toBe(34)
    expect(unpackGreen(TEST_COLOR_BITS)).toBe(68)
    expect(unpackBlue(TEST_COLOR_BITS)).toBe(102)
    expect(unpackAlpha(TEST_COLOR_BITS)).toBe(255)
  })

  it('should unpack into a new RGBA object', () => {
    expect(unpackColor(TEST_COLOR_BITS)).toEqual(TEST_RGBA)
  })

  it('should unpack into a scratch object to save memory', () => {
    const scratch: RGBA = { r: 0, g: 0, b: 0, a: 0 }
    const result = unpackColorTo(TEST_COLOR_BITS, scratch)

    expect(result).toBe(scratch) // Check referential equality
    expect(scratch).toEqual(TEST_RGBA)
  })

  describe('Integer Edge Cases', () => {
    it('should handle high-bit alpha without sign-extension issues', () => {
      // Alpha 255 sets the 31st bit.
      // Without >>> 0, bitwise ops treat this as a negative signed integer.
      const opaqueWhite = packColor(255, 255, 255, 255)
      expect(opaqueWhite).toBeGreaterThan(0)
      expect(unpackAlpha(opaqueWhite)).toBe(255)
    })
  })
})
