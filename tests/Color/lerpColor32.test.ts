import { lerpColor32, lerpColor32Fast, packColor, unpackColor } from '@/index'
import { describe, expect, it } from 'vitest'
import { pack, unpack } from '../_helpers'

describe('lerpColor32Fast', () => {
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

describe('lerpColor32', () => {
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
