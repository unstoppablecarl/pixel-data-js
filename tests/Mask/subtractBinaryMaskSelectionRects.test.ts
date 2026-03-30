import { type BinaryMask, MaskType, type SelectionRect } from '@/_types'
import { subtractBinaryMaskSelectionRects } from '@/Mask/subtractBinaryMaskSelectionRects'
import { describe, expect, it } from 'vitest'
import { makeTestBinaryMask } from '../_helpers'

/** Fully-selected rect (mask === null) */
function full(x: number, y: number, w: number, h: number): SelectionRect<BinaryMask | null> {
  return { x, y, w, h, mask: null }
}

/** Rect with an explicit mask */
function partial(
  x: number, y: number, w: number, h: number,
  pixels: number | number[] = 1,
): SelectionRect<BinaryMask | null> {
  return { x, y, w, h, mask: makeTestBinaryMask(w, h, pixels) }
}

describe('subtractBinaryMaskSelectionRects', () => {

  describe('empty inputs', () => {
    it('returns [] when current is empty', () => {
      expect(subtractBinaryMaskSelectionRects([], [full(0, 0, 10, 10)])).toEqual([])
    })

    it('returns current unchanged when subtracting is empty', () => {
      const rects = [full(0, 0, 10, 10), full(20, 20, 5, 5)]
      expect(subtractBinaryMaskSelectionRects(rects, [])).toEqual(rects)
    })

    it('returns [] when both arrays are empty', () => {
      expect(subtractBinaryMaskSelectionRects([], [])).toEqual([])
    })
  })

// ---------------------------------------------------------------------------
// No intersection — rects must pass through unchanged
// ---------------------------------------------------------------------------

  describe('no intersection', () => {
    it('preserves rect entirely to the left of sub', () => {
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], [full(20, 0, 10, 10)])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 10, h: 10, mask: null })
    })

    it('preserves rect entirely to the right of sub', () => {
      const result = subtractBinaryMaskSelectionRects([full(30, 0, 10, 10)], [full(0, 0, 10, 10)])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 30, y: 0, w: 10, h: 10 })
    })

    it('preserves rect entirely above sub', () => {
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], [full(0, 20, 10, 10)])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 10, h: 10 })
    })

    it('preserves rect entirely below sub', () => {
      const result = subtractBinaryMaskSelectionRects([full(0, 30, 10, 10)], [full(0, 0, 10, 10)])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 30, w: 10, h: 10 })
    })

    it('treats touching edges (no overlap) as non-intersecting', () => {
      // sub right edge == r left edge → ix2 == ix → no overlap
      const result = subtractBinaryMaskSelectionRects([full(10, 0, 10, 10)], [full(0, 0, 10, 10)])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 10, y: 0, w: 10, h: 10 })
    })
  })

// ---------------------------------------------------------------------------
// Full containment (sub swallows r entirely) → rect disappears
// ---------------------------------------------------------------------------

  describe('full containment', () => {
    it('removes a fully-selected rect when completely contained', () => {
      const result = subtractBinaryMaskSelectionRects([full(5, 5, 10, 10)], [full(0, 0, 20, 20)])
      expect(result).toHaveLength(0)
    })

    it('removes a partial-mask rect when completely contained', () => {
      const result = subtractBinaryMaskSelectionRects([partial(5, 5, 4, 4)], [full(0, 0, 20, 20)])
      expect(result).toHaveLength(0)
    })

    it('removes rect that shares exact boundary with sub', () => {
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], [full(0, 0, 10, 10)])
      expect(result).toHaveLength(0)
    })
  })

// ---------------------------------------------------------------------------
// Single-piece outputs (three sides of sub land outside r)
// ---------------------------------------------------------------------------

  describe('top piece only', () => {
    // sub covers the bottom portion of r
    it('produces only a top piece when sub clips from bottom', () => {
      // r: (0,0,10,10), sub: (0,6,10,10) → intersection iy=6 iy2=10
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], [full(0, 6, 10, 10)])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 10, h: 6 })
    })
  })

  describe('bottom piece only', () => {
    it('produces only a bottom piece when sub clips from top', () => {
      // r: (0,0,10,10), sub: (0,-10,10,14) → iy=0, iy2=4
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], [full(0, -10, 10, 14)])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 4, w: 10, h: 6 })
    })
  })

  describe('left piece only', () => {
    it('produces only a left piece when sub clips from the right', () => {
      // r: (0,0,10,10), sub: (7,0,10,10) → ix=7, iy=0, ix2=10, iy2=10
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], [full(7, 0, 10, 10)])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 7, h: 10 })
    })
  })

  describe('right piece only', () => {
    it('produces only a right piece when sub clips from the left', () => {
      // r: (0,0,10,10), sub: (-5,0,8,10) → ix=0, iy=0, ix2=3, iy2=10
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], [full(-5, 0, 8, 10)])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 3, y: 0, w: 7, h: 10 })
    })
  })

