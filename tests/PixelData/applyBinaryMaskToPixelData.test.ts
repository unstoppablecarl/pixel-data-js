import { applyBinaryMaskToPixelData, type BinaryMask, makeBinaryMask, type PixelData } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestBinaryMask, makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const HALF_RED = pack(255, 0, 0, 128)

describe('applyBinaryMaskToPixelData', () => {
  describe('Guard Conditions & Clipping', () => {
    it('skips work for out-of-bounds targets', () => {
      const dst = makeTestPixelData(1, 1, RED)
      const mask = makeTestBinaryMask(1, 1, [0])

      applyBinaryMaskToPixelData(dst, mask, {
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
      const mask = makeTestBinaryMask(2, 2, [1, 1, 1, 0])

      // Clip: x:-1, y:-1 means we sample mask at (1,1) -> index 3
      applyBinaryMaskToPixelData(dst, mask, {
        x: -1,
        y: -1,
        w: 2,
        h: 2,
      })

      // dst[0,0] alpha should now be 0
      expect(dst.data32[0]).toBe(pack(255, 0, 0, 0))
    })
  })

  describe('Masking Logic (Binary & Alpha)', () => {
    it('handles BinaryMask pass/fail and inversion', () => {
      const dst = makeTestPixelData(2, 1, RED)
      const mask = makeTestBinaryMask(2, 2, [1, 0])

      // Normal: first pixel stays, second pixel cleared
      applyBinaryMaskToPixelData(dst, mask, {})
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1] >>> 24).toBe(0)

      // Inverted: first pixel cleared, second stays
      const dst2 = makeTestPixelData(2, 1, RED)
      applyBinaryMaskToPixelData(dst2, mask, {
        invertMask: true,
      })
      expect(dst2.data32[0] >>> 24).toBe(0)
      expect(dst2.data32[1]).toBe(RED)
    })
  })

  describe('Grid Checks', () => {
    const DW = 5
    const DH = 5

    it('accurately applies mask across a complex grid', () => {
      const dst = makeTestPixelData(DW, DH, BLUE)
      const mask = makeBinaryMask(DW, DH)

      // Checkerboard mask
      for (let i = 0; i < mask.data.length; i++) {
        mask.data[i] = i % 2 === 0
          ? 1
          : 0
      }

      applyBinaryMaskToPixelData(dst, mask)

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
  describe('applyBinaryMaskToPixelData - Clipping & Bounds', () => {
    it('covers clipping from the right/bottom edge', () => {
      const dst = makeTestPixelData(2, 2, RED)
      // 5x5 mask, only (1,1) is 0
      const mask = makeTestBinaryMask(5, 5, 1)

      mask.data[6] = 0 // (1,1) in a 5x5 grid

      // Apply a 5x5 mask area starting at (0,0) on a 2x2 dst
      applyBinaryMaskToPixelData(dst, mask, {
        x: 0,
        y: 0,
        w: 5,
        h: 5,
      })

      // dst(1,1) is index 3. It corresponds to mask(1,1).
      expect(dst.data32[3] >>> 24).toBe(0)
      // dst(0,0) is index 0. It corresponds to mask(0,0), which is 255.
      expect(dst.data32[0] >>> 24).toBe(255)
    })

    it('prevents memory wrap-around when mask width exceeds bounds', () => {
      const dst = makeTestPixelData(3, 3, RED)
      // Mask width 10, but actualW will be 2 (x:1 to dst.width:3)
      const mask = makeTestBinaryMask(10, 10, 1)

      // Set a "trap" pixel in the mask row 1 at index 10 (start of next logical row if pitch was 10)
      // If stride math is wrong, this might be applied to dst row 2.
      mask.data[10] = 0

      applyBinaryMaskToPixelData(dst, mask, {
        x: 1,
        y: 1,
        w: 10,
        h: 1,
      })

      // (1,1) index 4, (2,1) index 5 should be RED (mask was 255 at those spots)
      expect(dst.data32[4] >>> 24).toBe(255)
      expect(dst.data32[5] >>> 24).toBe(255)

      // (0,2) index 6 should NOT be affected by mask index 10
      expect(dst.data32[6] >>> 24).toBe(255)
    })

    it('handles the case where the draw area is entirely outside the destination', () => {
      const dst = makeTestPixelData(2, 2, RED)
      const mask = makeTestBinaryMask(2, 2, 0)

      // Draw area is far to the right
      applyBinaryMaskToPixelData(dst, mask, {
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
  it('covers BinaryMask short-circuit (effectiveM === 0)', () => {
    const dst = makeTestPixelData(1, 1, RED)
    const mask = makeTestBinaryMask(1, 1)

    applyBinaryMaskToPixelData(dst, mask, {
      invertMask: false,
    })

    // effectiveM is 0, alpha should be cleared
    expect(dst.data32[0] >>> 24).toBe(0)
  })

  it('covers BinaryMask inversion (effectiveM = 255 - mVal)', () => {
    const dst = makeTestPixelData(1, 1, RED)
    const mask = makeTestBinaryMask(1, 1, 1)

    applyBinaryMaskToPixelData(dst, mask, {
      invertMask: true,
    })

    // 255 inverted is 0, alpha should be cleared
    expect(dst.data32[0] >>> 24).toBe(0)
  })

  it('covers globalAlpha scaling logic (weight calculation)', () => {
    const dst = makeTestPixelData(1, 1, RED)
    const mask = makeTestBinaryMask(1, 1, 1)

    const globalAlpha = 128

    applyBinaryMaskToPixelData(dst, mask, {
      alpha: globalAlpha, // weight = (255 * 128 + 128) >> 8 = 128
    })

    // dst was 255, weight is 128. Identity (da === 255) makes result 128.
    expect(dst.data32[0] >>> 24).toBe(128)
  })

  it('covers identity logic (weight === 255)', () => {
    const dst = makeTestPixelData(1, 1, HALF_RED) // da = 128
    const mask = makeTestBinaryMask(1, 1, 1)

    applyBinaryMaskToPixelData(dst, mask, {
      alpha: 255, // weight = 255
    })

    // Since weight is 255, da should remain 128
    expect(dst.data32[0] >>> 24).toBe(128)
  })

  it('covers already transparent destination (da === 0)', () => {
    const transparentPixel = pack(0, 0, 0, 0)
    const dst = makeTestPixelData(1, 1, transparentPixel)
    const mask = makeTestBinaryMask(1, 1, 1)

    applyBinaryMaskToPixelData(dst, mask, {})

    // da was 0, should stay 0
    expect(dst.data32[0] >>> 24).toBe(0)
  })

  it('covers globalAlpha === 0 short-circuit', () => {
    const dst = makeTestPixelData(1, 1, RED)
    const mask = makeTestBinaryMask(1, 1, 1)

    applyBinaryMaskToPixelData(dst, mask, {
      alpha: 0,
    })

    // Should skip processing and stay RED
    expect(dst.data32[0]).toBe(RED)
  })

  it('covers fractional destination alpha combined with fractional weight', () => {
    // 1. Destination has partial alpha (da = 128)
    const dst = makeTestPixelData(1, 1, HALF_RED)
    const mask = makeTestBinaryMask(1, 1, 1)

    // 2. Apply with partial globalAlpha (weight = 128)
    applyBinaryMaskToPixelData(dst, mask, {
      alpha: 128,
    })

    // 3. The math branch executes: (da * weight + 128) >> 8
    // (128 * 128 + 128) >> 8 = 16512 >> 8 = 64
    const resultAlpha = (dst.data32[0] >>> 24) & 0xff

    expect(resultAlpha).toBe(64)
  })

  describe('applyBinaryMaskToPixelData - Bounds and Early Returns', () => {
    const createMockPixelData = (w: number, h: number) => {
      const data32 = new Uint32Array(w * h)

      // Fill with opaque white for visibility in tests
      data32.fill(0xffffffff)

      return {
        width: w,
        height: h,
        data32,
      } as unknown as PixelData
    }

    describe('Destination Clipping (w <= 0 || h <= 0)', () => {
      it('returns early when explicitly passed w or h as 0', () => {
        const dst = createMockPixelData(2, 2)
        const mask = makeTestBinaryMask(2, 2)

        const optsW = {
          w: 0,
          h: 2,
        }
        const optsH = {
          w: 2,
          h: 0,
        }

        applyBinaryMaskToPixelData(dst, mask, optsW)
        expect(dst.data32[0]).toBe(0xffffffff)

        applyBinaryMaskToPixelData(dst, mask, optsH)
        expect(dst.data32[0]).toBe(0xffffffff)
      })

      it('returns early when target X is entirely outside the destination bounds', () => {
        const dst = createMockPixelData(2, 2)
        const mask = makeTestBinaryMask(1, 1)
        const opts = {
          x: 5,
          y: 0,
        }

        applyBinaryMaskToPixelData(dst, mask, opts)

        expect(dst.data32[0]).toBe(0xffffffff)
      })

      it('returns early when target Y is entirely outside the destination bounds', () => {
        const dst = createMockPixelData(2, 2)
        const mask = makeBinaryMask(1, 1)
        const opts = {
          x: 0,
          y: 5,
        }

        applyBinaryMaskToPixelData(dst, mask, opts)

        expect(dst.data32[0]).toBe(0xffffffff)
      })

      it('returns early when negative target X pushes the effective width to 0', () => {
        const dst = createMockPixelData(2, 2)
        const mask = makeBinaryMask(2, 2)
        const opts = {
          x: -2,
          w: 2,
        }

        // If x is -2 and w is 2, the clip logic `w += x` results in 0
        applyBinaryMaskToPixelData(dst, mask, opts)

        expect(dst.data32[0]).toBe(0xffffffff)
      })
    })

    it('returns early when source X offset (mx) exceeds mask width', () => {
      const dst = createMockPixelData(2, 2)
      const mask = makeBinaryMask(2, 2)
      const opts = {
        mx: 2,
        mw: 2,
      }

      // Starting at X index 2 on a 2x2 mask leaves 0 safe width
      applyBinaryMaskToPixelData(dst, mask, opts)

      expect(dst.data32[0]).toBe(0xffffffff)
    })

    it('returns early when source Y offset (my) exceeds mask height', () => {
      const dst = createMockPixelData(2, 2)
      const mask = makeBinaryMask(2, 2)
      const opts = {
        my: 2,
        mw: 2,
      }

      // Starting at Y index 2 on a 2x2 mask (height 2) leaves 0 safe height
      applyBinaryMaskToPixelData(dst, mask, opts)

      expect(dst.data32[0]).toBe(0xffffffff)
    })

    it('returns early when requested width extends beyond a smaller mask', () => {
      const dst = createMockPixelData(4, 4)
      const mask = makeBinaryMask(1, 1)
      const opts = {
        mx: 1,
        mw: 1,
      }

      // If we offset mx by 1 on a 1x1 mask, safeW becomes 1 - 1 = 0
      applyBinaryMaskToPixelData(dst, mask, opts)

      expect(dst.data32[0]).toBe(0xffffffff)
    })

    it('returns early when the mask pitch (mw) is 0', () => {
      const dst = makeTestPixelData(2, 2, 0xffffffff)
      const mask = {
        w: 0,
      } as unknown as BinaryMask

      const opts = {
        w: 2,
        h: 2,
      }

      // 3 arguments, can stay on one line
      applyBinaryMaskToPixelData(dst, mask, opts)

      // Verify the top-left pixel was not cleared
      expect(dst.data32[0]).toBe(0xffffffff)
    })
  })

})
