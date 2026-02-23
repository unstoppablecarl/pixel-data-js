import { describe, expect, it } from 'vitest'
import { type Color32 } from '../src'
import * as Blenders from '../src/blend-modes'

describe('Color Blending Functions', () => {
  // Test constants
  const opaqueWhite = 0xFFFFFFFF as Color32
  const opaqueBlack = 0xFF000000 as Color32
  const opaqueRed = 0xFF0000FF as Color32
  const opaqueBlue = 0xFFFF0000 as Color32
  const transparent = 0x00000000 as Color32
  const midGray = 0xFF808080 as Color32
  const halfAlphaRed = 0x800000FF as Color32
  const opaqueGreen = 0xFF00FF00 as Color32

  describe('Common Alpha Branching Logic', () => {
    const modes = [
      'sourceOverColor32',
      'darkenColor32',
      'multiplyColor32',
      'colorBurnColor32',
      'linearBurnColor32',
      'darkerColor32',
      'lightenColor32',
      'screenColor32',
      'colorDodgeColor32',
      'linearDodgeColor32',
      'lighterColor32',
      'overlayColor32',
      'softLightColor32',
      'hardLightColor32',
      'vividLightColor32',
      'linearLightColor32',
      'pinLightColor32',
      'hardMixColor32',
      'differenceColor32',
      'exclusionColor32',
      'subtractColor32',
      'divideColor32',
    ] as const

    for (const mode of modes) {
      it(`${mode} should return dst if src alpha is 0`, () => {
        const result = Blenders[mode](transparent, opaqueRed)
        expect(result).toBe(opaqueRed)
      })
    }
  })

  describe('sourceOverColor32', () => {
    it('returns src if src alpha is 255', () => {
      const result = Blenders.sourceOverColor32(opaqueRed, opaqueBlue)
      expect(result).toBe(opaqueRed)
    })

    it('blends values correctly at 50% alpha', () => {
      // dst is black, src is white at ~50% alpha (128/255)
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = Blenders.sourceOverColor32(src, dst)

      const r = result & 0xFF
      // (255 * 128 + 0 * 127) >> 8 approx 127
      expect(r).toBeGreaterThan(120)
      expect(r).toBeLessThan(135)
    })
  })

  describe('darkenColor32', () => {
    it('selects source when lumSrc < lumDst (opaque)', () => {
      const result = Blenders.darkenColor32(opaqueRed, opaqueWhite)

      // Red is darker, so it should be picked
      expect(result).toBe(opaqueRed)
    })

    it('selects destination when lumDst < lumSrc (opaque)', () => {

      const result = Blenders.darkenColor32(opaqueWhite, opaqueBlack)

      // Black is darker, so it should be picked
      expect(result).toBe(opaqueBlack)
    })

    it('handles the sa === 255 optimization branch', () => {
      const src = 0xFF112233 as Color32
      const dst = 0xFF445566 as Color32
      const result = Blenders.darkenColor32(src, dst)

      // Ensure it's opaque
      expect((result >>> 24) & 0xFF).toBe(255)
    })

    it('handles the lerp branch (sa < 255)', () => {
      // Transparent source over opaque destination
      const src = 0x800000FF as Color32
      const result = Blenders.darkenColor32(src, opaqueWhite)

      const a = (result >>> 24) & 0xFF
      // Result should be a mix of the two based on alpha
      expect(a).toBeGreaterThan(0)
      expect(a).toBeLessThan(255)
    })

    it('handles lerp branch (0 < sa < 255)', () => {
      const result = Blenders.darkenColor32(halfAlphaRed, opaqueBlue)
      const alpha = (result >>> 24) & 0xFF

      expect(alpha).toBeGreaterThan(0)
      expect(alpha).toBeLessThan(255)
    })

    it('darken picks the minimum components', () => {
      const src = 0xFF00FFFF as Color32
      const dst = 0xFFFFFF00 as Color32
      const result = Blenders.darkenColor32(src, dst)
      // min(0, 255), min(255, 255), min(255, 0) -> 0, 255, 0 (Green)
      expect(result).toBe(0xFF00FF00)
    })
  })

  describe('multiplyColor32', () => {
    it('multiplies colors correctly', () => {
      const src = 0xFF808080 as Color32
      const dst = 0xFFFFFFFF as Color32
      const result = Blenders.multiplyColor32(src, dst)
      const r = result & 0xFF
      expect(r).toBeCloseTo(128, -1)
    })
    it('handles sa === 255 branch', () => {
      // 50% gray * White = 50% gray
      const result = Blenders.multiplyColor32(midGray, opaqueWhite)
      const r = result & 0xFF

      expect(r).toBeCloseTo(128, -1)
      expect((result >>> 24) & 0xFF).toBe(255)
    })

    it('handles lerp branch (0 < sa < 255)', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = Blenders.multiplyColor32(src, dst)

      expect(result).toBeDefined()
    })
  })

  describe('colorBurnColor32', () => {
    it('handles sa === 255 branch', () => {
      const result = Blenders.colorBurnColor32(midGray, midGray)

      expect((result >>> 24) & 0xFF).toBe(255)
    })

    it('handles the dr === 255 edge case', () => {
      // if dst is white, result is white
      const result = Blenders.colorBurnColor32(opaqueRed, opaqueWhite)

      expect(result).toBe(opaqueWhite)
    })

    it('handles the sr === 0 division guard', () => {
      const result = Blenders.colorBurnColor32(opaqueBlack, midGray)

      expect(result).toBeDefined()
    })

    it('hits the sr === 0 branch via the || 1 fallback', () => {
      const dst = 0xFF7F7F7F as Color32
      const result = Blenders.colorBurnColor32(opaqueBlack, dst)

      // Math: 255 - ((255 - 127) << 8) / 1 = negative, clamped to 0
      expect(result).toBe(0xFF000000)
    })

    it('handles the opaque branch (sa === 255)', () => {
      const result = Blenders.colorBurnColor32(midGray, midGray)

      expect((result >>> 24) & 0xFF).toBe(255)
    })

    it('handles the lerp branch (sa < 255)', () => {
      const src = 0x80808080 as Color32
      const result = Blenders.colorBurnColor32(src, opaqueWhite)

      const a = (result >>> 24) & 0xFF
      // Result alpha should be the blended result of 128 and 255
      expect(a).toBeGreaterThan(0)
      expect(a).toBeLessThan(255)
    })

    it('verifies the Math.max(0, ...) clamping', () => {
      // A very dark destination and a very dark source
      // should result in 0, not a negative number
      const src = 0xFF010101 as Color32
      const dst = 0xFF010101 as Color32
      const result = Blenders.colorBurnColor32(src, dst)

      expect(result & 0xFFFFFF).toBe(0)
    })
  })

  describe('linearBurnColor32', () => {
    it('handles sa === 255 branch', () => {
      // 128 + 128 - 255 = 1 (clamped)
      const result = Blenders.linearBurnColor32(midGray, midGray)
      const r = result & 0xFF

      expect(r).toBeLessThan(5)
    })

    it('handles clamping to 0', () => {
      // Black + Black - 255 is negative, should be 0
      const result = Blenders.linearBurnColor32(opaqueBlack, opaqueBlack)

      expect(result & 0xFFFFFF).toBe(0)
    })

    it('handles lerp branch', () => {
      const result = Blenders.linearBurnColor32(halfAlphaRed, midGray)

      expect(result).toBeDefined()
    })
  })

  describe('darkerColor32 coverage', () => {
    it('selects source color when lumSrc < lumDst (opaque)', () => {
      const result = Blenders.darkerColor32(opaqueBlue, opaqueRed)

      // Blue is perceptually darker than Red
      expect(result).toBe(opaqueBlue)
    })

    it('selects destination color when lumDst < lumSrc (opaque)', () => {
      const result = Blenders.darkerColor32(opaqueWhite, opaqueBlack)

      expect(result).toBe(opaqueBlack)
    })

    it('handles the sa === 255 branch correctly', () => {
      const src = 0xFF123456 as Color32
      const dst = 0xFF654321 as Color32
      const result = Blenders.darkerColor32(src, dst)

      // Verify it uses the opaque return path
      expect((result >>> 24) & 0xFF).toBe(255)
    })

    it('handles the lerp branch (sa < 255) when source is darker', () => {
      // Source: Black at 50% alpha
      const src = 0x80000000 as Color32
      const result = Blenders.darkerColor32(src, opaqueWhite)

      const r = result & 0xFF
      const a = (result >>> 24) & 0xFF

      // Result should be roughly 50% gray (127) because source (black) was chosen
      expect(r).toBeLessThan(150)
      expect(r).toBeGreaterThan(100)
      expect(a).toBe(254) // Combined alpha results in opaque
    })

    it('handles the lerp branch (sa < 255) when destination is darker', () => {
      // Source: White at 50% alpha
      const src = 0x80FFFFFF as Color32
      // Destination: Black at 100% alpha
      const dst = 0xFF000000 as Color32
      const result = Blenders.darkerColor32(src, dst)

      const r = result & 0xFF
      // Result should be black/dark because dst was chosen over the bright src
      expect(r).toBeLessThan(50)
    })
  })

  describe('lightenColor32', () => {
    it('should return destination when source is fully transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = Blenders.lightenColor32(src, dst)
      expect(result).toBe(dst)
    })

    describe('lightenColor32', () => {
      it('should pick max components when source is fully opaque (ABGR)', () => {
        // Layout: 0xAA_BB_GG_RR
        // src: A:FF, B:22, G:FF, R:10
        // dst: A:FF, B:88, G:88, R:50
        const src = 0xFF22FF10 as Color32
        const dst = 0xFF888850 as Color32
        const result = Blenders.lightenColor32(src, dst)

        expect(result).toBe(0xFF88FF50 >>> 0)
      })

      it('should correctly interpolate at 50% alpha (ABGR)', () => {
        const sa = 128
        // src: A:80, B:FF, G:00, R:00 (Pure Blue)
        const src = 0x80FF0000 as Color32
        // dst: A:FF, B:00, G:FF, R:00 (Pure Green)
        const dst = 0xFF00FF00 as Color32

        const result = Blenders.lightenColor32(src, dst)

        expect(result).toBe(0xFE7FFE00 >>> 0)
      })

      it('should handle black and white correctly at partial alpha (ABGR)', () => {
        const sa = 128
        const src = 0x80FFFFFF as Color32 // White 50%
        const dst = 0xFF000000 as Color32 // Black 100%

        const result = Blenders.lightenColor32(src, dst)

        expect(result).toBe(0xFE7F7F7F >>> 0)
      })

      describe('lightenColor32 - Interpolation Block', () => {
        it('should blend max components with destination when alpha is 25%', () => {
          // sa = 64 (approx 25%), invA = 191
          const sa = 64
          const invA = 191

          // src: A:40(64), B:FF, G:00, R:FF
          const src = 0x40FF00FF as Color32
          // dst: A:FF, B:00, G:FF, R:00
          const dst = 0xFF00FF00 as Color32

          const result = Blenders.lightenColor32(src, dst)

          // 1. dr=00, dg=FF, db=00
          // 2. br = max(FF, 00) = 255
          //    bg = max(00, FF) = 255
          //    bb = max(FF, 00) = 255

          // 3. Math check:
          // r: (255 * 64 + 0 * 191) >> 8 = 16320 >> 8 = 63
          // g: (255 * 64 + 255 * 191) >> 8 = 65025 >> 8 = 254
          // b: (255 * 64 + 0 * 191) >> 8 = 16320 >> 8 = 63
          // a: (255 * 64 + 255 * 191) >> 8 = 254

          // Expected (ABGR): 0xFE3FFE3F
          expect(result).toBe(0xFE3FFE3F >>> 0)
        })

        it('should show lighten effect only on specific channels', () => {
          const sa = 128
          const invA = 127

          // src is mid-blue, 50% alpha: A:80, B:80, G:00, R:00
          const src = 0x80800000 as Color32
          // dst is bright blue, 100% alpha: A:FF, B:FF, G:00, R:00
          const dst = 0xFFFF0000 as Color32

          const result = Blenders.lightenColor32(src, dst)

          // dr=0, dg=0, db=255
          // br = max(0, 0) = 0
          // bg = max(0, 0) = 0
          // bb = max(128, 255) = 255 (Destination was already lighter)

          // Math:
          // r, g: 0
          // b: (255 * 128 + 255 * 127) >> 8 = 254
          // a: (255 * 128 + 255 * 127) >> 8 = 254

          expect(result).toBe(0xFEFE0000 >>> 0)
        })

        it('should handle partial alpha destination correctly', () => {
          const sa = 128
          const invA = 127

          // src: 50% alpha, red
          const src = 0x800000FF as Color32
          // dst: 50% alpha, green
          const dst = 0x8000FF00 as Color32

          const result = Blenders.lightenColor32(src, dst)

          // dr=0, dg=255, db=0, da=128
          // br=255, bg=255, bb=0

          // r: (255 * 128 + 0 * 127) >> 8 = 127
          // g: (255 * 128 + 255 * 127) >> 8 = 254
          // b: (0 * 128 + 0 * 127) >> 8 = 0
          // a: (255 * 128 + 128 * 127) >> 8 = (32640 + 16256) >> 8 = 48896 >> 8 = 191

          expect(result).toBe(0xBF00FE7F >>> 0)
        })
      })
    })
    it('should handle black and white correctly at partial alpha', () => {
      const sa = 128
      const src = (sa << 24 | 0xFFFFFF) as Color32 // White
      const dst = 0xFF000000 as Color32 // Black

      const result = Blenders.lightenColor32(src, dst)

      expect(result).toBe(0xFE7F7F7F >>> 0)
    })

    it('should reach opaque 255 if both alphas are 255 (opaque shortcut)', () => {
      const src = 0xFF000000 as Color32
      const dst = 0xFFFFFFFF as Color32
      const result = Blenders.lightenColor32(src, dst)
      expect(result >>> 24).toBe(255)
    })
  })

  describe('screenColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = Blenders.screenColor32(src, dst)
      expect(result).toBe(dst)
    })

    it('should result in white if either source or destination is white (opaque)', () => {
      // src is white, dst is blue
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFFBB0000 as Color32
      const result = Blenders.screenColor32(src, dst)

      // 255 - ((255-255)*(255-0) >> 8) = 255
      expect(result).toBe(0xFFFFFFFF >>> 0)
    })

    it('should calculate screen correctly for opaque mid-tones', () => {
      // src: A:FF, B:80(128), G:00, R:80(128)
      const src = 0xFF800080 as Color32
      // dst: A:FF, B:00, G:80(128), R:80(128)
      const dst = 0xFF008080 as Color32

      const result = Blenders.screenColor32(src, dst)
      expect(result).toBe(0xFF8181C0 >>> 0)
    })

    it('should interpolate screen result with alpha at 50%', () => {
      const sa = 128
      const invA = 127
      // src: 50% alpha, white (A:80, B:FF, G:FF, R:FF)
      const src = 0x80FFFFFF as Color32
      // dst: 100% alpha, black (A:FF, B:00, G:00, R:00)
      const dst = 0xFF000000 as Color32

      const result = Blenders.screenColor32(src, dst)

      expect(result).toBe(0xFE7F7F7F >>> 0)
    })

    it('should handle partial alpha on both source and destination', () => {
      const sa = 128
      const invA = 127
      // src: 50% alpha, mid-red (A:80, B:00, G:00, R:80)
      const src = 0x80000080 as Color32
      // dst: 50% alpha, mid-green (A:80, B:00, G:80, R:00)
      const dst = 0x80008000 as Color32

      const result = Blenders.screenColor32(src, dst)

      expect(result).toBe(0xBF008040 >>> 0)
    })
  })

  describe('colorDodgeColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = Blenders.colorDodgeColor32(src, dst)
      expect(result).toBe(dst)
    })

    it('should return white if source is white (opaque)', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF323232 as Color32
      const result = Blenders.colorDodgeColor32(src, dst)

      expect(result).toBe(0xFFFFFFFF >>> 0)
    })

    it('should brighten destination correctly (opaque mid-tones)', () => {
      const dst = 0xFF404040 as Color32
      const src = 0xFF808080 as Color32

      const result = Blenders.colorDodgeColor32(src, dst)
      expect(result).toBe(0xFF818181 >>> 0)
    })

    it('should cap at 255 if the division exceeds byte range', () => {
      const dst = 0xFFC8C8C8 as Color32
      const src = 0xFFC8C8C8 as Color32
      const result = Blenders.colorDodgeColor32(src, dst)

      expect(result).toBe(0xFFFFFFFF >>> 0)
    })

    it('should interpolate dodge result with alpha at 50%', () => {
      const src = 0x80808080 as Color32
      const dst = 0xFF404040 as Color32

      const result = Blenders.colorDodgeColor32(src, dst)
      expect(result).toBe(0xFE606060 >>> 0)
    })

    it('should handle partial alpha on both source and destination', () => {
      const src = 0x800000C0 as Color32
      const dst = 0x80000020 as Color32

      const result = Blenders.colorDodgeColor32(src, dst)
      expect(result).toBe(0xBF000050 >>> 0)
    })
  })

  describe('linearDodgeColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = Blenders.linearDodgeColor32(src, dst)
      expect(result).toBe(dst)
    })

    it('should sum components and cap at 255 (opaque)', () => {
      const src = 0xFF1E64C8 as Color32 // ABGR: A:FF, B:1E, G:64, R:C8
      const dst = 0xFF143264 as Color32 // ABGR: A:FF, B:14, G:32, R:64
      const result = Blenders.linearDodgeColor32(src, dst)

      expect(result).toBe(0xFF3296FF >>> 0) // ABGR: A:FF, B:1E+14=32, G:64+32=96, R:FF
    })

    it('should interpolate additive result with alpha at 50%', () => {
      const src = 0x800000FF as Color32
      const dst = 0xFFFF0000 as Color32

      const result = Blenders.linearDodgeColor32(src, dst)

      expect(result).toBe(0xFEFE007F >>> 0)
    })

    it('should handle partial alpha on both sides', () => {
      const src = 0x80808080 as Color32
      const dst = 0x80808080 as Color32

      const result = Blenders.linearDodgeColor32(src, dst)

      expect(result).toBe(0xBFBFBFBF >>> 0)
    })
  })

  describe('lighterColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      const result = Blenders.lighterColor32(src, dst)
      expect(result).toBe(dst)
    })

    it('should pick source if it has higher luminosity (opaque)', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = Blenders.lighterColor32(src, dst)
      expect(result).toBe(0xFFFFFFFF >>> 0)
    })

    it('should pick destination if it has higher luminosity (opaque)', () => {
      const src = 0xFF101010 as Color32
      const dst = 0xFF404040 as Color32
      const result = Blenders.lighterColor32(src, dst)
      expect(result).toBe(0xFF404040 >>> 0)
    })

    it('should pick source even if some channels are lower but total luminosity is higher', () => {
      const src = 0xFF00FF00 as Color32
      const dst = 0xFF0000FF as Color32
      const result = Blenders.lighterColor32(src, dst)
      expect(result).toBe(0xFF00FF00 >>> 0)
    })

    it('should interpolate between winner and destination at 50% alpha', () => {
      const sa = 128
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const result = Blenders.lighterColor32(src, dst)
      expect(result).toBe(0xFE7F7F7F >>> 0)
    })

    it('should handle complex interpolation where destination is the winner', () => {
      const sa = 128
      const src = 0x80000010 as Color32
      const dst = 0xFF0000FF as Color32
      const result = Blenders.lighterColor32(src, dst)

      const r = (255 * 128 + 255 * 127) >> 8
      const a = (255 * 128 + 255 * 127) >> 8
      expect(result).toBe(((a << 24) | r) >>> 0)
    })

    it('should handle partial alpha destination correctly', () => {
      const sa = 128
      const src = 0x80FFFFFF as Color32
      const dst = 0x80000000 as Color32
      const result = Blenders.lighterColor32(src, dst)

      const c = (255 * 128 + 0 * 127) >> 8
      const a = (255 * 128 + 128 * 127) >> 8
      expect(result).toBe(((a << 24) | (c << 16) | (c << 8) | c) >>> 0)
    })
  })

  describe('overlayColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      expect(Blenders.overlayColor32(src, dst)).toBe(dst)
    })

    it('should apply multiply logic when dst < 128', () => {
      const src = 0xFF404040 as Color32
      const dst = 0xFF202020 as Color32
      expect(Blenders.overlayColor32(src, dst)).toBe(0xFF101010 >>> 0)
    })

    it('should apply screen logic when dst >= 128', () => {
      const src = 0xFFE0E0E0 as Color32
      const dst = 0xFF808080 as Color32
      expect(Blenders.overlayColor32(src, dst)).toBe(0xFFE1E1E1 >>> 0)
    })

    it('should interpolate with partial alpha', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF404040 as Color32
      expect(Blenders.overlayColor32(src, dst)).toBe(0xFE5F5F5F >>> 0)
    })

    it('should handle partial alpha on both sides', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0x80000000 as Color32
      expect(Blenders.overlayColor32(src, dst)).toBe(0xBF000000 >>> 0)
    })
  })

  describe('softLightColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      expect(Blenders.softLightColor32(src, dst)).toBe(dst)
    })

    it('should apply soft light to opaque midtones', () => {
      const src = 0xFFC0C0C0 as Color32
      const dst = 0xFF404040 as Color32
      expect(Blenders.softLightColor32(src, dst)).toBe(0xFF575757 >>> 0)
    })

    it('should handle black and white opaque correctly', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF000000 as Color32
      expect(Blenders.softLightColor32(src, dst)).toBe(0xFF000000 >>> 0)
    })

    it('should handle partial alpha on both sides', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0x80808080 as Color32
      expect(Blenders.softLightColor32(src, dst)).toBe(0xBF9E9E9E >>> 0)
    })
  })

  describe('hardLightColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      expect(Blenders.hardLightColor32(src, dst)).toBe(dst)
    })

    it('should apply multiply logic when src < 128', () => {
      const src = 0xFF202020 as Color32
      const dst = 0xFF404040 as Color32
      expect(Blenders.hardLightColor32(src, dst)).toBe(0xFF101010 >>> 0)
    })

    it('should apply screen logic when src >= 128', () => {
      const src = 0xFF808080 as Color32
      const dst = 0xFFE0E0E0 as Color32
      expect(Blenders.hardLightColor32(src, dst)).toBe(0xFFE1E1E1 >>> 0)
    })
    it('should interpolate with partial alpha', () => {
      const src = 0x80000000 as Color32
      const dst = 0xFFFFFFFF as Color32
      expect(Blenders.hardLightColor32(src, dst)).toBe(0xFE7E7E7E >>> 0)
    })

    it('should handle partial alpha on both sides', () => {
      const src = 0x80000000 as Color32
      const dst = 0x80FFFFFF as Color32
      expect(Blenders.hardLightColor32(src, dst)).toBe(0xBF7E7E7E >>> 0)
    })
  })

  describe('vividLightColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      expect(Blenders.vividLightColor32(src, dst)).toBe(dst)
    })

    it('should burn when source is less than 128 (opaque)', () => {
      const src = 0xFF404040 as Color32
      const dst = 0xFFC8C8C8 as Color32
      expect(Blenders.vividLightColor32(src, dst)).toBe(0xFF919191 >>> 0)
    })

    it('should dodge when source is greater than 128 (opaque)', () => {
      const src = 0xFFC0C0C0 as Color32
      const dst = 0xFF404040 as Color32
      expect(Blenders.vividLightColor32(src, dst)).toBe(0xFF828282 >>> 0)
    })

    it('should handle division by zero guard for sr = 0', () => {
      const src = 0xFF000000 as Color32
      const dst = 0xFFFFFFFF as Color32
      expect(Blenders.vividLightColor32(src, dst)).toBe(0xFF000000 >>> 0)
    })

    it('should handle division by zero guard for sr = 255', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF000000 as Color32
      expect(Blenders.vividLightColor32(src, dst)).toBe(0xFFFFFFFF >>> 0)
    })

    it('should interpolate with partial alpha (Burn branch)', () => {
      const src = 0x80404040 as Color32
      const dst = 0xFFFFFFFF as Color32
      expect(Blenders.vividLightColor32(src, dst)).toBe(0xFEFEFEFE >>> 0)
    })

    it('should interpolate with partial alpha (Dodge branch)', () => {
      const src = 0x80C0C0C0 as Color32
      const dst = 0xFF646464 as Color32
      expect(Blenders.vividLightColor32(src, dst)).toBe(0xFE979797 >>> 0)
    })
  })

  describe('linearLightColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      expect(Blenders.linearLightColor32(src, dst)).toBe(dst)
    })

    it('should darken when source is less than 128 (opaque)', () => {
      const src = 0xFF404040 as Color32
      const dst = 0xFFC8C8C8 as Color32
      expect(Blenders.linearLightColor32(src, dst)).toBe(0xFF494949 >>> 0)
    })

    it('should lighten when source is greater than 128 (opaque)', () => {
      const src = 0xFFC0C0C0 as Color32
      const dst = 0xFF404040 as Color32
      expect(Blenders.linearLightColor32(src, dst)).toBe(0xFFC1C1C1 >>> 0)
    })

    it('should cap at 0 and 255 (opaque)', () => {
      const srcMax = 0xFFFFFFFF as Color32
      const srcMin = 0xFF000000 as Color32
      const dstMid = 0xFF808080 as Color32
      expect(Blenders.linearLightColor32(srcMax, dstMid)).toBe(0xFFFFFFFF >>> 0)
      expect(Blenders.linearLightColor32(srcMin, dstMid)).toBe(0xFF000000 >>> 0)
    })

    it('should interpolate with partial alpha', () => {
      const src = 0x80C0C0C0 as Color32
      const dst = 0xFF404040 as Color32
      expect(Blenders.linearLightColor32(src, dst)).toBe(0xFE808080 >>> 0)
    })

    it('should handle partial alpha on both sides', () => {
      const src = 0x80C0C0C0 as Color32
      const dst = 0x80404040 as Color32
      expect(Blenders.linearLightColor32(src, dst)).toBe(0xBF808080 >>> 0)
    })

    it('should act as neutral when source is 128 or 127 (opaque)', () => {
      const src = 0xFF808080 as Color32
      const dst = 0xFF404040 as Color32
      expect(Blenders.linearLightColor32(src, dst)).toBe(0xFF414141 >>> 0)

      const srcLow = 0xFF7F7F7F as Color32
      expect(Blenders.linearLightColor32(srcLow, dst)).toBe(0xFF3F3F3F >>> 0)
    })
  })

  describe('pinLightColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      expect(Blenders.pinLightColor32(src, dst)).toBe(dst)
    })

    it('should use min(dst, 2 * src) when src < 128', () => {
      const src = 0xFF404040 as Color32
      const dst = 0xFFC8C8C8 as Color32
      expect(Blenders.pinLightColor32(src, dst)).toBe(0xFF808080 >>> 0)
    })

    it('should use max(dst, 2 * (src - 128)) when src >= 128', () => {
      const src = 0xFFC0C0C0 as Color32
      const dst = 0xFF404040 as Color32
      expect(Blenders.pinLightColor32(src, dst)).toBe(0xFF808080 >>> 0)
    })

    it('should replace destination if source is much darker or much lighter', () => {
      const srcDark = 0xFF101010 as Color32
      const dst = 0xFF808080 as Color32
      expect(Blenders.pinLightColor32(srcDark, dst)).toBe(0xFF202020 >>> 0)

      const srcLight = 0xFFF0F0F0 as Color32
      expect(Blenders.pinLightColor32(srcLight, dst)).toBe(0xFFE0E0E0 >>> 0)
    })

    it('should interpolate with partial alpha (darkening case)', () => {
      const src = 0x80101010 as Color32
      const dst = 0xFF808080 as Color32
      expect(Blenders.pinLightColor32(src, dst)).toBe(0xFE4F4F4F >>> 0)
    })

    it('should interpolate with partial alpha (lightening case)', () => {
      const src = 0x80F0F0F0 as Color32
      const dst = 0xFF202020 as Color32
      expect(Blenders.pinLightColor32(src, dst)).toBe(0xFE7F7F7F >>> 0)
    })

    it('should handle partial alpha on both sides', () => {
      const src = 0x80101010 as Color32
      const dst = 0x80808080 as Color32
      expect(Blenders.pinLightColor32(src, dst)).toBe(0xBF4F4F4F >>> 0)
    })
  })

  describe('hardMixColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      expect(Blenders.hardMixColor32(src, dst)).toBe(dst)
    })

    it('should snap to 0 or 255 when opaque', () => {
      const src = 0xFF787878 as Color32
      const dst = 0xFF8C8C8C as Color32
      expect(Blenders.hardMixColor32(src, dst)).toBe(0xFFFFFFFF >>> 0)
    })

    it('should snap to 0 when Vivid Light result is low', () => {
      const src = 0xFF404040 as Color32
      const dst = 0xFF646464 as Color32
      expect(Blenders.hardMixColor32(src, dst)).toBe(0xFF000000 >>> 0)
    })

    it('should interpolate with partial alpha', () => {
      const src = 0x80787878 as Color32
      const dst = 0xFF808080 as Color32
      expect(Blenders.hardMixColor32(src, dst)).toBe(0xFE3F3F3F >>> 0)
    })

    it('should handle partial alpha on both sides', () => {
      const src = 0x80787878 as Color32
      const dst = 0x80808080 as Color32
      expect(Blenders.hardMixColor32(src, dst)).toBe(0xBF3F3F3F >>> 0)
    })

    it('should produce primary colors for opaque high contrast inputs', () => {
      const src = 0xFF0000FF as Color32
      const dst = 0xFF00FF00 as Color32
      const result = Blenders.hardMixColor32(src, dst)
      expect(result).toBe(0xFF0000FF >>> 0)
    })
  })

  describe('differenceColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      expect(Blenders.differenceColor32(src, dst)).toBe(dst)
    })

    it('should return zero when colors are identical and opaque', () => {
      const src = 0xFF804020 as Color32
      const dst = 0xFF804020 as Color32
      expect(Blenders.differenceColor32(src, dst)).toBe(0xFF000000 >>> 0)
    })

    it('should invert destination when source is white and opaque', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF332211 as Color32
      expect(Blenders.differenceColor32(src, dst)).toBe(0xFFCCDDEE >>> 0)
    })

    it('should handle negative results via Math.abs', () => {
      const src = 0xFF000000 as Color32
      const dst = 0xFFFFFFFF as Color32
      expect(Blenders.differenceColor32(src, dst)).toBe(0xFFFFFFFF >>> 0)
    })

    it('should interpolate with partial alpha', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF404040 as Color32
      expect(Blenders.differenceColor32(src, dst)).toBe(0xFE7F7F7F >>> 0)
    })

    it('should handle partial alpha on both sides', () => {
      const src = 0x80000000 as Color32
      const dst = 0x80FFFFFF as Color32
      expect(Blenders.differenceColor32(src, dst)).toBe(3221159678 >>> 0)
    })
  })

  describe('exclusionColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      expect(Blenders.exclusionColor32(src, dst)).toBe(dst)
    })

    it('should return destination when source is black', () => {
      const src = 0xFF000000 as Color32
      const dst = 0xFF445566 as Color32
      expect(Blenders.exclusionColor32(src, dst)).toBe(dst)
    })

    it('should return inversion-like result when source is white', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF404040 as Color32
      const br = 64 + 255 - ((64 * 255) >> 7)
      const expectedChannel = (br & 0xFF)
      const expected = (0xFF000000 | (expectedChannel << 16) | (expectedChannel << 8) | expectedChannel) >>> 0
      expect(Blenders.exclusionColor32(src, dst)).toBe(expected)
    })

    it('should handle partial alpha interpolation correctly', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF000000 as Color32
      const br = 0 + 255 - ((0 * 255) >> 7)
      const r = (br * 128 + 0 * 127) >> 8
      const a = (255 * 128 + 255 * 127) >> 8
      const expected = ((a << 24) | (r << 16) | (r << 8) | r) >>> 0
      expect(Blenders.exclusionColor32(src, dst)).toBe(expected)
    })

    it('should handle partial alpha on both sides', () => {
      const src = 0x80808080 as Color32
      const dst = 0x80808080 as Color32
      const br = 128 + 128 - ((128 * 128) >> 7)
      const r = (br * 128 + 128 * 127) >> 8
      const a = (255 * 128 + 128 * 127) >> 8
      const expected = ((a << 24) | (r << 16) | (r << 8) | r) >>> 0
      expect(Blenders.exclusionColor32(src, dst)).toBe(expected)
    })
  })

  describe('subtractColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      expect(Blenders.subtractColor32(src, dst)).toBe(dst)
    })

    it('should return black when source is white and opaque', () => {
      const src = 0xFFFFFFFF as Color32
      const dst = 0xFF445566 as Color32
      expect(Blenders.subtractColor32(src, dst)).toBe(0xFF000000 >>> 0)
    })

    it('should return destination when source is black and opaque', () => {
      const src = 0xFF000000 as Color32
      const dst = 0xFF445566 as Color32
      expect(Blenders.subtractColor32(src, dst)).toBe(dst)
    })

    it('should handle partial subtraction and floor at zero', () => {
      const src = 0xFF808080 as Color32
      const dst = 0xFF40A0F0 as Color32
      expect(Blenders.subtractColor32(src, dst)).toBe(0xFF002070 >>> 0)
    })

    it('should interpolate with partial alpha', () => {
      const src = 0x80404040 as Color32
      const dst = 0xFF808080 as Color32
       expect(Blenders.subtractColor32(src, dst)).toBe(0xFE5F5F5F >>> 0)
    })

    it('should handle partial alpha on both sides', () => {
      const src = 0x80808080 as Color32
      const dst = 0x80FFFFFF as Color32
      expect(Blenders.subtractColor32(src, dst)).toBe(0xBFBEBEBE >>> 0)
    })
  })

  describe('divideColor32', () => {
    it('should return destination when source is transparent', () => {
      const src = 0x00FFFFFF as Color32
      const dst = 0xFF112233 as Color32
      expect(Blenders.divideColor32(src, dst)).toBe(dst)
    })

    it('should return white when source is zero (division by zero case)', () => {
      const src = 0xFF000000 as Color32
      const dst = 0xFF445566 as Color32
      expect(Blenders.divideColor32(src, dst)).toBe(0xFFFFFFFF >>> 0)
    })

    it('should return white when source equals destination', () => {
      const src = 0xFF4080C0 as Color32
      const dst = 0xFF4080C0 as Color32
      expect(Blenders.divideColor32(src, dst)).toBe(0xFFFFFFFF >>> 0)
    })

    it('should brighten destination based on ABGR layout', () => {
      const src = 0xFF808080 as Color32
      const dst = 0xFF102030 as Color32
      expect(Blenders.divideColor32(src, dst)).toBe(0xFF204060 >>> 0)
    })

    it('should interpolate with partial alpha', () => {
      const src = 0x80FFFFFF as Color32
      const dst = 0xFF808080 as Color32
      expect(Blenders.divideColor32(src, dst)).toBe(0xFE7F7F7F >>> 0)
    })

    it('should handle partial alpha on both sides', () => {
      const src = 0x80808080 as Color32
      const dst = 0x80404040 as Color32
      expect(Blenders.divideColor32(src, dst)).toBe(0xBF5F5F5F >>> 0)
    })
  })

  describe('Registry and Exports', () => {
    it('COLOR_32_BLEND_MODES is populated', () => {
      expect(Blenders.BLEND_MODES.length).toBeGreaterThan(0)
    })

    it('maps functions to indices and back', () => {
      const mode = Blenders.overwriteColor32
      const index = Blenders.BLEND_TO_INDEX.get(mode)
      expect(Blenders.INDEX_TO_BLEND.get(index)).toBe(mode)
    })
  })
})
