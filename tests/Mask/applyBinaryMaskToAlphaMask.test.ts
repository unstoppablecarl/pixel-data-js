import { type AlphaMask, applyBinaryMaskToAlphaMask, type BinaryMask, makeAlphaMask, makeBinaryMask } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestAlphaMask, makeTestBinaryMask } from '../_helpers'

describe('applyBinaryMaskToAlphaMask', () => {
  describe('Basic Composition & Inversion', () => {
    it('clears destination pixels where the binary mask is 0', () => {
      const dst = makeTestAlphaMask(3, 1, [255, 128, 255])
      const src = makeTestBinaryMask(3, 1, [1, 0, 1])
      const opts = {
        w: 3,
        h: 1,
      }

      // 5 arguments, spread across lines
      applyBinaryMaskToAlphaMask(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
      expect(dst.data[1]).toBe(0)
      expect(dst.data[2]).toBe(255)
    })

    it('clears destination pixels where the binary mask is solid (1) when inverted', () => {
      const dst = makeTestAlphaMask(3, 1, [255, 128, 255])
      const src = makeTestBinaryMask(3, 1, [1, 0, 1])
      const opts = {
        w: 3,
        h: 1,
        invertMask: true,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(0)
      expect(dst.data[1]).toBe(128)
      expect(dst.data[2]).toBe(0)
    })

    it('works correctly when no options object is provided', () => {
      const dst = makeTestAlphaMask(2, 1, [255, 255])
      const src = makeTestBinaryMask(2, 1, [0, 1])

      // 4 arguments, spread across lines
      applyBinaryMaskToAlphaMask(
        dst,
        src,
      )

      expect(dst.data[0]).toBe(0)
      expect(dst.data[1]).toBe(255)
    })
  })

  describe('Clipping and Offsets', () => {
    it('applies the mask accurately using target coordinates (x, y)', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestBinaryMask(1, 1)
      const opts = {
        x: 1,
        y: 1,
        w: 1,
        h: 1,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
      expect(dst.data[3]).toBe(0)
    })

    it('samples accurately using source offsets (mx, my)', () => {
      const dst = makeTestAlphaMask(1, 1, 255)
      const src = makeTestBinaryMask(2, 2, [1, 1, 1, 0])
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
        src,
        opts,
      )

      expect(dst.data[0]).toBe(0)
    })
  })

  describe('Early Returns - Dimension Validations', () => {
    it('returns early if src width is 0 or less', () => {
      const dst = makeTestAlphaMask(1, 1, 255)
      const src = {
        w: 0,
        h: 1,
        data: new Uint8Array(1)
      } as BinaryMask

      applyBinaryMaskToAlphaMask(
        dst,
        src,
      )

      expect(dst.data[0]).toBe(255)
    })

    // it('returns early if src height is 0 or less', () => {
    //   const dst = makeTestAlphaMask(5, 5, 255)
    //   const src = {
    //     w: 1,
    //     h: 0,
    //     data: new Uint8Array(1)
    //   } as BinaryMask
    //
    //   applyBinaryMaskToAlphaMask(
    //     dst,
    //     src,
    //   )
    //
    //   expect(dst.data[0]).toBe(255)
    // })

    it('returns early if dst width is 0 or less', () => {
      const dst = makeTestAlphaMask(0, 0)
      const src = makeTestBinaryMask(1, 1)

      applyBinaryMaskToAlphaMask(
        dst,
        src,
      )

      expect(dst.data[0]).toBe(undefined)
    })

    it('returns early if array lengths do not permit a valid height (dstHeight <= 0)', () => {
      // dst length 1, width 2 = height 0
      const dst = {
        w: 2,
        h: 0,
        data: new Uint8Array(1).fill(255)
      } as AlphaMask

      const src = makeBinaryMask(1,1)

      applyBinaryMaskToAlphaMask(
        dst,
        src,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('returns early if array lengths do not permit a valid src height (srcHeight <= 0)', () => {
      // dst length 1, width 2 = height 0
      const src = {
        w: 2,
        h: 0,
        data: new Uint8Array(1).fill(255)
      } as BinaryMask

      const dst = makeAlphaMask(1,1)

      applyBinaryMaskToAlphaMask(
        dst,
        src,
      )

      expect(src.data[0]).toBe(255)
    })
  })

  describe('Early Returns - Destination Clipping', () => {
    it('returns early when target X is completely out of bounds', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestBinaryMask(1, 1, 0)
      const opts = {
        x: 5,
        y: 0,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('returns early when target Y is completely out of bounds (dstY0 >= dstY1)', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestBinaryMask(1, 1, 0)
      const opts = {
        x: 0,
        y: 5,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })
  })

  describe('Early Returns - Source Clipping', () => {
    it('returns early when source X offset is out of bounds', () => {
      const dst = makeTestAlphaMask(1, 1, 255)
      const src = makeTestBinaryMask(2, 2)
      const opts = {
        mx: 10,
        my: 0,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('returns early when source Y offset is out of bounds (srcY0 >= srcHeight)', () => {
      const dst = makeTestAlphaMask(1, 1, 255)
      const src = makeTestBinaryMask(2, 2)
      const opts = {
        mx: 0,
        my: 10,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('returns early when negative target X pushes the source completely off-canvas', () => {
      const dst = makeTestAlphaMask(1, 1, 255)
      const src = makeTestBinaryMask(1, 1, 0)
      const opts = {
        x: -5,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('returns early when negative target Y pushes the source completely off-canvas (srcY0 + (dstY1 - dstY0) <= 0)', () => {
      const dst = makeTestAlphaMask(1, 1, 255)
      const src = makeTestBinaryMask(1, 1, 0)
      const opts = {
        y: -5,
      }

      applyBinaryMaskToAlphaMask(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })
  })

  describe('Zero-Length Array Coverage', () => {
    it('returns early when binary mask is completely empty (length 0)', () => {
      const dst = makeTestAlphaMask(1, 1, 255)
      const src = {
        w: 1,
        h: 1,
        data: new Uint8Array(0)
      } as unknown as BinaryMask
      applyBinaryMaskToAlphaMask(
        dst,
        src,
      )

      expect(dst.data[0]).toBe(255)
    })
  })

  describe('Deep Negative Source Clipping Coverage', () => {
    it('returns early when negative mx puts the entire read area out of bounds to the left', () => {
      const dst = makeTestAlphaMask(2, 1, [255, 255])
      const src = makeTestBinaryMask(2, 1)

      const opts = {
        mx: -5,
      }

      // dstWidth: 2, srcWidth: 2
      // dstX1 - dstX0 = 2.
      // mx = -5, so srcX0 = -5.
      // srcX0 + 2 = -3. (Which is <= 0).
      applyBinaryMaskToAlphaMask(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
      expect(dst.data[1]).toBe(255)
    })

    it('returns early when negative my puts the entire read area out of bounds to the top', () => {
      // 1x2 array (width 1, height 2)
      const dst = makeTestAlphaMask(1, 2, [255, 255])
      const src = makeTestBinaryMask(1, 2)

      const opts = {
        my: -5,
      }

      // dstHeight: 2, srcHeight: 2
      // dstY1 - dstY0 = 2.
      // my = -5, so srcY0 = -5.
      // srcY0 + 2 = -3. (Which is <= 0).
      applyBinaryMaskToAlphaMask(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
      expect(dst.data[1]).toBe(255)
    })
  })
})
