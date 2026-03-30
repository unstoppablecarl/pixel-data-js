import { type NullableBinaryMaskRect } from '@/_types'
import { mergeBinaryMaskRects } from '@/MaskRect/mergeBinaryMaskRects'
import { describe, expect, it } from 'vitest'
import { makeTestBinaryMaskRect } from '../_helpers'

function full(x: number, y: number, w: number, h: number): NullableBinaryMaskRect {
  return { x, y, w, h, data: null, type: null }
}

function px(r: NullableBinaryMaskRect): number[] {
  return Array.from(r.data as Uint8Array)
}

describe('mergeBinaryMaskRects', () => {

  describe('empty inputs', () => {
    it('returns [] when both arrays are empty', () => {
      expect(mergeBinaryMaskRects([], [])).toEqual([])
    })

    it('returns current when adding is empty', () => {
      const current = [full(0, 0, 5, 5)]
      const result = mergeBinaryMaskRects(current, [])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 5, h: 5 })
    })

    it('returns adding when current is empty', () => {
      const result = mergeBinaryMaskRects([], [full(10, 10, 4, 4)])
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 10, y: 10, w: 4, h: 4 })
    })
  })

  describe('no overlap', () => {
    it('keeps two clearly separated rects as distinct', () => {
      const result = mergeBinaryMaskRects(
        [full(0, 0, 5, 5)],
        [full(10, 10, 5, 5)],
      )
      expect(result).toHaveLength(2)
    })

    it('keeps three non-overlapping rects separate', () => {
      const result = mergeBinaryMaskRects(
        [full(0, 0, 3, 3), full(10, 0, 3, 3)],
        [full(20, 0, 3, 3)],
      )
      expect(result).toHaveLength(3)
    })

    it('does not merge rects with a one-pixel gap between them', () => {
      // (0,0,5,5) and (6,0,5,5): gap at x=5 — right edge of a is 5, left of b is 6
      // overlap check: r.x(6) <= n.x+n.w(5) → 6 <= 5 → false → no merge
      const result = mergeBinaryMaskRects(
        [full(0, 0, 5, 5)],
        [full(6, 0, 5, 5)],
      )
      expect(result).toHaveLength(2)
    })
  })

// ---------------------------------------------------------------------------
// mergeBinaryMaskRects — overlapping / touching rects merge
// ---------------------------------------------------------------------------

  describe('merging', () => {
    it('merges two horizontally adjacent (touching edge) rects', () => {
      // touching: r.x(5) <= n.x+n.w(5) → 5 <= 5 ✓ → merged
      const result = mergeBinaryMaskRects(
        [full(0, 0, 5, 5)],
        [full(5, 0, 5, 5)],
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 10, h: 5 })
      expect(result[0].data).toBeNull()
    })

    it('merges two vertically adjacent rects', () => {
      const result = mergeBinaryMaskRects(
        [full(0, 0, 4, 3)],
        [full(0, 3, 4, 3)],
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 4, h: 6 })
    })

    it('merges two overlapping rects with same dimensions', () => {
      const result = mergeBinaryMaskRects(
        [full(0, 0, 6, 6)],
        [full(3, 3, 6, 6)],
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 9, h: 9 })
    })

    it('merges a rect inside another into the larger one', () => {
      const result = mergeBinaryMaskRects(
        [full(0, 0, 10, 10)],
        [full(2, 2, 4, 4)],
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 10, h: 10 })
      expect(result[0].data).toBeNull()
    })

    it('merges all rects in current + adding when they all overlap', () => {
      const result = mergeBinaryMaskRects(
        [full(0, 0, 5, 5), full(4, 0, 5, 5)],
        [full(8, 0, 5, 5)],
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 13, h: 5 })
    })
  })

