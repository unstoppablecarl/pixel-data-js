import { type BinaryMask, mergeBinaryMasks } from '@/index'
import { describe, expect, it } from 'vitest'

describe('mergeBinaryMasks', () => {
  describe('Basic Composition', () => {
    it('clears destination pixels where the source is 0', () => {
      const dst = new Uint8Array([1, 1, 1]) as BinaryMask
      const src = new Uint8Array([1, 0, 1]) as BinaryMask
      const opts = {
        w: 3,
        h: 1,
      }

      // 5 arguments, so they are broken onto multiple lines
      mergeBinaryMasks(
        dst,
        3,
        src,
        3,
        opts,
      )

      expect(dst[0]).toBe(1)
      expect(dst[1]).toBe(0)
      expect(dst[2]).toBe(1)
    })

    it('clears destination pixels where the source is 1 (Inverted)', () => {
      const dst = new Uint8Array([1, 1, 1]) as BinaryMask
      const src = new Uint8Array([1, 0, 1]) as BinaryMask
      const opts = {
        w: 3,
        h: 1,
        invertMask: true,
      }

      mergeBinaryMasks(
        dst,
        3,
        src,
        3,
        opts,
      )

      expect(dst[0]).toBe(0)
      expect(dst[1]).toBe(1)
      expect(dst[2]).toBe(0)
    })
  })

  describe('Destination Clipping', () => {
    it('clips the merge area to the destination width', () => {
      const dst = new Uint8Array(4).fill(1) as BinaryMask
      const src = new Uint8Array(4).fill(0) as BinaryMask
      const opts = {
        x: 1,
        y: 0,
        w: 2,
        h: 1,
      }

      // dst is 2x2. x=1, w=2 should clip to only affect dst[1].
      mergeBinaryMasks(
        dst,
        2,
        src,
        2,
        opts,
      )

      expect(dst[0]).toBe(1)
      expect(dst[1]).toBe(0)
      expect(dst[2]).toBe(1)
    })

    it('returns early when target coordinates are entirely out of bounds', () => {
      const dst = new Uint8Array(4).fill(1) as BinaryMask
      const src = new Uint8Array(1).fill(0) as BinaryMask
      const opts = {
        x: 10,
        y: 10,
        w: 1,
        h: 1,
      }

      mergeBinaryMasks(
        dst,
        2,
        src,
        1,
        opts,
      )

      expect(dst[0]).toBe(1)
    })
  })

  describe('Source Clipping (Double Clipping)', () => {
    it('clips the merge area to the source mask boundaries', () => {
      const dst = new Uint8Array(4).fill(1) as BinaryMask
      const src = new Uint8Array(1).fill(0) as BinaryMask
      const opts = {
        x: 0,
        y: 0,
        w: 2,
        h: 2,
      }

      // Source is only 1x1. w=2, h=2 should be clipped to 1x1.
      mergeBinaryMasks(
        dst,
        2,
        src,
        1,
        opts,
      )

      expect(dst[0]).toBe(0)
      expect(dst[1]).toBe(1)
      expect(dst[2]).toBe(1)
    })

    it('handles source offsets (mx, my) to overlap the last source pixel onto the first destination pixel', () => {
      const dst = new Uint8Array(4).fill(1) as BinaryMask
      const src = new Uint8Array(4).fill(0) as BinaryMask
      const opts = {
        mx: 1,
        my: 1,
        w: 1,
        h: 1,
      }

      // 5 arguments, so they are broken onto multiple lines
      mergeBinaryMasks(
        dst,
        2,
        src,
        2,
        opts,
      )

      // src[1,1] (last pixel) hits dst[0,0] (first pixel)
      expect(dst[0]).toBe(0)
      // Other pixels remain untouched
      expect(dst[1]).toBe(1)
      expect(dst[3]).toBe(1)
    })

    it('handles negative source offsets by shifting the destination start forward', () => {
      const dst = new Uint8Array(4).fill(1) as BinaryMask
      const src = new Uint8Array(4).fill(0) as BinaryMask
      const opts = {
        mx: -1,
        my: -1,
        w: 2,
        h: 2,
      }

      mergeBinaryMasks(
        dst,
        2,
        src,
        2,
        opts,
      )

      // src[0,0] aligns with dst[1,1] because of the 1-pixel shift
      expect(dst[3]).toBe(0)
      expect(dst[0]).toBe(1)
    })

    it('returns early if safe overlap results in zero width', () => {
      const dst = new Uint8Array(4).fill(1) as BinaryMask
      const src = new Uint8Array(4).fill(0) as BinaryMask
      const opts = {
        mx: 2,
        w: 2,
        h: 2,
      }

      // mx: 2 on a srcWidth: 2 results in 0 safe width
      mergeBinaryMasks(
        dst,
        2,
        src,
        2,
        opts,
      )

      expect(dst[0]).toBe(1)
    })
  })

  describe('Edge Cases & Dimension Guards', () => {
    it('returns early if width or height is 0', () => {
      const dst = new Uint8Array(1).fill(1) as BinaryMask
      const src = new Uint8Array(1).fill(0) as BinaryMask
      const optsW = {
        w: 0,
        h: 1,
      }
      const optsH = {
        w: 1,
        h: 0,
      }

      mergeBinaryMasks(
        dst,
        1,
        src,
        1,
        optsW,
      )
      expect(dst[0]).toBe(1)

      mergeBinaryMasks(
        dst,
        1,
        src,
        1,
        optsH,
      )
      expect(dst[0]).toBe(1)
    })

    it('returns early if source width or destination width is invalid', () => {
      const dst = new Uint8Array(1).fill(1) as BinaryMask
      const src = new Uint8Array(1).fill(0) as BinaryMask
      const opts = {
        w: 1,
        h: 1,
      }

      mergeBinaryMasks(
        dst,
        0,
        src,
        1,
        opts,
      )
      expect(dst[0]).toBe(1)

      mergeBinaryMasks(
        dst,
        1,
        src,
        -1,
        opts,
      )
      expect(dst[0]).toBe(1)
    })
  })

  describe('Destination Negative Clipping (x < 0, y < 0)', () => {
    it('clips negative x and reduces width (x < 0 branch)', () => {
      const dst = new Uint8Array([1, 1]) as BinaryMask
      // Source: [solid, clear]
      const src = new Uint8Array([1, 0]) as BinaryMask
      const opts = {
        x: -1,
        w: 2,
        h: 1,
      }

      // If x is -1 and w is 2:
      // Clipping results in x=0, w=1.
      // Sampling start moves to mx=1.
      // src[1] (the 0) should clear dst[0].
      mergeBinaryMasks(
        dst,
        2,
        src,
        2,
        opts,
      )

      expect(dst[0]).toBe(0)
      expect(dst[1]).toBe(1)
    })

    it('clips negative y and reduces height (y < 0 branch)', () => {
      const dst = new Uint8Array([1, 1]) as BinaryMask
      const dw = 1
      // Source: [solid, clear] (vertical)
      const src = new Uint8Array([1, 0]) as BinaryMask
      const sw = 1
      const opts = {
        y: -1,
        w: 1,
        h: 2,
      }

      // If y is -1 and h is 2:
      // Clipping results in y=0, h=1.
      // Sampling start moves to my=1.
      // src[1] (the 0 on row 2) should clear dst[0].
      mergeBinaryMasks(
        dst,
        dw,
        src,
        sw,
        opts,
      )

      expect(dst[0]).toBe(0)
      expect(dst[1]).toBe(1)
    })
  })

  it('returns early when the vertical overlap results in zero height (finalH <= 0)', () => {
    const dst = new Uint8Array([1, 1]) as BinaryMask
    const dw = 1
    const src = new Uint8Array([0, 0]) as BinaryMask
    const sw = 1
    const opts = {
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      mx: 0,
      my: 2,
    }

    // 5 arguments, so it must be multi-line
    // my: 2 on a 2-pixel high source with h: 1 results in finalH: 0
    mergeBinaryMasks(
      dst,
      dw,
      src,
      sw,
      opts,
    )

    expect(dst[0]).toBe(1)
    expect(dst[1]).toBe(1)
  })
})