// ---------------------------------------------------------------------------
// All four pieces at once (sub punches a hole in the interior of r)
// ---------------------------------------------------------------------------

  describe('all four pieces', () => {
    // r: (0,0,12,12), sub: (3,3,6,6)
    // top: y=0..3, bottom: y=9..12, left: x=0..3 y=3..9, right: x=9..12 y=3..9
    const r = full(0, 0, 12, 12)
    const sub = full(3, 3, 6, 6)

    it('produces exactly 4 pieces', () => {
      const result = subtractBinaryMaskSelectionRects([r], [sub])
      expect(result).toHaveLength(4)
    })

    it('top piece has correct geometry', () => {
      const result = subtractBinaryMaskSelectionRects([r], [sub])
      const top = result.find(p => p.y === 0 && p.h === 3)
      expect(top).toMatchObject({ x: 0, y: 0, w: 12, h: 3 })
    })

    it('bottom piece has correct geometry', () => {
      const result = subtractBinaryMaskSelectionRects([r], [sub])
      const bottom = result.find(p => p.y === 9)
      expect(bottom).toMatchObject({ x: 0, y: 9, w: 12, h: 3 })
    })

    it('left piece has correct geometry', () => {
      const result = subtractBinaryMaskSelectionRects([r], [sub])
      const left = result.find(p => p.x === 0 && p.y === 3)
      expect(left).toMatchObject({ x: 0, y: 3, w: 3, h: 6 })
    })

    it('right piece has correct geometry', () => {
      const result = subtractBinaryMaskSelectionRects([r], [sub])
      const right = result.find(p => p.x === 9 && p.y === 3)
      expect(right).toMatchObject({ x: 9, y: 3, w: 3, h: 6 })
    })
  })

// ---------------------------------------------------------------------------
// mask: null propagation (fully-selected source)
// ---------------------------------------------------------------------------

  describe('null mask propagation', () => {
    it('pieces from a null-mask rect also have mask: null', () => {
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 12, 12)], [full(3, 3, 6, 6)])
      expect(result).toHaveLength(4)
      result.forEach(piece => expect(piece.mask).toBeNull())
    })

    it('non-intersecting null-mask rect keeps mask: null', () => {
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 5, 5)], [full(10, 10, 5, 5)])
      expect(result[0].mask).toBeNull()
    })
  })