// ---------------------------------------------------------------------------
// mergeBinaryMaskRects — chain merges requiring multiple loop passes
// ---------------------------------------------------------------------------

  describe('multi-pass chain merges', () => {
    it('merges A→B→C chain where A+B and B+C overlap but A+C do not directly', () => {
      // A:(0,0,4,4), B:(3,0,4,4), C:(6,0,4,4)
      // Pass 1: A+B merge → AB:(0,0,7,4); then AB overlaps C → ABC:(0,0,10,4)
      // This all happens in one pass since B and C are both processed against the growing `next`
      const result = mergeBinaryMaskRects(
        [full(0, 0, 4, 4), full(3, 0, 4, 4)],
        [full(6, 0, 4, 4)],
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 10, h: 4 })
    })

    it('handles a chain spread across current and adding', () => {
      // current: [(0,0,3,3), (5,0,3,3)], adding: [(2,0,4,3)]
      // adding bridges the two current rects → one merged result
      const result = mergeBinaryMaskRects(
        [full(0, 0, 3, 3), full(5, 0, 3, 3)],
        [full(2, 0, 4, 3)],
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 8, h: 3 })
    })

    it('requires second while-loop pass when a late merge creates new overlap', () => {
      // Rects ordered so that processing order matters:
      // [A, C, B] where A=(0,0,2,2), C=(4,0,2,2), B=(1,0,4,2)
      // First pass: A+B merge → AB, but AB now overlaps C
      // Second pass detects AB+C overlap → single rect
      const result = mergeBinaryMaskRects(
        [full(0, 0, 2, 2), full(4, 0, 2, 2)],
        [full(1, 0, 4, 2)],
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 6, h: 2 })
    })
  })

// ---------------------------------------------------------------------------
// mergeBinaryMaskRects — two independent groups stay separate
// ---------------------------------------------------------------------------

  describe('independent groups', () => {
    it('merges within each group independently', () => {
      // Group 1: (0,0,5,5) + (4,0,5,5) → one rect
      // Group 2: (50,50,5,5) + (54,50,5,5) → one rect
      const result = mergeBinaryMaskRects(
        [full(0, 0, 5, 5), full(50, 50, 5, 5)],
        [full(4, 0, 5, 5), full(54, 50, 5, 5)],
      )
      expect(result).toHaveLength(2)
      const g1 = result.find(r => r.x === 0)
      const g2 = result.find(r => r.x === 50)
      expect(g1).toMatchObject({ x: 0, y: 0, w: 9, h: 5 })
      expect(g2).toMatchObject({ x: 50, y: 50, w: 9, h: 5 })
    })
  })

// ---------------------------------------------------------------------------
// mergeBinaryMaskRects — masked rects are merged correctly
// ---------------------------------------------------------------------------

  describe('masked rect merging', () => {
    it('merges two touching masked rects and ORs their data', () => {
      // a: (0,0,2,1) [1,0], b: (2,0,2,1) [0,1]
      // adjacent → overlap check passes (r.x(2) <= n.x+n.w(2) ✓)
      // → merge2 produces non-null mask
      const result = mergeBinaryMaskRects(
        [makeTestBinaryMaskRect(0, 0, 2, 1, [1, 0])],
        [makeTestBinaryMaskRect(2, 0, 2, 1, [0, 1])],
      )
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 4, h: 1 })
      expect(px(result[0])).toEqual([1, 0, 0, 1])
    })

    it('merges a null-mask and a masked rect that are touching', () => {
      const result = mergeBinaryMaskRects(
        [full(0, 0, 3, 3)],
        [makeTestBinaryMaskRect(3, 0, 3, 3, [0, 1, 0, 1, 0, 1, 0, 1, 0])],
      )
      expect(result).toHaveLength(1)
      // null + masked touching → not a perfect rect (one is masked) → masked output
      expect(result[0].data).not.toBeNull()
      expect(result[0]).toMatchObject({ x: 0, y: 0, w: 6, h: 3 })
    })
  })

// ---------------------------------------------------------------------------
// mergeBinaryMaskRects — input mutation guards
// ---------------------------------------------------------------------------

  describe('immutability', () => {
    it('does not mutate the current input array', () => {
      const current = [full(0, 0, 5, 5)]
      mergeBinaryMaskRects(current, [full(4, 0, 5, 5)])
      expect(current).toHaveLength(1)
      expect(current[0]).toMatchObject({ x: 0, y: 0, w: 5, h: 5 })
    })

    it('does not mutate the adding input array', () => {
      const adding = [full(4, 0, 5, 5)]
      mergeBinaryMaskRects([full(0, 0, 5, 5)], adding)
      expect(adding).toHaveLength(1)
      expect(adding[0]).toMatchObject({ x: 4, y: 0, w: 5, h: 5 })
    })

    it('does not mutate input mask data when merging masked rects', () => {
      const a = makeTestBinaryMaskRect(0, 0, 2, 2, [1, 0, 0, 1])
      const b = makeTestBinaryMaskRect(1, 0, 2, 2, [0, 1, 1, 0])
      const origA = Array.from(a.data as Uint8Array)
      const origB = Array.from(b.data as Uint8Array)
      mergeBinaryMaskRects([a], [b])
      expect(Array.from(a.data as Uint8Array)).toEqual(origA)
      expect(Array.from(b.data as Uint8Array)).toEqual(origB)
    })
  })
})
