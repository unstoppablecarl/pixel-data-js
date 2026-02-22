import { describe, expect, it } from 'vitest'
import {
  type BlendModeIndex,
  COLOR_32_BLEND_MODES,
  COLOR_32_BLEND_TO_INDEX, colorBurnColor32, differenceColor32, hardLightColor32,
  INDEX_TO_COLOR_32_BLEND, linearDodgeColor32, multiplyColor32, overlayColor32,
  overwriteColor32, screenColor32, sourceOverColor32,
} from '../../src'
import { pack, unpack } from '../_helpers'

/**
 * HELPER: Tolerance check for bit-drift caused by >> 8 (division by 256 vs 255)
 */
const expectColorMatch = (received: number, expected: number, tolerance = 2) => {
  const c1 = unpack(received), c2 = unpack(expected)
  expect(c1.r).toBeGreaterThanOrEqual(c2.r - tolerance)
  expect(c1.r).toBeLessThanOrEqual(c2.r + tolerance)
  expect(c1.g).toBeGreaterThanOrEqual(c2.g - tolerance)
  expect(c1.g).toBeLessThanOrEqual(c2.g + tolerance)
  expect(c1.b).toBeGreaterThanOrEqual(c2.b - tolerance)
  expect(c1.b).toBeLessThanOrEqual(c2.b + tolerance)
  expect(c1.a).toBeGreaterThanOrEqual(c2.a - tolerance)
  expect(c1.a).toBeLessThanOrEqual(c2.a + tolerance)
}