// ---------------------------------------------------------------------------
// Partial mask: pixel data is correctly extracted into each piece
// ---------------------------------------------------------------------------

  describe('partial mask extraction', () => {
    // 4x4 source, pixels numbered 0-15 for easy verification
    //  0  1  2  3
    //  4  5  6  7
    //  8  9 10 11
    // 12 13 14 15
    const src = partial(0, 0, 4, 4, Array.from({ length: 16 }, (_, i) => i))

    it('top piece contains correct rows', () => {
      // sub clips bottom 2 rows → top piece is top 2 rows (y=0..2)
      const [piece] = subtractBinaryMaskSelectionRects([src], [full(0, 2, 4, 2)])
      expect(piece).toMatchObject({ x: 0, y: 0, w: 4, h: 2 })
      expect(Array.from(piece.mask!.data)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    })

    it('bottom piece contains correct rows', () => {
      // sub clips top 2 rows → bottom piece is rows 2-3
      const [piece] = subtractBinaryMaskSelectionRects([src], [full(0, 0, 4, 2)])
      expect(piece).toMatchObject({ x: 0, y: 2, w: 4, h: 2 })
      expect(Array.from(piece.mask!.data)).toEqual([8, 9, 10, 11, 12, 13, 14, 15])
    })

    it('left piece contains correct columns', () => {
      // sub covers x=2..4, y=1..3 → left piece: x=0..2, y=1..3
      const result = subtractBinaryMaskSelectionRects([src], [full(2, 1, 2, 2)])
      const left = result.find(p => p.x === 0 && p.y === 1 && p.w === 2)!
      expect(left).toMatchObject({ x: 0, y: 1, w: 2, h: 2 })
      // row 1 cols 0-1: pixels 4,5; row 2 cols 0-1: pixels 8,9
      expect(Array.from(left.mask!.data)).toEqual([4, 5, 8, 9])
    })

    it('right piece contains correct columns', () => {
      // sub covers x=0..2, y=1..3 → right piece: x=2..4, y=1..3
      const result = subtractBinaryMaskSelectionRects([src], [full(0, 1, 2, 2)])
      const right = result.find(p => p.x === 2 && p.y === 1)!
      expect(right).toMatchObject({ x: 2, y: 1, w: 2, h: 2 })
      // row 1 cols 2-3: pixels 6,7; row 2 cols 2-3: pixels 10,11
      expect(Array.from(right.mask!.data)).toEqual([6, 7, 10, 11])
    })

    it('does not mutate the original mask data', () => {
      const originalData = Array.from(src.mask!.data)
      subtractBinaryMaskSelectionRects([src], [full(1, 1, 2, 2)])
      expect(Array.from(src.mask!.data)).toEqual(originalData)
    })

    it('piece mask has correct w/h metadata', () => {
      const [piece] = subtractBinaryMaskSelectionRects([src], [full(0, 2, 4, 2)])
      expect(piece.mask!.w).toBe(4)
      expect(piece.mask!.h).toBe(2)
    })

    it('preserves mask type on extracted pieces', () => {
      const [piece] = subtractBinaryMaskSelectionRects([src], [full(0, 2, 4, 2)])
      expect(piece.mask!.type).toBe(MaskType.BINARY)
    })
  })

// ---------------------------------------------------------------------------
// Multiple current rects — each handled independently
// ---------------------------------------------------------------------------

  describe('multiple current rects', () => {
    it('leaves non-intersecting rects untouched while splitting intersecting ones', () => {
      const rects = [
        full(0, 0, 10, 10),  // intersects sub
        full(50, 50, 10, 10), // does not intersect sub
      ]
      const result = subtractBinaryMaskSelectionRects(rects, [full(0, 5, 10, 10)])
      // rect 0 → top piece (y=0..5)
      // rect 1 → unchanged
      expect(result).toHaveLength(2)
      expect(result.some(p => p.x === 0 && p.y === 0 && p.h === 5)).toBe(true)
      expect(result.some(p => p.x === 50 && p.y === 50)).toBe(true)
    })

    it('handles two rects both fully subtracted', () => {
      const result = subtractBinaryMaskSelectionRects(
        [full(0, 0, 5, 5), full(10, 10, 5, 5)],
        [full(0, 0, 20, 20)],
      )
      expect(result).toHaveLength(0)
    })
  })

// ---------------------------------------------------------------------------
// Multiple subtracting rects — applied sequentially
// ---------------------------------------------------------------------------

  describe('multiple subtracting rects', () => {
    it('applies each subtractor in order', () => {
      // r: (0,0,10,10) → sub1 removes top half → sub2 removes right half of remainder
      const result = subtractBinaryMaskSelectionRects(
        [full(0, 0, 10, 10)],
        [full(0, 0, 10, 5), full(5, 5, 5, 5)],
      )
      // After sub1: one piece — bottom half (0,5,10,5)
      // After sub2: left strip of that — (0,5,5,5)
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 5, w: 5, h: 5 })
    })

    it('second subtractor can further split a piece from the first', () => {
      const result = subtractBinaryMaskSelectionRects(
        [full(0, 0, 20, 10)],
        [full(5, 0, 5, 10), full(0, 0, 4, 5)],
      )
      // After sub1 (5,0,5,10): left (0,0,5,10) and right (10,0,10,10)
      // After sub2 (0,0,4,5): left piece (0,0,5,10) gets clipped
      //   → top of left (0,0,5,5) loses (0,0,4,5) → right strip (4,0,1,5)
      //   → bottom of left (0,5,5,5) unchanged
      const rightLarge = result.find(p => p.x === 10)
      expect(rightLarge).toMatchObject({ x: 10, y: 0, w: 10, h: 10 })
    })
  })

// ---------------------------------------------------------------------------
// pushPiece w/h guard (zero-dimension pieces must not be emitted)
// ---------------------------------------------------------------------------

  describe('zero-dimension piece suppression', () => {
    it('does not emit a top piece when sub starts at r.y', () => {
      // iy === r.y → no top piece
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], [full(0, 0, 5, 5)])
      const tops = result.filter(p => p.y === 0 && p.h < 10)
      // top piece would be h=0; must not appear
      expect(tops.every(p => p.h > 0)).toBe(true)
    })

    it('does not emit a bottom piece when sub ends at r bottom edge', () => {
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], [full(0, 5, 10, 5)])
      const pieces = result.filter(p => p.h === 0)
      expect(pieces).toHaveLength(0)
    })

    it('does not emit a left piece when sub starts at r.x', () => {
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], [full(0, 2, 5, 5)])
      const zeroes = result.filter(p => p.w === 0 || p.h === 0)
      expect(zeroes).toHaveLength(0)
    })

    it('does not emit a right piece when sub ends at r right edge', () => {
      const result = subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], [full(5, 2, 5, 5)])
      const zeroes = result.filter(p => p.w === 0 || p.h === 0)
      expect(zeroes).toHaveLength(0)
    })
  })

// ---------------------------------------------------------------------------
// Result immutability — input arrays must not be mutated
// ---------------------------------------------------------------------------

  describe('input immutability', () => {
    it('does not mutate the current array', () => {
      const current = [full(0, 0, 10, 10)]
      const originalLength = current.length
      subtractBinaryMaskSelectionRects(current, [full(0, 0, 5, 5)])
      expect(current).toHaveLength(originalLength)
      expect(current[0]).toMatchObject({ x: 0, y: 0, w: 10, h: 10 })
    })

    it('does not mutate the subtracting array', () => {
      const subs = [full(0, 0, 5, 5)]
      subtractBinaryMaskSelectionRects([full(0, 0, 10, 10)], subs)
      expect(subs).toHaveLength(1)
      expect(subs[0]).toMatchObject({ x: 0, y: 0, w: 5, h: 5 })
    })
  })
})
