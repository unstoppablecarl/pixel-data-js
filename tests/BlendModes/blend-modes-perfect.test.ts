import { describe, expect, it } from 'vitest'
import {
  BlendMode,
  type Color32,
  INDEX_TO_PERFECT_BLEND,
  PERFECT_BLEND_MODE_BY_NAME,
  PERFECT_BLEND_MODES,
  PERFECT_BLEND_TO_INDEX,
} from '../../src'
import { unpack } from '../_helpers'

describe('Color Perfect Blending Functions', () => {
  // Test constants
  const opaqueWhite = 0xFFFFFFFF as Color32
  const opaqueBlack = 0xFF000000 as Color32
  const opaqueRed = 0xFF0000FF as Color32
  const opaqueBlue = 0xFFFF0000 as Color32
  const transparent = 0x00000000 as Color32
  const midGray = 0xFF808080 as Color32
  const halfAlphaRed = 0x800000FF as Color32

  describe('Common Alpha Branching Logic', () => {
    for (let i = 0; i < PERFECT_BLEND_MODES.length; i++) {
      if (i === BlendMode.overwrite) continue

      const name = BlendMode[i]
      const fn = PERFECT_BLEND_MODES[i]
      it(`${name} should return dst if src alpha is 0`, () => {
        const result = fn(transparent, opaqueRed)
        expect(unpack(result)).toEqual({
          r: 255,
          g: 0,
          b: 0,
          a: 255,
        })
      })
    }
  })

  describe('overwriteColor32', () => {
    it('returns the source color regardless of destination', () => {
      const src = 0x12345678 as Color32
      const dst = 0x87654321 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.overwrite(src, dst)

      expect(result).toBe(src)
    })

    it('preserves full transparency from source', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.overwrite(src, dst)

      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 0,
      })
    })

    it('preserves partial alpha and color components', () => {
      const src = 0x804080C0 as Color32
      const dst = 0xFFFFFFFF as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.overwrite(src, dst)

      expect(unpack(result)).toEqual({
        r: 192,
        g: 128,
        b: 64,
        a: 128,
      })
    })

    it('returns exactly the same reference/value for performance consistency', () => {
      const src = 0xFFABCDEF as Color32
      const dst = 0x00000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.overwrite(src, dst)

      // Using toBe to ensure no unnecessary object creation or bit manipulation occurred
      expect(result).toBe(src)
    })
  })

  describe('sourceOver', () => {
    it('returns src if src alpha is 255', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.sourceOver(opaqueRed, opaqueBlue)
      expect(unpack(result)).toEqual({
        r: 255,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('blends values correctly at 50% alpha', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.sourceOver(src, dst)
      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })
  })

  describe('darkenColor32', () => {
    it('selects source when lumSrc < lumDst (opaque)', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.darken(opaqueRed, opaqueWhite)
      expect(unpack(result)).toEqual({
        r: 255,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('selects destination when lumDst < lumSrc (opaque)', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.darken(opaqueWhite, opaqueBlack)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('handles the sa === 255 optimization branch', () => {
      const src = 0xFF112233 as Color32
      const dst = 0xFF445566 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.darken(src, dst)
      expect(unpack(result)).toEqual({
        r: 51,
        g: 34,
        b: 17,
        a: 255,
      })
    })

    it('handles lerp branch (0 < sa < 255)', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.darken(halfAlphaRed, opaqueBlue)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 127,
        a: 255,
      })
    })

    it('darken picks the minimum components', () => {
      const src = 0xFF00FFFF as Color32
      const dst = 0xFFFFFF00 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.darken(src, dst)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 255,
        b: 0,
        a: 255,
      })
    })
  })

  describe('multiplyColor32', () => {
    it('multiplies colors correctly', () => {
      const src = 0xFF808080 as Color32
      const dst = 0xFFFFFFFF as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.multiply(src, dst)
      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })

    it('handles lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.multiply(src, dst)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })
  })

  describe('colorBurnColor32', () => {
    it('handles sa === 255 branch', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.colorBurn(midGray, midGray)
      expect(unpack(result)).toEqual({
        r: 2,
        g: 2,
        b: 2,
        a: 255,
      })
    })

    it('handles the dr === 255 edge case', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.colorBurn(opaqueRed, opaqueWhite)
      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })

    it('handles the sr === 0 division guard', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.colorBurn(opaqueBlack, midGray)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('hits the sr === 0 branch via the || 1 fallback', () => {
      const dst = 0xFF7F7F7F as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.colorBurn(opaqueBlack, dst)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('handles lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.colorBurn(src, dst)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('handles the lerp branch (sa < 255)', () => {
      const src = 0x800000FF as Color32
      const dst = 0x80FFFFFF as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.darken(src, dst)
      expect(unpack(result)).toEqual({
        r: 255,
        g: 127,
        b: 127,
        a: 191,
      })
    })

    it('verifies the Math.max(0, ...) clamping', () => {
      const src = 0xFF010101 as Color32
      const dst = 0xFF010101 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.colorBurn(src, dst)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })
  })

  describe('linearBurnColor32', () => {
    it('handles sa === 255 branch', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.linearBurn(midGray, midGray)
      expect(unpack(result)).toEqual({
        r: 1,
        g: 1,
        b: 1,
        a: 255,
      })
    })

    it('handles clamping to 0', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.linearBurn(opaqueBlack, opaqueBlack)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('handles lerp branch', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.linearBurn(halfAlphaRed, midGray)
      expect(unpack(result)).toEqual({
        r: 128,
        g: 63,
        b: 63,
        a: 255,
      })
    })
  })

  describe('darkerColor32 coverage', () => {
    it('selects source color when lumSrc < lumDst (opaque)', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.darkerColor(opaqueBlue, opaqueRed)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 255,
        a: 255,
      })
    })

    it('selects destination color when lumDst < lumSrc (opaque)', () => {
      const result = PERFECT_BLEND_MODE_BY_NAME.darkerColor(opaqueWhite, opaqueBlack)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('handles the sa === 255 branch correctly', () => {
      const src = 0xFF123456 as Color32
      const dst = 0xFF654321 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.darkerColor(src, dst)
      expect(unpack(result)).toEqual({
        r: 86,
        g: 52,
        b: 18,
        a: 255,
      })
    })

    it('handles the lerp branch (sa < 255) when source is darker', () => {
      const src = 0x80000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.darkerColor(src, opaqueWhite)
      expect(unpack(result)).toEqual({
        r: 127,
        g: 127,
        b: 127,
        a: 255,
      })
    })

    it('handles the lerp branch (sa < 255) when destination is darker', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.darkerColor(src, dst)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })
  })

  describe('lightenColor32', () => {
    it('should return destination when source is fully transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.lighten(src, dst)
      expect(unpack(result)).toEqual({
        r: 51,
        g: 34,
        b: 17,
        a: 255,
      })
    })

    it('should pick max components when source is fully opaque (ABGR)', () => {
      const src = 0xFF22FF10 as Color32
      const dst = 0xFF888850 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.lighten(src, dst)
      expect(unpack(result)).toEqual({
        r: 80,
        g: 255,
        b: 136,
        a: 255,
      })
    })

    it('should correctly interpolate at 50% alpha (ABGR)', () => {
      const src = 0x80FF0000 as Color32
      const dst = 0xFF00FF00 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.lighten(src, dst)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 255,
        b: 128,
        a: 255,
      })
    })

    it('should handle black and white correctly at partial alpha (ABGR)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.lighten(src, dst)
      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })

    describe('lightenColor32 - Interpolation Block', () => {
      it('should blend max components with destination when alpha is 25%', () => {
        const src = 0x40FF00FF as Color32
        const dst = 0xFF00FF00 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.lighten(src, dst)
        expect(unpack(result)).toEqual({
          r: 64,
          g: 255,
          b: 64,
          a: 255,
        })
      })

      it('should handle partial alpha destination correctly', () => {
        const src = 0x800000FF as Color32
        const dst = 0x8000FF00 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.lighten(src, dst)
        expect(unpack(result)).toEqual({
          r: 128,
          g: 255,
          b: 0,
          a: 191,
        })
      })
    })

    it('should handle black and white correctly at partial alpha', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.lighten(src, dst)
      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })
  })

  describe('screenColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.screen(src, dst)
      expect(unpack(result)).toEqual({
        r: 51,
        g: 34,
        b: 17,
        a: 255,
      })
    })

    it('should result in white if either source or destination is white (opaque)', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFFBB0000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.screen(src, dst)
      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })

    it('should calculate screen correctly for opaque mid-tones', () => {
      const src = 0xFF800080 as Color32
      const dst = 0xFF008080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.screen(src, dst)
      expect(unpack(result)).toEqual({
        r: 192,
        g: 128,
        b: 128,
        a: 255,
      })
    })

    it('should interpolate screen result with alpha at 50%', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.screen(src, dst)
      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })
  })

  describe('colorDodgeColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.colorDodge(src, dst)
      expect(unpack(result)).toEqual({
        r: 51,
        g: 34,
        b: 17,
        a: 255,
      })
    })

    it('should return white if source is white (opaque)', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF323232 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.colorDodge(src, dst)
      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })

    it('handles lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.colorDodge(src, dst)
      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })

    it('returns 255 when source components are exactly 255 (division by zero guard)', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF010101 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.colorDodge(src, dst)

      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })

    it('clamps to 255 when result exceeds 8-bit range', () => {
      // dr = 200, sr = 200
      // 200 * 255 / (255 - 200) = 51000 / 55 = 927.27... -> 255
      const src = 0xFFC8C8C8 as Color32
      const dst = 0xFFC8C8C8 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.colorDodge(src, dst)

      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })

    it('handles individual channel saturation (Red and Blue only)', () => {
      const src = 0xFFFF00FF as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.colorDodge(src, dst)

      // Red: src 255 -> 255
      // Green: 128 * 255 / 255 -> 128
      // Blue: src 255 -> 255
      expect(unpack(result)).toEqual({
        r: 255,
        g: 128,
        b: 255,
        a: 255,
      })
    })
  })

  describe('linearDodgeColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.linearDodge(src, dst)
      expect(unpack(result)).toEqual({
        r: 51,
        g: 34,
        b: 17,
        a: 255,
      })
    })

    it('should sum components and cap at 255 (opaque)', () => {
      const src = 0xFF1E64C8 as Color32
      const dst = 0xFF143264 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.linearDodge(src, dst)
      expect(unpack(result)).toEqual({
        r: 255,
        g: 150,
        b: 50,
        a: 255,
      })
    })

    it('handles lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.linearDodge(src, dst)
      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })

    it('clumps green component to 255 when sum exceeds 255', () => {
      const src = 0xFF00FF00 as Color32
      const dst = 0xFF008000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.linearDodge(src, dst)

      // Green: 255 + 128 = 383 -> 255
      expect(unpack(result)).toEqual({
        r: 0,
        g: 255,
        b: 0,
        a: 255,
      })
    })

    it('clumps blue component to 255 when sum exceeds 255', () => {
      const src = 0xFFFF00FF as Color32
      const dst = 0xFF000080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.linearDodge(src, dst)

      // Blue: 255 + 128 = 383 -> 255
      expect(unpack(result)).toEqual({
        r: 255,
        g: 0,
        b: 255,
        a: 255,
      })
    })

    it('handles simultaneous overflow on all channels', () => {
      const src = 0xFFEEEEEE as Color32
      const dst = 0xFF666666 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.linearDodge(src, dst)

      // 238 + 102 = 340 -> 255
      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })
  })

  describe('lighterColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.lighterColor(src, dst)
      expect(unpack(result)).toEqual({
        r: 51,
        g: 34,
        b: 17,
        a: 255,
      })
    })

    it('should pick source if it has higher luminosity (opaque)', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.lighterColor(src, dst)
      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })

    it('should pick dest if it has higher luminosity (opaque)', () => {
      const src = 0xFF000000 as Color32
      const dst = 0xFFFFFFFF as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.lighterColor(src, dst)
      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })
    it('handles the alpha lerp branch (0 < sa < 255) when source is lighter', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.lighterColor(src, dst)

      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })

    it('handles the alpha lerp branch (0 < sa < 255) when destination is lighter', () => {
      const src = 0x80000000 as Color32
      const dst = 0xFFFFFFFF as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.lighterColor(src, dst)

      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })
  })

  describe('overlayColor32', () => {
    it('should apply multiply logic when dst < 128', () => {
      const src = 0xFF404040 as Color32
      const dst = 0xFF202020 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.overlay(src, dst)
      expect(unpack(result)).toEqual({
        r: 16,
        g: 16,
        b: 16,
        a: 255,
      })
    })

    it('should apply screen logic when dst >= 128', () => {
      const src = 0xFFE0E0E0 as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.overlay(src, dst)
      expect(unpack(result)).toEqual({
        r: 225,
        g: 225,
        b: 225,
        a: 255,
      })
    })

    it('handles lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.overlay(src, dst)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })
  })

  describe('softLightColor32', () => {
    it('returns destination when source is fully transparent (sa === 0)', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.softLight(src, dst)
      expect(unpack(result)).toEqual({
        r: 51,
        g: 34,
        b: 17,
        a: 255,
      })
    })

    describe('opaque source (sa === 255)', () => {
      it('applies darkening logic when source components are low (< 128)', () => {
        const src = 0xFF404040 as Color32
        const dst = 0xFF808080 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.softLight(src, dst)
        const unpacked = unpack(result)

        // Soft light with a dark source should result in a color darker than the destination
        expect(unpacked.r).toBeLessThan(128)
        expect(unpacked.a).toBe(255)
      })

      it('applies lightening logic when source components are high (>= 128)', () => {
        const src = 0xFFC0C0C0 as Color32
        const dst = 0xFF808080 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.softLight(src, dst)
        const unpacked = unpack(result)

        // Soft light with a light source should result in a color lighter than the destination
        expect(unpacked.r).toBeGreaterThan(128)
        expect(unpacked.a).toBe(255)
      })
    })

    it('covers the alpha lerp part (0 < sa < 255)', () => {
      const src = 0x80C0C0C0 as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.softLight(src, dst)

      expect(unpack(result)).toEqual({
        r: 144,
        g: 144,
        b: 144,
        a: 255,
      })
    })

    it('handles the boundary case where source is exactly mid-gray', () => {
      const src = 0xFF808080 as Color32
      const dst = 0xFF445566 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.softLight(src, dst)

      // Mid-gray source in soft light typically acts as a neutral "pass-through"
      // or very close to the original destination
      expect(unpack(result).r).toBeCloseTo(0x66, -1)
    })
  })

  describe('hardLightColor32', () => {
    it('returns destination when source is fully transparent (sa === 0)', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.hardLight(src, dst)

      expect(unpack(result)).toEqual({
        r: 51,
        g: 34,
        b: 17,
        a: 255,
      })
    })

    describe('opaque source (sa === 255)', () => {
      it('applies multiply-like logic when source components are low (< 128)', () => {
        const src = 0xFF404040 as Color32
        const dst = 0xFFC8C8C8 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.hardLight(src, dst)

        expect(unpack(result)).toEqual({
          r: 100,
          g: 100,
          b: 100,
          a: 255,
        })
      })

      it('applies screen-like logic when source components are high (>= 128)', () => {
        const src = 0xFFC0C0C0 as Color32
        const dst = 0xFF646464 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.hardLight(src, dst)

        expect(unpack(result)).toEqual({
          r: 179,
          g: 179,
          b: 179,
          a: 255,
        })
      })
    })

    it('covers the alpha lerp part (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.hardLight(src, dst)

      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })

    it('handles the boundary case where source is exactly mid-gray', () => {
      const src = 0xFF808080 as Color32
      const dst = 0xFF445566 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.hardLight(src, dst)

      // In hard light, a mid-gray source (128) typically results in
      // a very slight lightening or darkening of the destination
      expect(unpack(result)).toEqual({
        r: 103,
        g: 86,
        b: 69,
        a: 255,
      })
    })
  })

  describe('vividLightColor32', () => {
    it('explicitly triggers the sr === 0, sg === 0, and sb === 0 branches', () => {
      // Setting source to total black (0x000000) with full alpha
      const src = 0xFF000000 as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)
      const unpacked = unpack(result)

      expect(unpacked).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('explicitly triggers the sr === 255, sg === 255, and sb === 255 branches', () => {
      // Setting source to total white (0xFFFFFF) with full alpha
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)
      const unpacked = unpack(result)

      expect(unpacked).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })

    it('returns destination when source is fully transparent (sa === 0)', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)

      expect(unpack(result)).toEqual({
        r: 51,
        g: 34,
        b: 17,
        a: 255,
      })
    })

    describe('opaque source (sa === 255)', () => {
      it('applies burn-like logic when source components are low (< 128)', () => {
        const src = 0xFF404040 as Color32
        const dst = 0xFF808080 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)

        expect(unpack(result)).toEqual({
          r: 2,
          g: 2,
          b: 2,
          a: 255,
        })
      })

      it('applies dodge-like logic when source components are high (>= 128)', () => {
        const src = 0xFFC0C0C0 as Color32
        const dst = 0xFF808080 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)

        expect(unpack(result)).toEqual({
          r: 255,
          g: 255,
          b: 255,
          a: 255,
        })
      })

      it('handles the Color Burn branch (S < 128) including zero-guard and floor clamping', () => {
        // Red: sr=0 (zero-guard), Green: sr=1 (very low, should clamp to 0), Blue: sr=64 (normal burn)
        const src = 0xFF400100 as Color32
        const dst = 0xFF808080 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)

        const unpacked = unpack(result)
        expect(unpacked.r).toBe(0) // sr === 0 branch
        expect(unpacked.g).toBe(0) // Math.max(0, ...) floor clamp
      })

      it('covers lower-bound branches (S < 128) across all channels', () => {
        // Red: sr = 0 (Zero-guard branch)
        // Green: sg = 1 (Floor clamp branch via Math.max)
        // Blue: sb = 64 (Standard Burn logic branch)
        const src = 0xFF200100 as Color32
        const dst = 0xFF808080 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)
        const unpacked = unpack(result)

        expect(unpacked).toEqual({
          r: 0,
          g: 0,
          b: 0,
          a: 255,
        })
      })

      it('covers upper-bound branches (S >= 128) across all channels', () => {
        // Red: sr = 255 (255-guard branch)
        // Green: sg = 254 (Ceiling clamp branch via Math.min)
        // Blue: sb = 128 (Standard Dodge logic branch)
        const src = 0xFF80FEFF as Color32
        const dst = 0xFF808080 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)
        const unpacked = unpack(result)

        expect(unpacked).toEqual({
          r: 255,
          g: 255,
          b: 128,
          a: 255,
        })
      })

      it('covers mixed branches (Burn and Dodge) simultaneously', () => {
        // Red: sr = 0 (Burn Zero-guard)
        // Green: sg = 128 (Dodge Midpoint)
        // Blue: sb = 255 (Dodge 255-guard)
        const src = 0xFFFF8000 as Color32
        const dst = 0xFF404040 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)
        const unpacked = unpack(result)

        expect(unpacked).toEqual({
          r: 0,
          g: 64,
          b: 255,
          a: 255,
        })
      })

      it('handles the Color Dodge branch (S >= 128) including 255-guard and ceiling clamping', () => {
        // Red: sr=255 (255-guard), Green: sr=254 (very high, should clamp to 255), Blue: sr=128 (mid)
        const src = 0xFF80FEFF as Color32
        const dst = 0xFF808080 as Color32
        const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)

        const unpacked = unpack(result)
        expect(unpacked.r).toBe(255) // sr === 255 branch
        expect(unpacked.g).toBe(255) // Math.min(255, ...) ceiling clamp
      })

      it('covers the transition from Burn to Dodge logic', () => {
        // Transitioning from 127 (Burn) to 128 (Dodge)
        const srcLow = 0xFF7F7F7F as Color32
        const srcHigh = 0xFF808080 as Color32
        const dst = 0xFF404040 as Color32

        const resLow = PERFECT_BLEND_MODE_BY_NAME.vividLight(srcLow, dst)
        const resHigh = PERFECT_BLEND_MODE_BY_NAME.vividLight(srcHigh, dst)

        expect(unpack(resLow).r).toBeLessThanOrEqual(64)
        expect(unpack(resHigh).r).toBeGreaterThanOrEqual(64)
      })
    })

    it('covers the alpha lerp part (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)

      expect(unpack(result)).toEqual({
        r: 191,
        g: 191,
        b: 191,
        a: 255,
      })
    })

    it('handles the edge case where source is exactly mid-gray', () => {
      const src = 0xFF808080 as Color32
      const dst = 0xFF445566 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.vividLight(src, dst)

      // Mid-gray (128) source triggers the dodge branch with s_new = 0
      // Color dodge with s=0 is a pass-through of the destination
      expect(unpack(result)).toEqual({
        r: 102,
        g: 85,
        b: 68,
        a: 255,
      })
    })
  })
  describe('linearLightColor32', () => {
    it('returns destination when source is fully transparent (sa === 0)', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.linearLight(src, dst)

      expect(unpack(result)).toEqual({
        r: 51,
        g: 34,
        b: 17,
        a: 255,
      })
    })

    it('applies linear burn logic for low source components (sa === 255, s < 128)', () => {
      const src = 0xFF404040 as Color32
      const dst = 0xFF646464 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.linearLight(src, dst)

      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('applies linear dodge logic for high source components (sa === 255, s >= 128)', () => {
      const src = 0xFFC0C0C0 as Color32
      const dst = 0xFF646464 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.linearLight(src, dst)

      expect(unpack(result)).toEqual({
        r: 229,
        g: 229,
        b: 229,
        a: 255,
      })
    })

    it('handles the alpha lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.linearLight(src, dst)

      expect(unpack(result)).toEqual({
        r: 191,
        g: 191,
        b: 191,
        a: 255,
      })
    })
  })

  describe('pinLightColor32', () => {
    it('covers the true cases for S >= 128 (dr > 2(sr-128))', () => {
      // Condition: dr > ((sr - 128) << 1)
      // Red/Green/Blue: sr = 192, so (192 - 128) * 2 = 128
      // We need dr > 128. Let's use dr = 200.
      const src = 0xFFC0C0C0 as Color32
      const dst = 0xFFC8C8C8 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.pinLight(src, dst)
      const unpacked = unpack(result)

      expect(unpacked).toEqual({
        r: 200,
        g: 200,
        b: 200,
        a: 255,
      })
    })

    it('covers the true cases for S < 128 (dr < 2sr)', () => {
      // We need dr < (sr << 1)
      // Red: sr = 64 (2sr = 128), dr = 50 (50 < 128 is true) -> Result 50
      // Green: sg = 64 (2sg = 128), dg = 10 (10 < 128 is true) -> Result 10
      // Blue: sb = 64 (2sb = 128), db = 100 (100 < 128 is true) -> Result 100
      const src = 0xFF404040 as Color32
      const dst = 0xFF640A32 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.pinLight(src, dst)
      const unpacked = unpack(result)

      expect(unpacked).toEqual({
        r: 50,
        g: 10,
        b: 100,
        a: 255,
      })
    })

    it('covers the false cases for S < 128 (dr >= 2sr) for completeness', () => {
      // We need dr >= (sr << 1)
      // Red: sr = 32 (2sr = 64), dr = 100 (100 < 64 is false) -> Result 64
      // Green: sg = 32 (2sg = 64), dg = 100 (100 < 64 is false) -> Result 64
      // Blue: sb = 32 (2sb = 64), db = 100 (100 < 64 is false) -> Result 64
      const src = 0xFF202020 as Color32
      const dst = 0xFF646464 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.pinLight(src, dst)
      const unpacked = unpack(result)

      expect(unpacked).toEqual({
        r: 64,
        g: 64,
        b: 64,
        a: 255,
      })
    })

    it('selects values correctly based on source mid-point (sa === 255)', () => {
      const src = 0xFFC04040 as Color32
      const dst = 0xFF32C8C8 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.pinLight(src, dst)

      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })

    it('handles the alpha lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.pinLight(src, dst)

      expect(unpack(result)).toEqual({
        r: 191,
        g: 191,
        b: 191,
        a: 255,
      })
    })
  })

  describe('hardMixColor32', () => {
    it('thresholds components to 0 or 255 (sa === 255)', () => {
      const src = 0xFFC04040 as Color32
      const dst = 0xFF646464 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.hardMix(src, dst)

      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 255,
        a: 255,
      })
    })

    it('handles the alpha lerp branch (0 < sa < 255)', () => {
      const src = 0x80808080 as Color32
      const dst = 0xFF646464 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.hardMix(src, dst)
      // expected drift of -1 (alpha)
      expect(unpack(result)).toEqual({
        r: 49,
        g: 49,
        b: 49,
        a: 255,
      })
    })

    it('covers the zero-snap branches (sr + dr < 255) for all colors', () => {
      // Red: 100 + 100 = 200 (< 255) -> 0
      // Green: 0 + 254 = 254 (< 255) -> 0
      // Blue: 127 + 127 = 254 (< 255) -> 0
      const src = 0xFF7F0064 as Color32
      const dst = 0xFF7FFE64 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.hardMix(src, dst)
      const unpacked = unpack(result)

      expect(unpacked).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('covers the 255-snap branches (sr + dr >= 255) for all colors', () => {
      // Red: 200 + 100 = 300 (>= 255) -> 255
      // Green: 200 + 100 = 300 (>= 255) -> 255
      // Blue: 200 + 100 = 300 (>= 255) -> 255
      const src = 0xFFC8C8C8 as Color32
      const dst = 0xFF646464 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.hardMix(src, dst)
      const unpacked = unpack(result)

      expect(unpacked).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })

    it('handles the absolute edge cases (0 and 255) to hit guard branches', () => {
      // This explicitly hits the ? 0 and ? 255 logic
      const srcMin = 0xFF000000 as Color32
      const dstMin = 0xFF000000 as Color32
      const resMin = PERFECT_BLEND_MODE_BY_NAME.hardMix(srcMin, dstMin)

      const srcMax = 0xFFFFFFFF as Color32
      const dstMax = 0xFFFFFFFF as Color32
      const resMax = PERFECT_BLEND_MODE_BY_NAME.hardMix(srcMax, dstMax)

      expect(unpack(resMin).r).toBe(0)
      expect(unpack(resMax).r).toBe(255)
    })
  })

  describe('differenceColor32', () => {
    it('covers the positive result branches (dr - sr > 0) for all channels', () => {
      // Red: 200 - 100 = 100 -> 100
      // Green: 200 - 100 = 100 -> 100
      // Blue: 200 - 100 = 100 -> 100
      const src = 0xFF646464 as Color32
      const dst = 0xFFC8C8C8 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.difference(src, dst)
      const unpacked = unpack(result)

      expect(unpacked).toEqual({
        r: 100,
        g: 100,
        b: 100,
        a: 255,
      })
    })

    it('calculates absolute difference (sa === 255)', () => {
      const src = 0xFFC8C8C8 as Color32
      const dst = 0xFF323232 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.difference(src, dst)

      expect(unpack(result)).toEqual({
        r: 150,
        g: 150,
        b: 150,
        a: 255,
      })
    })

    it('handles the alpha lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.difference(src, dst)

      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })
  })

  describe('exclusionColor32', () => {
    it('returns destination when source is fully transparent (sa === 0)', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.exclusion(src, dst)

      expect(unpack(result)).toEqual({
        r: 51,
        g: 34,
        b: 17,
        a: 255,
      })
    })

    it('applies exclusion logic for opaque source (sa === 255)', () => {
      const src = 0xFF808080 as Color32
      const dst = 0xFF404040 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.exclusion(src, dst)

      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })

    it('handles the alpha lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.exclusion(src, dst)

      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })

    it('produces expected results for high intensity components', () => {
      const src = 0xFFC0C0C0 as Color32
      const dst = 0xFFC0C0C0 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.exclusion(src, dst)

      expect(unpack(result)).toEqual({
        r: 96,
        g: 96,
        b: 96,
        a: 255,
      })
    })
  })

  describe('subtractColor32', () => {
    it('covers the zero-clamp and positive branches for all channels', () => {
      // Red: 50 - 100 = -50 -> 0 (Hits the 0 branch)
      // Green: 100 - 50 = 50 -> 50 (Hits the bbU / positive branch)
      // Blue: 10 - 200 = -190 -> 0 (Hits the 0 branch)
      const src1 = 0xFFC83264 as Color32
      const dst1 = 0xFF0A6432 as Color32
      const result1 = PERFECT_BLEND_MODE_BY_NAME.subtract(src1, dst1)
      const unpacked1 = unpack(result1)

      expect(unpacked1).toEqual({
        r: 0,
        g: 50,
        b: 0,
        a: 255,
      })

      // Now force Blue to be positive to cover the other side of the ternary
      // Blue: 200 - 50 = 150 -> 150
      const src2 = 0xFF323232 as Color32
      const dst2 = 0xFFC8C8C8 as Color32
      const result2 = PERFECT_BLEND_MODE_BY_NAME.subtract(src2, dst2)
      const unpacked2 = unpack(result2)

      expect(unpacked2.b).toBe(150)
    })

    it('should return black when source is white and opaque', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF445566 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.subtract(src, dst)
      expect(unpack(result)).toEqual({
        r: 0,
        g: 0,
        b: 0,
        a: 255,
      })
    })

    it('should handle partial subtraction and floor at zero', () => {
      const src = 0xFF808080 as Color32
      const dst = 0xFF40A0F0 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.subtract(src, dst)
      expect(unpack(result)).toEqual({
        r: 112,
        g: 32,
        b: 0,
        a: 255,
      })
    })

    it('handles the alpha lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.subtract(src, dst)

      expect(unpack(result)).toEqual({
        r: 63,
        g: 63,
        b: 63,
        a: 255,
      })
    })
  })

  describe('divideColor32', () => {
    it('should return white when source is zero (division by zero case)', () => {
      const src = 0xFF000000 as Color32
      const dst = 0xFF445566 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.divide(src, dst)
      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })

    it('should return white when source equals destination', () => {
      const src = 0xFF4080C0 as Color32
      const dst = 0xFF4080C0 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.divide(src, dst)
      expect(unpack(result)).toEqual({
        r: 255,
        g: 255,
        b: 255,
        a: 255,
      })
    })

    it('handles the alpha lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF808080 as Color32
      const result = PERFECT_BLEND_MODE_BY_NAME.divide(src, dst)

      expect(unpack(result)).toEqual({
        r: 128,
        g: 128,
        b: 128,
        a: 255,
      })
    })
  })

  describe('Registry and Exports', () => {
    it('COLOR_32_BLEND_MODES is populated', () => {
      expect(PERFECT_BLEND_MODES.length).toBeGreaterThan(0)
    })

    it('maps functions to indices and back', () => {
      const mode = PERFECT_BLEND_MODE_BY_NAME.overwrite
      const index = PERFECT_BLEND_TO_INDEX.get(mode)
      expect(INDEX_TO_PERFECT_BLEND.get(index)).toBe(mode)
    })
  })
})