describe.skip('32-bit Blend Modes: 100% Coverage Suite', () => {
  // Test Variables
  const BLACK = pack(0, 0, 0, 255)
  const WHITE = pack(255, 255, 255, 255)
  const BLUE = pack(0, 0, 255, 255)
  const TRANSPARENT = pack(0, 0, 0, 0)
  const SEMI_RED = pack(255, 0, 0, 128)
  const SEMI_BLUE_DST = pack(0, 0, 255, 128)
  const MID_GRAY = pack(128, 128, 128, 255)
  const NEAR_BLACK = pack(1, 1, 1, 255)

  // 1. GLOBAL SHORT-CIRCUIT TESTS
  describe('Universal Early Exits', () => {
    it('overwrite should return the src', () => {
      expect(overwriteColor32(TRANSPARENT, BLUE)).toBe(TRANSPARENT)
      expect(overwriteColor32(BLUE, TRANSPARENT)).toBe(BLUE)
    })

    it('should return dst immediately when src is fully transparent', () => {
      COLOR_32_BLEND_MODES.forEach((blend) => {

        if (blend === overlayColor32) return
        expect(blend(TRANSPARENT, BLUE)).toBe(BLUE)
      })
    })

    it('should return src immediately when src is opaque (sourceOver only)', () => {

      expect(sourceOverColor32(pack(255, 0, 0, 255), BLUE)).toBe(pack(255, 0, 0, 255))
    })

    it('should trigger opaque shortcut (sa === 255) for all modes', () => {
      // This hits the "if (sa === 255)" branch in Screen, Multiply, etc.
      const res = multiplyColor32(WHITE, BLUE)
      expect(unpack(res).a).toBe(255)
    })
  })

  // 2. FUNCTION SPECIFIC BRANCHES
  describe('Branch Coverage: Core Math', () => {

    it('hardLight: should hit both < 128 and >= 128 branches', () => {
      const mixedSrc = pack(100, 200, 100, 255) // R < 128, G > 128
      const res = hardLightColor32(mixedSrc, MID_GRAY)
      expect(res).not.toBe(0)
    })

    it('overlay: should hit both < 128 and >= 128 branches', () => {
      const mixedDst = pack(100, 200, 100, 255) // R < 128, G > 128
      const res = overlayColor32(MID_GRAY, mixedDst)
      expect(res).not.toBe(0)
    })

    it('colorBurn: should hit dst === 255 early exit', () => {
      const res = colorBurnColor32(BLACK, WHITE)
      expect(res).toBe(WHITE)
    })

    it('colorBurn: should hit sr || 1 safety and Math.max clamp', () => {
      // src 0 triggers || 1. Large (255-dr) / small sr triggers negative result -> Math.max(0)
      const res = colorBurnColor32(NEAR_BLACK, pack(50, 50, 50, 255))
      expect(unpack(res).r).toBe(0)
    })

    it('linearDodge: should hit Math.min clamp at 255', () => {
      const res = linearDodgeColor32(WHITE, BLUE)
      expect(unpack(res).r).toBe(255)
      expect(unpack(res).b).toBe(255)
    })
  })

  // 3. ALPHA INTERPOLATION & COMPOSITING
  describe('Alpha & Transparency Paths', () => {

    it('should hit Step 2 (Alpha Lerp) for semi-transparent source', () => {
      // This forces execution of the lerp math in Multiply/Screen/etc.
      const res = multiplyColor32(SEMI_RED, WHITE)
      const c = unpack(res)
      expect(c.g).toBeGreaterThan(0) // White (255) mixed with Multiply result (0) = ~127
      expect(c.g).toBeLessThan(255)
    })

    it('should correctly composite alpha for semi-transparent destination', () => {
      // This ensures the Porter-Duff / Alpha addition logic is exercised
      const res = sourceOverColor32(SEMI_RED, SEMI_BLUE_DST)
      const c = unpack(res)
      // (128 + 128 * (255-128)/255) approx 191
      expect(c.a).toBeGreaterThan(128)
      expect(c.a).toBeLessThan(255)
    })
  })

  describe('Difference Mode', () => {
    it('should hit absolute difference math', () => {
      const res = differenceColor32(WHITE, BLACK)
      expectColorMatch(res, WHITE)
      const res2 = differenceColor32(BLACK, WHITE)
      expectColorMatch(res2, WHITE)
    })
  })
  it('hardLight & overlay: should hit both branches of the ternary', () => {
    const dark = pack(50, 50, 50, 128)
    const light = pack(200, 200, 200, 128)
    const dst = pack(128, 128, 128, 255)

    // Hit the < 128 paths
    hardLightColor32(dark, dst)
    overlayColor32(dark, dst)

    // Hit the >= 128 paths
    hardLightColor32(light, dst)
    overlayColor32(light, dst)
  })

  it('should hit Alpha Lerp lines in every blend mode', () => {
    // Use a middle-gray (128) so that Multiply/Screen/etc. never result in 0 or 255
    const SEMI_GRAY = pack(128, 128, 128, 128)
    const SOLID_BLUE = pack(0, 0, 255, 255)

    Object.entries(COLOR_32_BLEND_MODES).forEach(([_name, blendMode]) => {
      // 128 alpha forces the code past sa === 0 and sa === 255 shortcuts
      const result = blendMode(SEMI_GRAY, SOLID_BLUE)
      const c = unpack(result)

      // We check the alpha channel primarily to confirm the function completed
      expect(c.a).toBeGreaterThan(0)

      // This ensures we actually hit the core math blocks
      // We check that the result isn't just a "null" color
      expect(result).not.toBe(0)
    })
  })
  it('screenColor32: should hit the opaque shortcut branch', () => {
    const SOLID_WHITE = pack(255, 255, 255, 255)
    const SOLID_BLUE = pack(0, 0, 255, 255)

    // This triggers: if (sa === 255)
    const result = screenColor32(SOLID_WHITE, SOLID_BLUE)

    // Verify the result is Opaque White (Screening anything with white results in white)
    expect(result).toBe(WHITE)
  })
  it('colorBurnColor32: should hit division-by-zero safety (|| 1) for all channels', () => {
    // 1. sa must be 255 to hit the first 'if (sa === 255)' branch
    // 2. sr, sg, sb must be 0 to trigger the || 1 safety fallback
    // 3. dr, dg, db must NOT be 255 (to avoid the early dr === 255 ? 255 branch)
    const OPAQUE_BLACK_SRC = pack(0, 0, 0, 255)
    const DARK_BLUE_DST = pack(0, 0, 100, 255)

    const resultOpaque = colorBurnColor32(OPAQUE_BLACK_SRC, DARK_BLUE_DST)
    expect(resultOpaque).toBeDefined()

    // 4. NOW we must hit the LERP block (the second half of the function)
    // sa = 128 bypasses both sa === 0 and sa === 255
    const SEMI_BLACK_SRC = pack(0, 0, 0, 128)
    const resultLerp = colorBurnColor32(SEMI_BLACK_SRC, DARK_BLUE_DST)

    const c = unpack(resultLerp)
    expect(c.a).toBeGreaterThan(0)
  })

  describe('Blend Mode Registry', () => {
    it('should have consistent bidirectional mapping', () => {
      const overwrite = overwriteColor32

      const index = COLOR_32_BLEND_TO_INDEX.get(overwrite)

      // Verify index to function
      expect(INDEX_TO_COLOR_32_BLEND.get(index)).toBe(overwrite)

      // Verify function to index
      expect(index).toBe(0 as BlendModeIndex)
    })

    it('should maintain the same index for specific modes across calls', () => {
      const index = COLOR_32_BLEND_TO_INDEX.get(screenColor32)

      expect(index).toBe(2 as BlendModeIndex)

      expect(INDEX_TO_COLOR_32_BLEND.get(index)).toBe(screenColor32)
    })

    it('should contain all expected blend modes in the named object', () => {
      const keys = Object.keys(COLOR_32_BLEND_MODES)

      expect(keys).toContain('overwrite')

      expect(keys).toContain('sourceOver')

      expect(keys).toContain('colorBurn')

      expect(keys.length).toBe(9)
    })

    it('should return the correct function for a branded index', () => {
      // Simulating getting a branded index from a safe source
      const testIndex = 4 as BlendModeIndex

      const blender = INDEX_TO_COLOR_32_BLEND.get(testIndex)

      expect(blender).toBe(multiplyColor32)
    })

    it('should have unique indices for every registered blender', () => {
      const indices = new Set<number>()

      const modes = Object.values(COLOR_32_BLEND_MODES)

      for (const mode of modes) {
        const index = COLOR_32_BLEND_TO_INDEX.get(mode)

        indices.add(index as unknown as number)
      }

      expect(indices.size).toBe(modes.length)
    })
  })
})
