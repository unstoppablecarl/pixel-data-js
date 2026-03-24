import { type AlphaMask, applyBinaryMaskToAlphaMask, type BinaryMask } from '@/index'
import { describe, expect, it } from 'vitest'

describe('applyBinaryMaskToAlphaMask', () => {
  describe('Basic Composition & Inversion', () => {
    it('clears destination pixels where the binary mask is 0', () => {
      const dst = new Uint8Array([255, 128, 255]) as AlphaMask
      const src = new Uint8Array([1, 0, 1]) as BinaryMask
      const opts = {
        w: 3,
        h: 1,
      }

      // 5 arguments, spread across lines
      applyBinaryMaskToAlphaMask(
        dst,
        3,
        src,
        3,
        opts,
      )

      expect(dst[0]).toBe(255)
      expect(dst[1]).toBe(0)
      expect(dst[2]).toBe(255)
    })

    it('clears destination pixels where the binary mask is solid (1) when inverted', () => {
      const dst = new Uint8Array([255, 128, 255]) as AlphaMask
      const src = new Uint8Array([1, 0, 1]) as BinaryMask
      const opts = {
        w: 3,
        h: 1,
        invertMask: true,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        3,
        src,
        3,
        opts,
      )

      expect(dst[0]).toBe(0)
      expect(dst[1]).toBe(128)
      expect(dst[2]).toBe(0)
    })

    it('works correctly when no options object is provided', () => {
      const dst = new Uint8Array([255, 255]) as AlphaMask
      const src = new Uint8Array([0, 1]) as BinaryMask

      // 4 arguments, spread across lines
      applyBinaryMaskToAlphaMask(
        dst,
        2,
        src,
        2,
      )

      expect(dst[0]).toBe(0)
      expect(dst[1]).toBe(255)
    })
  })

  describe('Clipping and Offsets', () => {
    it('applies the mask accurately using target coordinates (x, y)', () => {
      const dst = new Uint8Array(4).fill(255) as AlphaMask
      const src = new Uint8Array([0]) as BinaryMask
      const opts = {
        x: 1,
        y: 1,
        w: 1,
        h: 1,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        2,
        src,
        1,
        opts,
      )

      expect(dst[0]).toBe(255)
      expect(dst[3]).toBe(0)
    })

    it('samples accurately using source offsets (mx, my)', () => {
      const dst = new Uint8Array([255]) as AlphaMask
      const src = new Uint8Array([1, 1, 1, 0]) as BinaryMask
      const opts = {
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        mx: 1,
        my: 1,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        1,
        src,
        2,
        opts,
      )

      expect(dst[0]).toBe(0)
    })
  })

  describe('Early Returns - Dimension Validations', () => {
    it('returns early if widths are 0 or less', () => {
      const dst = new Uint8Array([255]) as AlphaMask
      const src = new Uint8Array([0]) as BinaryMask

      applyBinaryMaskToAlphaMask(
        dst,
        0,
        src,
        1,
      )

      expect(dst[0]).toBe(255)

      applyBinaryMaskToAlphaMask(
        dst,
        1,
        src,
        0,
      )

      expect(dst[0]).toBe(255)
    })

    it('returns early if array lengths do not permit a valid height (srcHeight <= 0)', () => {
      // dst length 1, width 2 = height 0
      const dst = new Uint8Array([255]) as AlphaMask
      const src = new Uint8Array([0]) as BinaryMask

      applyBinaryMaskToAlphaMask(
        dst,
        2,
        src,
        1,
      )

      expect(dst[0]).toBe(255)

      // src length 1, width 2 = height 0
      const dst2 = new Uint8Array([255]) as AlphaMask

      applyBinaryMaskToAlphaMask(
        dst2,
        1,
        src,
        2,
      )

      expect(dst2[0]).toBe(255)
    })
  })

  describe('Early Returns - Destination Clipping', () => {
    it('returns early when target X is completely out of bounds', () => {
      const dst = new Uint8Array(4).fill(255) as AlphaMask
      const src = new Uint8Array([0]) as BinaryMask
      const opts = {
        x: 5,
        y: 0,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        2,
        src,
        1,
        opts,
      )

      expect(dst[0]).toBe(255)
    })

    it('returns early when target Y is completely out of bounds (dstY0 >= dstY1)', () => {
      const dst = new Uint8Array(4).fill(255) as AlphaMask
      const src = new Uint8Array([0]) as BinaryMask
      const opts = {
        x: 0,
        y: 5,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        2,
        src,
        1,
        opts,
      )

      expect(dst[0]).toBe(255)
    })
  })

  describe('Early Returns - Source Clipping', () => {
    it('returns early when source X offset is out of bounds', () => {
      const dst = new Uint8Array([255]) as AlphaMask
      const src = new Uint8Array(4).fill(0) as BinaryMask
      const opts = {
        mx: 10,
        my: 0,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        1,
        src,
        2,
        opts,
      )

      expect(dst[0]).toBe(255)
    })

    it('returns early when source Y offset is out of bounds (srcY0 >= srcHeight)', () => {
      const dst = new Uint8Array([255]) as AlphaMask
      const src = new Uint8Array(4).fill(0) as BinaryMask
      const opts = {
        mx: 0,
        my: 10,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        1,
        src,
        2,
        opts,
      )

      expect(dst[0]).toBe(255)
    })

    it('returns early when negative target X pushes the source completely off-canvas', () => {
      const dst = new Uint8Array([255]) as AlphaMask
      const src = new Uint8Array([0]) as BinaryMask
      const opts = {
        x: -5,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        1,
        src,
        1,
        opts,
      )

      expect(dst[0]).toBe(255)
    })

    it('returns early when negative target Y pushes the source completely off-canvas (srcY0 + (dstY1 - dstY0) <= 0)', () => {
      const dst = new Uint8Array([255]) as AlphaMask
      const src = new Uint8Array([0]) as BinaryMask
      const opts = {
        y: -5,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        1,
        src,
        1,
        opts,
      )

      expect(dst[0]).toBe(255)
    })
  })
  describe('Zero-Length Array Coverage', () => {
    it('returns early when binary mask is completely empty (length 0)', () => {
      const dst = new Uint8Array([255]) as AlphaMask
      const src = new Uint8Array([]) as BinaryMask

      // 4 arguments, so they are broken onto multiple lines
      applyBinaryMaskToAlphaMask(
        dst,
        1,
        src,
        1,
      )

      expect(dst[0]).toBe(255)
    })
  })

  describe('Deep Negative Source Clipping Coverage', () => {
    it('returns early when negative mx puts the entire read area out of bounds to the left', () => {
      const dst = new Uint8Array([255, 255]) as AlphaMask
      const src = new Uint8Array([1, 1]) as BinaryMask

      const opts = {
        mx: -5,
      }

      // dstWidth: 2, srcWidth: 2
      // dstX1 - dstX0 = 2.
      // mx = -5, so srcX0 = -5.
      // srcX0 + 2 = -3. (Which is <= 0).
      applyBinaryMaskToAlphaMask(
        dst,
        2,
        src,
        2,
        opts,
      )

      expect(dst[0]).toBe(255)
      expect(dst[1]).toBe(255)
    })

    it('returns early when negative my puts the entire read area out of bounds to the top', () => {
      // 1x2 array (width 1, height 2)
      const dst = new Uint8Array([255, 255]) as AlphaMask
      const src = new Uint8Array([1, 1]) as BinaryMask

      const opts = {
        my: -5,
      }

      // dstHeight: 2, srcHeight: 2
      // dstY1 - dstY0 = 2.
      // my = -5, so srcY0 = -5.
      // srcY0 + 2 = -3. (Which is <= 0).
      applyBinaryMaskToAlphaMask(
        dst,
        1,
        src,
        1,
        opts,
      )

      expect(dst[0]).toBe(255)
      expect(dst[1]).toBe(255)
    })
  })
})
