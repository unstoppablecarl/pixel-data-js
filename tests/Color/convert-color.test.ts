import {
  type Color32,
  color32ToCssRGBA,
  color32ToCssRGBAString,
  color32ToHex,
  type CssRGBA,
  CssRGBAToColor32,
  packColor,
} from '@/index'
import { describe, expect, it } from 'vitest'

describe('Color32 Bitwise Utilities', () => {
  // Test constants: Red=34 (0x22), Green=68 (0x44), Blue=102 (0x66), Alpha=255 (0xFF)
  // Little-endian packed: 0xFF664422
  const TEST_COLOR_BITS = 0xFF664422 as Color32

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

  describe('color32ToCssRGBA', () => {
    it('should convert opaque red (0xFF0000FF)', () => {
      // Format: 0x AA(FF) BB(00) GG(00) RR(FF)
      const color = 0xFF0000FF as Color32
      expect(color32ToCssRGBAString(color)).toBe('rgba(255,0,0,1)')
    })

    it('should convert opaque white (0xFFFFFFFF)', () => {
      const color = 0xFFFFFFFF as Color32
      expect(color32ToCssRGBAString(color)).toBe('rgba(255,255,255,1)')
    })

    it('should convert opaque black (0xFF000000)', () => {
      const color = 0xFF000000 as Color32
      expect(color32ToCssRGBAString(color)).toBe('rgba(0,0,0,1)')
    })

    it('should convert fully transparent color (0x00112233)', () => {
      // Alpha is 00, so the result should end in ,0)
      const color = 0x00332211 as Color32
      expect(color32ToCssRGBAString(color)).toBe('rgba(17,34,51,0)')
    })

    it('should handle semi-transparency with clean formatting (0.5)', () => {
      // 127.5 rounded to 128 for an approx 0.5 alpha
      // 0x80 = 128. 128 / 255 ≈ 0.502
      const color = 0x80FFFFFF as Color32
      const result = color32ToCssRGBAString(color)

      // Check that it's a valid rgba string and the alpha is correctly formatted
      expect(result).toMatch(/^rgba\(255,255,255,0\.502\)$/)
    })

    it('should handle the regex cleanup for whole numbers (Alpha 1.0)', () => {
      // This specifically tests the .replace(/\.?0+$/, '') logic
      // (255/255).toFixed(3) is "1.000", which should become "1"
      const color = 0xFF123456 as Color32
      const result = color32ToCssRGBAString(color)
      expect(result.endsWith(',1)')).toBe(true)
      expect(result).not.toContain('1.000')
    })

    it('should handle mid-range values correctly', () => {
      // R: 10 (0x0A), G: 20 (0x14), B: 30 (0x1E), A: 200 (0xC8)
      const color = 0xC81E140A as Color32
      expect(color32ToCssRGBAString(color)).toBe('rgba(10,20,30,0.784)')
    })

    it('should handle very small alpha values', () => {
      // Alpha: 1 (1/255 ≈ 0.0039...)
      const color = 0x01000000 as Color32
      expect(color32ToCssRGBAString(color)).toBe('rgba(0,0,0,0.004)')
    })
  })
})

describe('Color Conversions', () => {
  describe('color32ToCssRGBA', () => {
    it('converts opaque white correctly', () => {
      const white = 0xFFFFFFFF as Color32
      const result = color32ToCssRGBA(white)

      expect(result).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 1,
      })
    })

    it('converts semi-transparent red correctly', () => {
      // 0x80 (128) alpha, 0x00 blue, 0x00 green, 0xFF red
      const semiRed = 0x800000FF as Color32
      const result = color32ToCssRGBA(semiRed)

      expect(result.r).toBe(255)
      expect(result.a).toBeCloseTo(128 / 255, 5)
    })

    it('converts black (zero) correctly', () => {
      const black = 0x00000000 as Color32
      const result = color32ToCssRGBA(black)

      expect(result).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 0,
      })
    })
  })

  describe('CssRGBAToColor32', () => {
    it('converts CSS RGBA to 32-bit integer', () => {
      const css = {
        r: 255,
        g: 165,
        b: 0,
        a: 1,
      } as CssRGBA
      const result = CssRGBAToColor32(css)

      // Expected: 0xFF00A5FF
      expect(result).toBe(0xFF00A5FF >>> 0)
    })

    it('handles floating point alpha correctly', () => {
      const css = {
        r: 0,
        g: 0,
        b: 0,
        a: 0.5,
      } as CssRGBA
      const result = CssRGBAToColor32(css)
      const alphaPart = (result >>> 24) & 0xFF

      expect(alphaPart).toBe(127)
    })
  })

  describe('Round-trip', () => {
    it('should maintain consistency when converted back and forth', () => {
      const originalColor = 0x7A2FBF44 >>> 0
      const css = color32ToCssRGBA(originalColor as Color32)
      const roundTrip = CssRGBAToColor32(css)

      expect(roundTrip).toBe(originalColor)
    })
  })
})
