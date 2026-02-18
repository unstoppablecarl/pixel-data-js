import { describe, expect, it } from 'vitest'
import type { Color32, RGBA } from '../src'
import {
  color32ToCssRGBA,
  color32ToHex,
  colorDistance,
  lerpColor32,
  lerpColor32Fast,
  packColor,
  packRGBA,
  unpackAlpha,
  unpackBlue,
  unpackColor,
  unpackColorTo,
  unpackGreen,
  unpackRed,
} from '../src'
import { pack, unpack } from './_helpers'

describe('Color32 Bitwise Utilities', () => {
  // Test constants: Red=34 (0x22), Green=68 (0x44), Blue=102 (0x66), Alpha=255 (0xFF)
  // Little-endian packed: 0xFF664422
  const TEST_COLOR_BITS = 0xFF664422 as Color32
  const TEST_RGBA: RGBA = { r: 34, g: 68, b: 102, a: 255 }

  describe('Packing and Unpacking', () => {
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
  })

  describe('Color Calculations', () => {
    it('should calculate squared Euclidean distance between colors', () => {
      const colorA = packColor(100, 100, 100, 255)
      const colorB = packColor(110, 100, 100, 255)

      // (110-100)^2 + 0 + 0 + 0 = 100
      expect(colorDistance(colorA, colorB)).toBe(100)
    })

    it('should lerp between two colors', () => {
      const colorA = packColor(0, 0, 0, 0)
      const colorB = packColor(200, 100, 50, 250)

      const mid = lerpColor32(colorA, colorB, 0.5)

      expect(unpackColor(mid)).toEqual({
        r: 100,
        g: 50,
        b: 25,
        a: 125,
      })
    })

    it('should handle lerp at boundaries (t=0 and t=1)', () => {
      const colorA = packColor(255, 0, 0, 255)
      const colorB = packColor(0, 255, 0, 255)

      expect(lerpColor32(colorA, colorB, 0)).toBe(colorA)
      expect(lerpColor32(colorA, colorB, 1)).toBe(colorB)
    })
  })

  describe('Hex Conversion', () => {
    it('should convert Color32 to #RRGGBBAA string', () => {
      // 0xFF664422 -> #224466ff
      expect(color32ToHex(TEST_COLOR_BITS)).toBe('#224466ff')
    })

    it('should pad single-digit hex values with zeros', () => {
      const simpleColor = packColor(1, 2, 3, 4)
      expect(color32ToHex(simpleColor)).toBe('#01020304')
    })
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

  describe('color32ToCssRGBA', () => {
    it('should convert opaque red (0xFF0000FF)', () => {
      // Format: 0x AA(FF) BB(00) GG(00) RR(FF)
      const color = 0xFF0000FF as Color32
      expect(color32ToCssRGBA(color)).toBe('rgba(255,0,0,1)')
    })

    it('should convert opaque white (0xFFFFFFFF)', () => {
      const color = 0xFFFFFFFF as Color32
      expect(color32ToCssRGBA(color)).toBe('rgba(255,255,255,1)')
    })

    it('should convert opaque black (0xFF000000)', () => {
      const color = 0xFF000000 as Color32
      expect(color32ToCssRGBA(color)).toBe('rgba(0,0,0,1)')
    })

    it('should convert fully transparent color (0x00112233)', () => {
      // Alpha is 00, so the result should end in ,0)
      const color = 0x00332211 as Color32
      expect(color32ToCssRGBA(color)).toBe('rgba(17,34,51,0)')
    })

    it('should handle semi-transparency with clean formatting (0.5)', () => {
      // 127.5 rounded to 128 for an approx 0.5 alpha
      // 0x80 = 128. 128 / 255 ≈ 0.502
      const color = 0x80FFFFFF as Color32
      const result = color32ToCssRGBA(color)

      // Check that it's a valid rgba string and the alpha is correctly formatted
      expect(result).toMatch(/^rgba\(255,255,255,0\.502\)$/)
    })

    it('should handle the regex cleanup for whole numbers (Alpha 1.0)', () => {
      // This specifically tests the .replace(/\.?0+$/, '') logic
      // (255/255).toFixed(3) is "1.000", which should become "1"
      const color = 0xFF123456 as Color32
      const result = color32ToCssRGBA(color)
      expect(result.endsWith(',1)')).toBe(true)
      expect(result).not.toContain('1.000')
    })

    it('should handle mid-range values correctly', () => {
      // R: 10 (0x0A), G: 20 (0x14), B: 30 (0x1E), A: 200 (0xC8)
      const color = 0xC81E140A as Color32
      expect(color32ToCssRGBA(color)).toBe('rgba(10,20,30,0.784)')
    })

    it('should handle very small alpha values', () => {
      // Alpha: 1 (1/255 ≈ 0.0039...)
      const color = 0x01000000 as Color32
      expect(color32ToCssRGBA(color)).toBe(`rgba(0,0,0,0.004)`)
    })
  })

  describe('lerpColor32Fast Coverage', () => {
    // Test between Opaque White and Transparent Black
    const WHITE = pack(255, 255, 255, 255)
    const CLEAR = pack(0, 0, 0, 0)

    it('should hit every line and interpolate correctly at 50%', () => {
      // Weight = 128 (~50%)
      const result = lerpColor32Fast(WHITE, CLEAR, 128)
      const c = unpack(result)

      // Math: (255 * 128 + 0 * 127) >> 8 = 127
      expect(c.r).toBe(127)
      expect(c.g).toBe(127)
      expect(c.b).toBe(127)
      expect(c.a).toBe(127)
    })

    it('should handle alpha 0 (full destination)', () => {
      const BLUE = pack(0, 0, 255, 255)
      // Weight = 0 means take 100% of the destination
      const result = lerpColor32Fast(WHITE, BLUE, 0)
      const c = unpack(result)

      // (255 * 0 + 255 * 255) >> 8 = 254
      expect(c.b).toBeGreaterThanOrEqual(254)
      expect(c.r).toBe(0)
    })

    it('should handle alpha 255 (full source)', () => {
      // Weight = 255 means take 100% of the source
      const result = lerpColor32Fast(WHITE, CLEAR, 255)
      const c = unpack(result)

      // (255 * 255 + 0 * 0) >> 8 = 254
      expect(c.r).toBeGreaterThanOrEqual(254)
      expect(c.a).toBeGreaterThanOrEqual(254)
    })

    it('should ensure the result is a 32-bit unsigned integer', () => {
      const result = lerpColor32Fast(WHITE, WHITE, 255)
      // >>> 0 ensures it's a positive Uint32, not a signed negative
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThanOrEqual(0xFFFFFFFF)
    })
  })
})
