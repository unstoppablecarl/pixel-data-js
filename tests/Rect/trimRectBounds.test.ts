import { type BinaryMaskRect, MaskType, type Rect, trimRectBounds } from '@/index'
import { describe, expect, it } from 'vitest'
import { makeTestBinaryMask, makeTestBinaryMaskRect } from '../_helpers'

describe('trimRectBounds: Edge Case Analysis', () => {
  it('preserves identity when target and bounds are identical', () => {
    const target: Rect = {
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    }
    const bounds: Rect = {
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    }

    trimRectBounds(target, bounds)

    expect(target).toEqual({
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    })
  })

  it('collapses to zero-dimension when target is strictly outside (The Void)', () => {
    // Target is to the left of the bounds with no shared edge
    const target: Rect = {
      x: -50,
      y: 0,
      w: 10,
      h: 10,
    }
    const bounds: Rect = {
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    }

    trimRectBounds(target, bounds)

    // A non-intersecting rect should result in 0 width/height
    // located at the nearest boundary edge
    expect(target.w).toBe(0)
    expect(target.h).toBe(0)
  })

  it('maintains a 1px sliver on the boundary (The Gutter)', () => {
    // Target overlaps the left edge by exactly 1 pixel
    const target: Rect = {
      x: -9,
      y: 0,
      w: 10,
      h: 10,
    }
    const bounds: Rect = {
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    }

    trimRectBounds(target, bounds)

    expect(target.x).toBe(0)
    expect(target.w).toBe(1)
  })

  it('correctly offsets the mask when only the top-left is trimmed', () => {
    const selection = makeTestBinaryMaskRect(-1, -1, 2, 2, [
      10, 20,
      30, 40,
    ])

    const bounds: Rect = {
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    }

    trimRectBounds(selection, bounds)

    /**
     * The intersection is a 1x1 rect at (0,0).
     * The offset is (1, 1) into the original mask.
     * Original mask index (1, 1) is the value 40.
     */
    expect(selection.w).toBe(1)
    expect(selection.h).toBe(1)
    expect(selection!.data[0]).toBe(40)
  })

  it('handles "Inside-Out" bounds where target is larger than bounds', () => {
    const target: Rect = {
      x: -10,
      y: -10,
      w: 200,
      h: 200,
    }
    const bounds: Rect = {
      x: 0,
      y: 0,
      w: 50,
      h: 50,
    }

    trimRectBounds(target, bounds)

    // Result should exactly match the bounds
    expect(target.x).toBe(bounds.x)
    expect(target.y).toBe(bounds.y)
    expect(target.w).toBe(bounds.w)
    expect(target.h).toBe(bounds.h)
  })

  it('shrinks the rect to fit a small island of pixels within a larger mask', () => {
    const w = 10
    const h = 10
    const mask = makeTestBinaryMask(w, h)

    // Place a 2x2 square starting at local index (4,4)
    // Row 4
    mask.data[44] = 1
    mask.data[45] = 1
    // Row 5
    mask.data[54] = 1
    mask.data[55] = 1

    const selection: BinaryMaskRect = {
      x: 100,
      y: 100,
      w,
      h,
      type: MaskType.BINARY,
      data: mask.data,
    }

    const container = {
      x: 0,
      y: 0,
      w: 1000,
      h: 1000,
    }

    trimRectBounds(
      selection,
      container,
    )

    // Verify coordinates shifted by the minX/minY found (4, 4)
    expect(selection.x).toBe(104)
    expect(selection.y).toBe(104)

    // Verify dimensions became 2x2
    expect(selection.w).toBe(2)
    expect(selection.h).toBe(2)

    // Verify mask was reallocated to the tight size
    expect(selection.data!.length).toBe(4)
  })

  it('handles an entirely empty mask by setting dimensions to zero', () => {
    const w = 10
    const h = 10
    const mask = makeTestBinaryMask(w, h)

    const selection: BinaryMaskRect = {
      x: 10,
      y: 10,
      w,
      h,
      type: MaskType.BINARY,
      data: mask.data,
    }

    trimRectBounds(
      selection,
      { x: 0, y: 0, w: 100, h: 100 },
    )

    expect(selection.w).toBe(0)
    expect(selection.h).toBe(0)
  })
  it('covers empty intersection and zeroed mask', () => {
    const mask = makeTestBinaryMask(10, 10)
    const selection: BinaryMaskRect = {
      x: 500, // Way outside 0-100 range
      y: 500,
      w: 10,
      h: 10,
      type: MaskType.BINARY,
      data: mask.data,
    }

    const container = {
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    }

    trimRectBounds(selection, container)

    expect(selection.w).toBe(0)
    expect(selection.data.length).toBe(0)
  })
})
