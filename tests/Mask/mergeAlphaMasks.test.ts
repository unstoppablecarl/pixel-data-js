import { mergeAlphaMasks } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestAlphaMask } from '../_helpers'

describe('mergeAlphaMasks', () => {
  describe('Basic Composition & Identity', () => {
    it('multiplies two AlphaMasks correctly (Rounding & Identity)', () => {
      const dst = makeTestAlphaMask(3, 1, [255, 255, 255])
      const src = makeTestAlphaMask(3, 1, [0, 128, 255])

      const opts = {
        w: 3,
        h: 1,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(0)
      expect(dst.data[1]).toBe(128)
      expect(dst.data[2]).toBe(255)
    })

    it('calculates intersection of partial transparency', () => {
      const dst = makeTestAlphaMask(1, 1, [128])
      const src = makeTestAlphaMask(1, 1, [128])

      const opts = {
        w: 1,
        h: 1,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(64)
    })

    it('skips calculation when destination is already transparent (da === 0)', () => {
      const dst = makeTestAlphaMask(1, 1)
      const src = makeTestAlphaMask(1, 1, 255)
      const opts = {
        x: 0,
        y: 0,
        w: 1,
        h: 1,
        alpha: 255,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(0)
    })

    it('preserves transparency when merging partial masks into transparent areas', () => {
      const dst = makeTestAlphaMask(2, 1, [0, 255])
      const src = makeTestAlphaMask(2, 1, [128, 128])

      const opts = {
        w: 2,
        h: 1,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(0)
      expect(dst.data[1]).toBe(128)
    })
  })

  describe('Global Alpha Interactions', () => {
    it('respects global alpha during merge (Soft Intersection)', () => {
      const dst = makeTestAlphaMask(1, 1, 255)
      const src = makeTestAlphaMask(1, 1, 255)

      const opts = {
        w: 1,
        h: 1,
        alpha: 128,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(128)
    })

    it('correctly intersects partial masks with global alpha', () => {
      const dst = makeTestAlphaMask(1, 1, 200)
      const src = makeTestAlphaMask(1, 1, 150)
      const globalAlpha = 100
      const opts = {
        w: 1,
        h: 1,
        alpha: globalAlpha,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(46)
    })

    it('clears destination when resulting weight is 0', () => {
      const dst = makeTestAlphaMask(1, 1, 255)
      const src = makeTestAlphaMask(1, 1, 1)
      const opts = {
        w: 1,
        h: 1,
        alpha: 100,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(0)
    })
  })

  describe('Inversion', () => {
    it('accurately inverts AlphaMask values (The 191 Fix)', () => {
      const dst = makeTestAlphaMask(1, 1, 255)
      const src = makeTestAlphaMask(1, 1, 64)
      const opts = {
        w: 1,
        h: 1,
        invertMask: true,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(191)
    })
  })

  describe('Bounds and Early Returns', () => {
    it('returns early when width is 0 or less', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestAlphaMask(2, 2, 0)
      const opts = {
        w: 0,
        h: 2,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('returns early when height is 0 or less', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestAlphaMask(2, 2, 0)
      const opts = {
        w: 2,
        h: -1,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('returns early when global alpha is 0', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestAlphaMask(2, 2, 0)
      const opts = {
        w: 2,
        h: 2,
        alpha: 0,
      }

      mergeAlphaMasks(
        dst,
        src,

        opts,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('prevents out-of-bounds writes when clipping an inner area', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestAlphaMask(2, 2, 0)
      const opts = {
        x: 1,
        y: 1,
        w: 2,
        h: 2,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[3]).toBe(0)
      expect(dst.data[0]).toBe(255)
    })

    it('safely clips negative target coordinates before iterating', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestAlphaMask(2, 2, 0)
      const opts = {
        x: 0,
        y: -1,
        w: 2,
        h: 2,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(0)
      expect(dst.data[1]).toBe(0)
      expect(dst.data[2]).toBe(255)
      expect(dst.data[3]).toBe(255)

      const dst2 = makeTestAlphaMask(1, 1, 255)
      const opts2 = {
        x: 0,
        y: 0,
        my: -1,
        w: 1,
        h: 1,
      }

      mergeAlphaMasks(
        dst2,
        src,
        opts2,
      )

      expect(dst2.data[0]).toBe(255)
    })
  })

  describe('Horizontal Bounds Clipping (startX >= endX)', () => {
    it('returns early when target X is entirely past the right edge of destination', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestAlphaMask(2, 2, 0)
      const opts = {
        x: 2,
        w: 2,
        h: 2,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('returns early when source offset X is entirely past the right edge of source', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestAlphaMask(2, 2, 0)
      const opts = {
        w: 2,
        h: 2,
        mx: 5,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('returns early when negative target X completely negates the requested width', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestAlphaMask(2, 2, 0)
      const opts = {
        x: -5,
        w: 2,
        h: 2,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })
  })

  describe('Vertical Bounds Clipping (startY >= endY)', () => {
    it('returns early when target Y is entirely past the bottom edge of destination', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestAlphaMask(2, 2, 0)
      const opts = {
        y: 2,
        w: 2,
        h: 2,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('returns early when source offset Y is entirely past the bottom edge of source', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestAlphaMask(2, 2, 0)
      const opts = {
        w: 2,
        h: 2,
        my: 5,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })

    it('returns early when negative target Y completely negates the requested height', () => {
      const dst = makeTestAlphaMask(2, 2, 255)
      const src = makeTestAlphaMask(2, 2, 0)
      const opts = {
        y: -5,
        w: 2,
        h: 2,
      }

      mergeAlphaMasks(
        dst,
        src,
        opts,
      )

      expect(dst.data[0]).toBe(255)
    })
  })
})
