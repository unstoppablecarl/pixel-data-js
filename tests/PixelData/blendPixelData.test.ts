import {
  describe,
  expect,
  it,
  vi,
} from 'vitest'

import {
  type AlphaMask,
  type BinaryMask,
  blendPixelData, type Color32,
  MaskType,
  sourceOverColor32,
} from '../../src'
import { PixelData } from '../../src/PixelData'


const pack = (
  r: number,
  g: number,
  b: number,
  a: number,
): Color32 => ((a << 24) | (b << 16) | (g << 8) | r) >>> 0 as Color32

describe('blendPixelData - Comprehensive Coverage', () => {
  const createImg = (
    w: number,
    h: number,
    fill: number = 0,
  ) => {
    const data = new Uint8ClampedArray(w * h * 4)
    const img = new PixelData({
      width: w,
      height: h,
      data,
    })
    if (fill !== 0) {
      img.data32.fill(fill)
    }
    return img
  }

  const RED = pack(255, 0, 0, 255)
  const BLUE = pack(0, 0, 255, 255)
  const TRANSPARENT = pack(0, 0, 0, 0)

  describe('Boundary & Guard Conditions', () => {
    it('early exits if globalAlpha is 0', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, RED)
      blendPixelData(dst, src, { alpha: 0 })
      expect(dst.data32[0]).toBe(BLUE)
    })

    it('early exits if destination is fully out of bounds', () => {
      const dst = createImg(2, 2, BLUE)
      const src = createImg(2, 2, RED)
      blendPixelData(dst, src, {
        x: 10,
        y: 10,
      })
      expect(dst.data32[0]).toBe(BLUE)
    })
  })

  describe('Masking Logic (All Branches)', () => {
    it('skips pixels when BinaryMask is 0', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, RED)
      const mask = new Uint8Array([0]) as BinaryMask
      blendPixelData(dst, src, {
        mask,
        maskType: MaskType.BINARY,
      })
      expect(dst.data32[0]).toBe(BLUE)
    })

    it('skips pixels when AlphaMask weight becomes 0', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, RED)
      const mask = new Uint8Array([1]) as AlphaMask
      // Math check: (1 * 100 + 128) = 228. 228 >> 8 = 0.
      blendPixelData(dst, src, {
        mask,
        alpha: 100,
        maskType: MaskType.ALPHA,
      })
      expect(dst.data32[0]).toBe(BLUE)
    })

    it('correctly processes inverted AlphaMask', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, RED)
      // 255 inverted is 0
      const mask = new Uint8Array([255]) as AlphaMask
      blendPixelData(dst, src, {
        mask,
        invertMask: true,
        maskType: MaskType.ALPHA,
      })
      expect(dst.data32[0]).toBe(BLUE)
    })

    it('aligns mask using dx/dy math relative to targetX/Y', () => {
      const dst = createImg(10, 10, BLUE)
      const src = createImg(2, 2, RED)
      const mask = new Uint8Array(100).fill(0) as BinaryMask
      // Set mask pixel at local (0,0) of the draw operation
      mask[0] = 255
      blendPixelData(dst, src, {
        x: 5,
        y: 5,
        w: 1,
        h: 1,
        mask,
        maskType: MaskType.BINARY,
      })
      // dst[5,5] (index 55) should be RED
      expect(dst.data32[55]).toBe(RED)
    })
  })

  describe('Pixel Optimization Branches', () => {
    it('skips pixels with sa === 0', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, TRANSPARENT)
      const mockBlend = vi.fn(sourceOverColor32)
      blendPixelData(dst, src, { blendFn: mockBlend })
      expect(mockBlend).not.toHaveBeenCalled()
    })

    it('re-packs color only when weight < 255', () => {
      const dst = createImg(1, 1, BLUE)
      const src = createImg(1, 1, RED)
      const mockBlend = vi.fn((s) => s)
      blendPixelData(dst, src, {
        alpha: 255,
        blendFn: mockBlend,
      })
      // Should receive original RED (4278190335)
      expect(mockBlend.mock.calls[0][0]).toBe(RED)
    })
  })
})
