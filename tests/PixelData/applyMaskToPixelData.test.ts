import { describe, expect, it } from 'vitest'
import { type AlphaMask, type BinaryMask, MaskType } from '../../src'
import { applyMaskToPixelData } from '../../src/PixelData/applyMaskToPixelData'
import { makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const HALF_RED = pack(255, 0, 0, 128)

describe('applyMaskToPixelData', () => {
  describe('Guard Conditions & Clipping', () => {
    it('skips work for out-of-bounds targets', () => {
      const dst = makeTestPixelData(1, 1, RED)
      const mask = new Uint8Array([0]) as BinaryMask

      applyMaskToPixelData(dst, mask, {
        x: 10,
        y: 10,
        w: 1,
        h: 1,
      })

      expect(dst.data32[0]).toBe(RED)
    })

    it('handles negative x, y offsets with mask synchronization', () => {
      const dst = makeTestPixelData(1, 1, RED)
      // 2x2 mask, only index [3] is 0 (fully transparent)
      const mask = new Uint8Array([1, 1, 1, 0]) as BinaryMask

      // Clip: x:-1, y:-1 means we sample mask at (1,1) -> index 3
      applyMaskToPixelData(dst, mask, {
        x: -1,
        y: -1,
        w: 2,
        h: 2,
        mw: 2,
        maskType: MaskType.BINARY,
      })

      // dst[0,0] alpha should now be 0
      expect(dst.data32[0]).toBe(pack(255, 0, 0, 0))
    })
  })

  describe('Masking Logic (Binary & Alpha)', () => {
    it('handles BinaryMask pass/fail and inversion', () => {
      const dst = makeTestPixelData(2, 1, RED)
      const mask = new Uint8Array([1, 0]) as BinaryMask

      // Normal: first pixel stays, second pixel cleared
      applyMaskToPixelData(dst, mask, {
        maskType: MaskType.BINARY,
      })
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1] >>> 24).toBe(0)

      // Inverted: first pixel cleared, second stays
      const dst2 = makeTestPixelData(2, 1, RED)
      applyMaskToPixelData(dst2, mask, {
        maskType: MaskType.BINARY,
        invertMask: true,
      })
      expect(dst2.data32[0] >>> 24).toBe(0)
      expect(dst2.data32[1]).toBe(RED)
    })

    it('multiplies existing alpha in AlphaMask mode', () => {
      // Start with half-transparent RED
      const dst = makeTestPixelData(1, 1, HALF_RED)
      // Mask is also half (128)
      const mask = new Uint8Array([128]) as AlphaMask

      applyMaskToPixelData(dst, mask, {
        maskType: MaskType.ALPHA,
      })

      // Math: (128 * 128 + 128) >> 8 = 64
      const finalAlpha = (dst.data32[0] >>> 24) & 0xff
      expect(finalAlpha).toBe(64)
      // RGB should remain untouched
      expect(dst.data32[0] & 0x00ffffff).toBe(RED & 0x00ffffff)
    })
  })

  describe('Grid Checks', () => {
    const DW = 5
    const DH = 5

    it('accurately applies mask across a complex grid', () => {
      const dst = makeTestPixelData(DW, DH, BLUE)
      const mask = new Uint8Array(DW * DH) as BinaryMask

      // Checkerboard mask
      for (let i = 0; i < mask.length; i++) {
        mask[i] = i % 2 === 0
          ? 1
          : 0
      }

      applyMaskToPixelData(dst, mask, {
        maskType: MaskType.BINARY,
      })

      for (let y = 0; y < DH; y++) {
        for (let x = 0; x < DW; x++) {
          const idx = y * DW + x
          const expectedAlpha = (idx % 2 === 0)
            ? 255
            : 0

          expect((dst.data32[idx] >>> 24) & 0xff).toBe(expectedAlpha)
        }
      }
    })
  })
  describe('applyMaskToPixelData - Clipping & Bounds', () => {
    it('covers clipping from the right/bottom edge', () => {
      const dst = makeTestPixelData(2, 2, RED)
      // 5x5 mask, only (1,1) is 0
      const mask = new Uint8Array(25).fill(1) as BinaryMask
      mask[6] = 0 // (1,1) in a 5x5 grid

      // Apply a 5x5 mask area starting at (0,0) on a 2x2 dst
      applyMaskToPixelData(dst, mask, {
        x: 0,
        y: 0,
        w: 5,
        h: 5,
        mw: 5,
        maskType: MaskType.BINARY,
      })

      // dst(1,1) is index 3. It corresponds to mask(1,1).
      expect(dst.data32[3] >>> 24).toBe(0)
      // dst(0,0) is index 0. It corresponds to mask(0,0), which is 255.
      expect(dst.data32[0] >>> 24).toBe(255)
    })

    it('prevents memory wrap-around when mask width exceeds bounds', () => {
      const dst = makeTestPixelData(3, 3, RED)
      // Mask width 10, but actualW will be 2 (x:1 to dst.width:3)
      const mask = new Uint8Array(100).fill(1) as BinaryMask

      // Set a "trap" pixel in the mask row 1 at index 10 (start of next logical row if pitch was 10)
      // If stride math is wrong, this might be applied to dst row 2.
      mask[10] = 0

      applyMaskToPixelData(dst, mask, {
        x: 1,
        y: 1,
        w: 10,
        h: 1,
        mw: 10,
        maskType: MaskType.BINARY,
      })

      // (1,1) index 4, (2,1) index 5 should be RED (mask was 255 at those spots)
      expect(dst.data32[4] >>> 24).toBe(255)
      expect(dst.data32[5] >>> 24).toBe(255)

      // (0,2) index 6 should NOT be affected by mask index 10
      expect(dst.data32[6] >>> 24).toBe(255)
    })

    it('handles the case where the draw area is entirely outside the destination', () => {
      const dst = makeTestPixelData(2, 2, RED)
      const mask = new Uint8Array([0, 0, 0, 0]) as BinaryMask

      // Draw area is far to the right
      applyMaskToPixelData(dst, mask, {
        x: 10,
        y: 0,
        w: 2,
        h: 2,
      })

      // No pixels should have changed
      const isUntouched = Array.from(dst.data32).every((p) => p === RED)
      expect(isUntouched).toBe(true)
    })
  })
  it('covers AlphaMask short-circuit (effectiveM === 0)', () => {
    const dst = makeTestPixelData(1, 1, RED)
    const mask = new Uint8Array([0]) as AlphaMask

    applyMaskToPixelData(dst, mask, {
      maskType: MaskType.ALPHA,
      invertMask: false,
    })

    // effectiveM is 0, alpha should be cleared
    expect(dst.data32[0] >>> 24).toBe(0)
  })

  it('covers AlphaMask inversion (effectiveM = 255 - mVal)', () => {
    const dst = makeTestPixelData(1, 1, RED)
    const mask = new Uint8Array([255]) as AlphaMask

    applyMaskToPixelData(dst, mask, {
      maskType: MaskType.ALPHA,
      invertMask: true,
    })

    // 255 inverted is 0, alpha should be cleared
    expect(dst.data32[0] >>> 24).toBe(0)
  })

  it('covers globalAlpha scaling logic (weight calculation)', () => {
    const dst = makeTestPixelData(1, 1, RED)
    const mask = new Uint8Array([255]) as AlphaMask
    const globalAlpha = 128

    applyMaskToPixelData(dst, mask, {
      maskType: MaskType.ALPHA,
      alpha: globalAlpha, // weight = (255 * 128 + 128) >> 8 = 128
    })

    // dst was 255, weight is 128. Identity (da === 255) makes result 128.
    expect(dst.data32[0] >>> 24).toBe(128)
  })

  it('covers weight === 0 clearing branch', () => {
    const dst = makeTestPixelData(1, 1, RED)
    const mask = new Uint8Array([1]) as AlphaMask
    const globalAlpha = 10

    // weight = (1 * 10 + 128) >> 8 = 0
    applyMaskToPixelData(dst, mask, {
      maskType: MaskType.ALPHA,
      alpha: globalAlpha,
    })

    expect(dst.data32[0] >>> 24).toBe(0)
  })

  it('covers identity logic (da === 255)', () => {
    const dst = makeTestPixelData(1, 1, RED) // Opaque RED (da=255)
    const mask = new Uint8Array([100]) as AlphaMask

    applyMaskToPixelData(dst, mask, {
      maskType: MaskType.ALPHA,
      alpha: 255, // weight = 100
    })

    // Since da was 255, finalAlpha should be exactly the weight (100)
    expect(dst.data32[0] >>> 24).toBe(100)
  })

  it('covers identity logic (weight === 255)', () => {
    const dst = makeTestPixelData(1, 1, HALF_RED) // da = 128
    const mask = new Uint8Array([255]) as AlphaMask

    applyMaskToPixelData(dst, mask, {
      maskType: MaskType.ALPHA,
      alpha: 255, // weight = 255
    })

    // Since weight is 255, da should remain 128
    expect(dst.data32[0] >>> 24).toBe(128)
  })

  it('covers already transparent destination (da === 0)', () => {
    const transparentPixel = pack(0, 0, 0, 0)
    const dst = makeTestPixelData(1, 1, transparentPixel)
    const mask = new Uint8Array([255]) as AlphaMask

    applyMaskToPixelData(dst, mask, {
      maskType: MaskType.ALPHA,
    })

    // da was 0, should stay 0
    expect(dst.data32[0] >>> 24).toBe(0)
  })

  it('covers globalAlpha === 0 short-circuit', () => {
    const dst = makeTestPixelData(1, 1, RED)
    const mask = new Uint8Array([255]) as AlphaMask

    applyMaskToPixelData(dst, mask, {
      alpha: 0,
    })

    // Should skip processing and stay RED
    expect(dst.data32[0]).toBe(RED)
  })
})
