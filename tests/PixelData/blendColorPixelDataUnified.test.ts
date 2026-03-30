import {
  blendColorPixelData,
  blendColorPixelDataAlphaMask,
  blendColorPixelDataBinaryMask,
  type Color32,
  makeAlphaMask,
  makeBinaryMask,
  sourceOverFast,
  unpackColor,
} from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { makeTestPixelData, pack } from '../_helpers'

const RED = pack(255, 0, 0, 255)
const BLUE = pack(0, 0, 255, 255)
const WHITE = pack(255, 255, 255, 255)
const TRANSPARENT = pack(0, 0, 0, 0)
const copyBlend = (s: Color32) => s

// Create solid masks that won't interfere with standard color blending
const SOLID_BINARY = makeBinaryMask(20, 20)
SOLID_BINARY.data.fill(1)

const SOLID_ALPHA = makeAlphaMask(20, 20)
SOLID_ALPHA.data.fill(255)

const testVariants = [
  { name: 'No Mask', fn: blendColorPixelData, maskOpts: {} },
  {
    name: 'Binary Mask', fn: (d: any, s: any, opts: any) => {
      blendColorPixelDataBinaryMask(d, s, opts.mask, opts)
    }, maskOpts: { mask: SOLID_BINARY },
  },
  {
    name: 'Alpha Mask', fn: (d: any, s: any, opts: any) => {
      blendColorPixelDataAlphaMask(d, s, opts.mask, opts)
    }, maskOpts: { mask: SOLID_ALPHA },
  },
]

describe.each(testVariants)('Unified: blendColorPixelData ($name)', ({ fn, maskOpts }) => {
  describe('Guard Conditions & Early Exits', () => {
    it('skips all work for invalid globalAlpha or out-of-bounds targets', () => {
      const dst = makeTestPixelData(1, 1, BLUE)

      fn(dst, RED, { ...maskOpts, alpha: 0 })
      fn(dst, RED, { ...maskOpts, x: 10, y: 10 })

      expect(dst.data32[0]).toBe(BLUE)
    })

    it('bypasses blendFn for transparent source pixels', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const mockBlend = vi.fn(sourceOverFast)

      fn(dst, TRANSPARENT, { ...maskOpts, blendFn: mockBlend })

      expect(mockBlend).not.toHaveBeenCalled()
    })
  })

  describe('Coordinate Clipping Logic', () => {
    it('handles negative x, y offsets', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      fn(dst, RED, { ...maskOpts, x: -1, y: -1, w: 2, h: 2 })
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[3]).toBe(BLUE)
    })

    it('covers clipping height from the top (y < 0)', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      fn(dst, RED, { ...maskOpts, x: 0, y: -1, w: 2, h: 2 })
      expect(dst.data32[0]).toBe(RED)
      expect(dst.data32[2]).toBe(BLUE)
    })

    it('covers clipping from the right/bottom edge', () => {
      const dst = makeTestPixelData(2, 2, BLUE)
      fn(dst, RED, { ...maskOpts, x: 1, y: 1, w: 10, h: 10 })
      expect(dst.data32[3]).toBe(RED)
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Precision & Wrapping', () => {
    it('prevents alpha bleed and handles globalAlpha rounding', () => {
      const dst = makeTestPixelData(1, 1, BLUE)
      const color = pack(255, 0, 0, 1)
      const mockBlend = vi.fn(copyBlend)

      // Alpha of 100 on a source alpha of 1 rounds to 0
      fn(dst, color, { ...maskOpts, alpha: 100, blendFn: mockBlend })
      expect(mockBlend).not.toHaveBeenCalled()

      fn(dst, WHITE, { ...maskOpts, alpha: 128, blendFn: mockBlend })
      const callArgs = mockBlend.mock.calls[0]
      const argColor = callArgs[0] as Color32
      const rgba = unpackColor(argColor)

      expect(rgba).toEqual({ r: 255, g: 255, b: 255, a: 128 })
    })

    it('prevents memory wrap-around when width exceeds destination', () => {
      const dst = makeTestPixelData(3, 3, BLUE)
      fn(dst, RED, { ...maskOpts, x: 1, y: 1, w: 10, h: 1, blendFn: copyBlend })
      expect(dst.data32[4]).toBe(RED)
      expect(dst.data32[5]).toBe(RED)
      expect(dst.data32[6]).toBe(BLUE)
    })
  })
})
