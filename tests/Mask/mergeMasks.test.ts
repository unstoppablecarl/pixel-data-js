import { describe, expect, it } from 'vitest'
import { type AlphaMask, type BinaryMask, MaskType } from '../../src'
import { mergeMasks } from '../../src/Mask/mergeMasks'

describe('mergeMasks', () => {
  describe('Basic Composition', () => {
    it('multiplies two AlphaMasks correctly (Rounding & Identity)', () => {
      // 3x1 destination mask, all 255 (opaque)
      const dst = new Uint8Array([255, 255, 255]) as AlphaMask
      const dw = 3

      // Source mask with 0, 128, and 255
      const src = new Uint8Array([0, 128, 255]) as AlphaMask

      mergeMasks(dst, dw, src, {
        w: 3,
        h: 1,
        maskType: MaskType.ALPHA,
      })

      // 255 * 0 = 0
      expect(dst[0]).toBe(0)
      // 255 * 128 = 128 (Identity check)
      expect(dst[1]).toBe(128)
      // 255 * 255 = 255 (Identity check)
      expect(dst[2]).toBe(255)
    })

    it('calculates intersection of partial transparency', () => {
      const dst = new Uint8Array([128]) as AlphaMask
      const src = new Uint8Array([128]) as AlphaMask

      mergeMasks(dst, 1, src, {
        w: 1,
        h: 1,
      })

      // (128 * 128 + 128) >> 8 = 64
      expect(dst[0]).toBe(64)
    })

    it('handles BinaryMask as a "cookie cutter"', () => {
      const dst = new Uint8Array([255, 255]) as AlphaMask
      const src = new Uint8Array([1, 0]) as BinaryMask

      mergeMasks(dst, 2, src, {
        w: 2,
        h: 1,
        maskType: MaskType.BINARY,
      })

      expect(dst[0]).toBe(255)
      expect(dst[1]).toBe(0)
    })
  })

  describe('Clipping and Pitch', () => {
    it('respects dw (destination pitch) during partial merge', () => {
      // 4x4 destination
      const dst = new Uint8Array(16).fill(255) as AlphaMask
      const dw = 4

      // 2x2 source, all 0
      const src = new Uint8Array(4).fill(0) as AlphaMask

      // Merge 2x2 source into the center (1,1) of the 4x4 dst
      mergeMasks(dst, dw, src, {
        x: 1,
        y: 1,
        w: 2,
        h: 2,
      })

      // dst[1,1] is index 5
      expect(dst[5]).toBe(0)
      // dst[0,0] is index 0, should still be 255
      expect(dst[0]).toBe(255)
    })

    it('handles source pitch (mw) correctly', () => {
      const dst = new Uint8Array(1).fill(255) as AlphaMask
      // Source is 10x10, we only want the pixel at (5,5)
      const src = new Uint8Array(100).fill(255) as AlphaMask
      src[55] = 123

      mergeMasks(dst, 1, src, {
        w: 1,
        h: 1,
        mw: 10,
        mx: 5,
        my: 5,
      })

      expect(dst[0]).toBe(123)
    })

    it('prevents out-of-bounds writes when clipping', () => {
      const dst = new Uint8Array(4).fill(255) as AlphaMask
      const dw = 2 // 2x2 grid
      const src = new Uint8Array(4).fill(0) as AlphaMask

      // Attempt to merge a 2x2 area at (1,1)
      // Only dst[1,1] (index 3) is valid. Others are clipped.
      mergeMasks(dst, dw, src, {
        x: 1,
        y: 1,
        w: 2,
        h: 2,
      })

      expect(dst[3]).toBe(0)
      expect(dst[0]).toBe(255)
    })
  })

  describe('Inversion', () => {
    it('accurately inverts AlphaMask values (The 191 Fix)', () => {
      const dst = new Uint8Array([255]) as AlphaMask
      // Mask 64 inverted is 191.
      // Result should be 191 because dst is 255 (Identity).
      const src = new Uint8Array([64]) as AlphaMask

      mergeMasks(dst, 1, src, {
        w: 1,
        h: 1,
        invertMask: true,
      })

      expect(dst[0]).toBe(191)
    })
  })
  it('respects global alpha during merge (Soft Intersection)', () => {
    const dst = new Uint8Array([255]).fill(255) as AlphaMask
    const src = new Uint8Array([255]).fill(255) as AlphaMask

    // Opaque dst + Opaque src + 128 global alpha = 128
    mergeMasks(dst, 1, src, {
      w: 1,
      h: 1,
      alpha: 128,
    })

    expect(dst[0]).toBe(128)
  })

  it('correctly intersects partial masks with global alpha', () => {
    const dst = new Uint8Array([200]) as AlphaMask
    const src = new Uint8Array([150]) as AlphaMask
    const globalAlpha = 100

    // 1. weight = (150 * 100 + 128) >> 8 = 59
    // 2. result = (200 * 59 + 128) >> 8 = 46
    mergeMasks(dst, 1, src, {
      w: 1,
      h: 1,
      alpha: globalAlpha,
    })

    expect(dst[0]).toBe(46)
  })

  it('maintains bit-perfection for inverted masks (The 191 Check)', () => {
    const dst = new Uint8Array([255]) as AlphaMask
    const src = new Uint8Array([64]) as AlphaMask

    // 255 - 64 = 191.
    // Since dst is 255, result must be exactly 191.
    mergeMasks(dst, 1, src, {
      w: 1,
      h: 1,
      invertMask: true,
      alpha: 255,
    })

    expect(dst[0]).toBe(191)
  })

  it('bypasses calculation when global alpha is 0', () => {
    const dst = new Uint8Array([255]) as AlphaMask
    const src = new Uint8Array([255]) as AlphaMask

    mergeMasks(dst, 1, src, {
      w: 1,
      h: 1,
      alpha: 0,
    })

    // Should remain untouched
    expect(dst[0]).toBe(255)
  })

  it('clears destination when resulting weight is 0', () => {
    const dst = new Uint8Array([255]) as AlphaMask
    const src = new Uint8Array([1]) as AlphaMask

    // (1 * 100 + 128) >> 8 = 0
    mergeMasks(dst, 1, src, {
      w: 1,
      h: 1,
      alpha: 100,
    })

    expect(dst[0]).toBe(0)
  })

  it('covers the vertical clipping branch (dy < 0 or sy < 0)', () => {
    // 2x2 destination, all 255
    const dst = new Uint8Array(4).fill(255) as AlphaMask
    const dw = 2

    // 2x2 source, all 0 (transparent)
    const src = new Uint8Array(4).fill(0) as AlphaMask

    // 1. Test dy < 0: Target Y starts at -1.
    // The first row (iy=0) results in dy=-1, which should 'continue'.
    // The second row (iy=1) results in dy=0, which should merge src row 2 into dst row 1.
    mergeMasks(dst, dw, src, {
      x: 0,
      y: -1,
      w: 2,
      h: 2,
    })

    // dst[0,0] and dst[1,0] (indices 0,1) should be 0 because
    // they were hit by the second row of the source (sy=1).
    expect(dst[0]).toBe(0)
    expect(dst[1]).toBe(0)

    // Bottom row of dst (indices 2,3) remains untouched because target was offset -1.
    expect(dst[2]).toBe(255)
    expect(dst[3]).toBe(255)

    // 2. Test sy < 0: Start sampling the mask from above its bounds.
    const dst2 = new Uint8Array(1).fill(255) as AlphaMask
    mergeMasks(dst2, 1, src, {
      x: 0,
      y: 0,
      my: -1, // sy < 0
      w: 1,
      h: 1,
    })

    // Should 'continue' and do nothing
    expect(dst2[0]).toBe(255)
  })

  it('skips calculation when destination is already transparent (da === 0)', () => {
    // 1x1 destination starting at 0
    const dst = new Uint8Array([0]) as AlphaMask
    const dw = 1

    // Opaque source mask
    const src = new Uint8Array([255]) as AlphaMask

    mergeMasks(dst, dw, src, {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      alpha: 255,
    })

    // Result must stay 0 because 0 * 255 = 0
    expect(dst[0]).toBe(0)
  })

  it('preserves transparency when merging partial masks into transparent areas', () => {
    const dst = new Uint8Array([0, 255]) as AlphaMask
    const dw = 2
    const src = new Uint8Array([128, 128]) as AlphaMask

    mergeMasks(dst, dw, src, {
      w: 2,
      h: 1,
    })

    // Index 0: 0 * 128 = 0
    expect(dst[0]).toBe(0)
    // Index 1: 255 * 128 = 128 (Identity logic)
    expect(dst[1]).toBe(128)
  })
  describe('Binary Mask Logic', () => {
    it('treats 1 as opaque and 0 as transparent in Binary mode', () => {
      const dst = new Uint8Array([255, 255]) as AlphaMask
      const src = new Uint8Array([1, 0]) as BinaryMask

      mergeMasks(dst, 2, src, {
        w: 2,
        h: 1,
        maskType: MaskType.BINARY,
      })

      expect(dst[0]).toBe(255) // 1 hit, kept original
      expect(dst[1]).toBe(0)   // 0 hit, cleared
    })

    it('inverts 1/0 logic correctly', () => {
      const dst = new Uint8Array([255, 255]) as AlphaMask
      const src = new Uint8Array([1, 0]) as BinaryMask

      mergeMasks(dst, 2, src, {
        w: 2,
        h: 1,
        maskType: MaskType.BINARY,
        invertMask: true,
      })

      expect(dst[0]).toBe(0)   // 1 becomes 0 (cleared)
      expect(dst[1]).toBe(255) // 0 becomes 1 (kept)
    })

    it('applies global alpha to binary hits', () => {
      const dst = new Uint8Array([255]) as AlphaMask
      const src = new Uint8Array([1]) as BinaryMask

      mergeMasks(dst, 1, src, {
        w: 1,
        h: 1,
        maskType: MaskType.BINARY,
        alpha: 128,
      })

      expect(dst[0]).toBe(128)
    })
  })

  describe('Alpha Mask Logic', () => {
    it('maintains 0-255 scale for AlphaMasks', () => {
      const dst = new Uint8Array([255]) as AlphaMask
      const src = new Uint8Array([128]) as AlphaMask

      mergeMasks(dst, 1, src, {
        w: 1,
        h: 1,
        maskType: MaskType.ALPHA,
      })

      expect(dst[0]).toBe(128)
    })
  })

  describe('Coordinate Clipping', () => {
    it('handles out-of-bounds target coordinates', () => {
      const dst = new Uint8Array(4).fill(255) as AlphaMask
      const src = new Uint8Array([0]) as BinaryMask // This is a "clear" pixel

      mergeMasks(dst, 2, src, {
        x: 1,
        y: 1,
        w: 1,
        h: 1,
        maskType: MaskType.BINARY,
      })

      // Only index 3 (bottom-right) should be cleared
      expect(dst[0]).toBe(255)
      expect(dst[3]).toBe(0)
    })
  })
})
