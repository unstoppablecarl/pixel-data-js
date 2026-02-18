import { describe, expect, it, vi } from 'vitest'
import { type AlphaMask, type BinaryMask, blendPixelData, type Color32, MaskType, sourceOverColor32 } from '../../src'
import { PixelData } from '../../src/PixelData'
import { createTestImageData, expectPixelToMatch, makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const WHITE = pack(255, 255, 255, 255)
const TRANSPARENT = pack(0, 0, 0, 0)

const copyBlend = (s: Color32) => s

describe('blendPixelData', () => {
  describe('Guard Conditions & Early Exits', () => {
    it('skips all work for invalid globalAlpha or out-of-bounds targets', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, RED)

      // Merge: alpha 0 and out-of-bounds checks
      blendPixelData(dst, src, { alpha: 0 })
      blendPixelData(dst, src, {
        x: 10,
        y: 10,
      })

      expect(dst.data32[0]).toBe(BLUE)
    })

    it('bypasses blendFn for transparent source pixels', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, TRANSPARENT)
      const mockBlend = vi.fn(sourceOverColor32)

      blendPixelData(dst, src, { blendFn: mockBlend })

      expect(mockBlend).not.toHaveBeenCalled()
    })
  })

  describe('Masking Logic (Binary & Alpha)', () => {
    it('handles BinaryMask skip/pass and inversion', () => {
      const dst = makeTestPixelData(4, 1, BLUE)
      const src = makeTestPixelData(4, 1, RED)
      // Combined: pass/skip mixed values and inversion logic
      const mask = new Uint8Array([
        255,
        0,
        255,
        0,
      ]) as BinaryMask

      // Test Normal Binary
      blendPixelData(dst, src, {
        mask,
        maskType: MaskType.BINARY,
      })
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(BLUE)

      // Test Inverted Binary
      blendPixelData(dst, src, {
        mask,
        maskType: MaskType.BINARY,
        invertMask: true,
      })
      expect(dst.data32[0]).toBe(RED) // Was RED from previous call
      expect(dst.data32[1]).toBe(RED) // BLUE becomes RED because mask 0 is now 255
    })

    it('scales AlphaMask and handles bit-perfect pass-through', () => {
      const dst = makeTestPixelData(3, 1, BLUE)
      const src = makeTestPixelData(3, 1, WHITE)
      const mask = new Uint8Array([
        0,
        128,
        255,
      ]) as AlphaMask

      blendPixelData(dst, src, {
        mask,
        maskType: MaskType.ALPHA,
        blendFn: copyBlend,
      })

      const d32 = dst.data32
      // Pixel 0: Mask 0 -> BLUE
      expect(d32[0]).toBe(BLUE)
      // Pixel 1: Mask 128 -> (255 * 128 + 128) >> 8 = 128 alpha
      expect((d32[1] >>> 24) & 0xff).toBe(128)
      // Pixel 2: Mask 255 -> Bit-perfect WHITE (The Fix!)
      expect(d32[2]).toBe(WHITE)
    })

    it('aligns mask using dx/dy and custom pitch', () => {
      const dst = makeTestPixelData(10, 10, BLUE)
      const src = makeTestPixelData(2, 2, RED)
      const mask = new Uint8Array(16).fill(0) as BinaryMask
      mask[10] = 255 // Local (2,2) of 4x4 mask

      blendPixelData(dst, src, {
        x: 5,
        y: 5,
        w: 1,
        h: 1,
        mask,
        mw: 4,
        mx: 2,
        my: 2,
        maskType: MaskType.BINARY,
      })
      expect(dst.data32[55]).toBe(RED)
    })

    it('covers the weight === 0 branch inside the mask block', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, RED)
      // weight = (effectiveM * weight + 128) >> 8
      // To hit weight === 0 while effectiveM > 0:
      // mask value 1, globalAlpha 100 -> (1 * 100 + 128) >> 8 = 0
      const mask = new Uint8Array([1]) as AlphaMask

      blendPixelData(dst, src, {
        mask,
        alpha: 100,
        maskType: MaskType.ALPHA,
      })

      // If weight === 0, dIdx increments and continues. dst remains BLUE.
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Coordinate Clipping Logic', () => {
    it('handles complex cross-clipping (negative x, sx, y, sy)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(2, 2, RED)

      // Simultaneous negative clips
      blendPixelData(dst, src, {
        x: -1,
        y: -1,
        sx: -1,
        sy: -1,
      })

      // Math: Result is a 1x1 blit of src[0,0] to dst[0,0]
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[3]).toBe(BLUE)
    })

    it('clips w/h when blit exceeds source or destination bounds', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(2, 2, RED)

      // Partial right-side/bottom-side clip
      blendPixelData(dst, src, {
        x: 1,
        y: 1,
        w: 10,
        h: 10,
      })

      expect(dst.data32[3]).toBe(RED)
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Destination Clipping (x, y) - Coverage', () => {
    it('covers clipping width from the left (x < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(2, 2, RED)

      // Drawing at x: -1.
      // Logic should: sx += 1, w -= 1, x = 0.
      blendPixelData(dst, src, {
        x: -1,
        y: 0,
      })

      // dst[0,0] gets src[1,0] (RED). dst[1,0] remains BLUE.
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(BLUE)
    })

    it('covers clipping height from the top (y < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(2, 2, RED)

      // Drawing at y: -1.
      // Logic should: sy += 1, h -= 1, y = 0.
      blendPixelData(dst, src, {
        x: 0,
        y: -1,
      })

      // dst[0,0] gets src[0,1] (RED). dst[0,1] remains BLUE.
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[2]).toBe(BLUE)
    })

    it('covers clipping from the right/bottom edge', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      const src = makeTestPixelData(5, 5, RED)

      // Draw a 5x5 square at (1,1).
      // actualW = Math.min(5, 2 - 1) = 1.
      // actualH = Math.min(5, 2 - 1) = 1.
      blendPixelData(dst, src, {
        x: 1,
        y: 1,
        w: 5,
        h: 5,
      })

      // Only dst[1,1] should be RED.
      expect(dst.data32[3]).toBe(RED)
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Precision & Re-packing', () => {
    it('prevents alpha bleed and handles weight rounding skips', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, pack(255, 0, 0, 1))
      const mockBlend = vi.fn(copyBlend)

      // 1. Skip: (1 * 100 + 128) >> 8 = 0
      blendPixelData(dst, src, {
        alpha: 100,
        blendFn: mockBlend,
      })
      expect(mockBlend).not.toHaveBeenCalled()

      // 2. Re-pack: (255 * 128 + 128) >> 8 = 128
      const src2 = makeTestPixelData(1, 1, pack(255, 255, 255, 255))
      blendPixelData(dst, src2, {
        alpha: 128,
        blendFn: mockBlend,
      })
      const callArgs = mockBlend.mock.calls[0]
      expect((callArgs[0] >>> 24) & 0xff).toBe(128)
      expect(callArgs[0] & 0x00ffffff).toBe(WHITE & 0x00ffffff)
    })
  })
  describe('Grid Checks', () => {
    const DW = 10
    const DH = 10
    const SW = 5
    const SH = 5

    it('accurately maps every pixel in a complex clipped blit', () => {
      const dst = makeTestPixelData(DW, DH, BLUE)
      const src = new PixelData(createTestImageData(SW, SH))

      const targetX = 2
      const targetY = 2
      const sourceX = 1
      const sourceY = 1
      const drawW = 3
      const drawH = 3

      blendPixelData(dst, src as any, {
        x: targetX,
        y: targetY,
        sx: sourceX,
        sy: sourceY,
        w: drawW,
        h: drawH,
        blendFn: (s) => s, // Copy mode for bit-perfect check
      })

      const d = dst.imageData.data

      for (let dy = 0; dy < DH; dy++) {
        for (let dx = 0; dx < DW; dx++) {
          const dIdx = (dy * DW + dx) * 4

          // Determine if this destination pixel is within the "Hit Zone"
          const isInsideX = dx >= targetX && dx < targetX + drawW
          const isInsideY = dy >= targetY && dy < targetY + drawH

          if (isInsideX && isInsideY) {
            // Calculate which source pixel should have landed here
            const localX = dx - targetX
            const localY = dy - targetY
            const expectedSrcX = sourceX + localX
            const expectedSrcY = sourceY + localY

            expectPixelToMatch(
              dst.imageData,
              dx,
              dy,
              expectedSrcX,
              expectedSrcY,
            )
          } else {
            // Pixel is outside the draw rect; should remain BLUE
            const val = (d[dIdx] << 0) | (d[dIdx + 1] << 8) | (d[dIdx + 2] << 16) | (d[dIdx + 3] << 24)
            expect(val >>> 0).toBe(BLUE)
          }
        }
      }
    })

    it('verifies multi-row mask alignment across every pixel', () => {
      const dst = makeTestPixelData(5, 5, 0)
      const src = new PixelData(createTestImageData(5, 5))

      // Checkered binary mask: 1 at (even, even), 0 elsewhere
      const mask = new Uint8Array(25) as BinaryMask
      for (let i = 0; i < 25; i++) {
        mask[i] = i % 2 === 0
          ? 255
          : 0
      }

      blendPixelData(dst, src as any, {
        mask,
        maskType: MaskType.BINARY,
        blendFn: (s) => s,
      })

      for (let y = 0; y < 5; y++) {
        for (let x = 0; x < 5; x++) {
          const mIdx = y * 5 + x
          const dIdx = (y * 5 + x) * 4

          if (mask[mIdx] === 255) {
            expectPixelToMatch(dst.imageData, x, y, x, y)
          } else {
            expect(dst.imageData.data[dIdx + 3]).toBe(0) // Should be empty
          }
        }
      }
    })
  })
  describe('blendPixelData - Extended Coverage', () => {
    const RED = pack(255, 0, 0, 255)
    const BLUE = pack(0, 0, 255, 255)

    it('prevents source wrap-around when draw width exceeds source bounds', () => {
      // 2x2 source, but we ask to draw 5px wide
      const src = makeTestPixelData(2, 2, RED)
      const dst = makeTestPixelData(5, 5, BLUE)

      blendPixelData(dst, src, {
        x: 0,
        y: 0,
        w: 5,
        h: 5,
        blendFn: (s) => s,
      })

      // (0,0) and (1,0) should be RED (from source row 1)
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[1]).toBe(RED)

      // (2,0) should still be BLUE because source width was only 2.
      // If stride math was wrong, this might contain pixels from source row 2.
      expect(dst.data32[2]).toBe(BLUE)
    })

    it('synchronizes source and mask offsets during negative destination clipping', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(2, 2)
      // Put RED at src(1,1)
      src.data32[3] = RED

      // 2x2 mask, only bottom-right index [3] is active
      const mask = new Uint8Array([0, 0, 0, 255]) as BinaryMask

      // We draw at x: -1, y: -1.
      // Clipping should:
      // 1. Set x: 0, y: 0
      // 2. Increase sx: 1, sy: 1 (pointing to RED)
      // 3. Increase dx: 1, dy: 1 (pointing to mask[3])
      blendPixelData(dst, src, {
        x: -1,
        y: -1,
        w: 2,
        h: 2,
        mask,
        mw: 2,
        maskType: MaskType.BINARY,
        blendFn: (s) => s,
      })

      // If everything synced, RED lands at dst(0,0)
      expect(dst.data32[0]).toBe(RED)
    })

    it('handles inverted AlphaMask with source pixels', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const src = makeTestPixelData(1, 1, RED)
      // Mask 255 inverted = 0 weight
      const mask = new Uint8Array([255]) as AlphaMask

      blendPixelData(dst, src, {
        mask,
        maskType: MaskType.ALPHA,
        invertMask: true,
      })

      // Should remain BLUE because mask was inverted to 0
      expect(dst.data32[0]).toBe(BLUE)
    })
  })
})
