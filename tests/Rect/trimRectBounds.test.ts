import { describe, expect, it } from 'vitest'
import { MaskType, type Rect, type SelectionRect, trimRectBounds } from '../../src'

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
    /** * 2x2 Mask:
     * [10, 20]
     * [30, 40]
     */
    const mask = new Uint8Array([
      10,
      20,
      30,
      40,
    ])
    const selection: SelectionRect = {
      x: -1,
      y: -1,
      w: 2,
      h: 2,
      mask,
      maskType: MaskType.ALPHA,
    }
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
    expect(selection.mask![0]).toBe(40)
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
    const mask = new Uint8Array(w * h)

    // Place a 2x2 square starting at local index (4,4)
    // Row 4
    mask[44] = 1
    mask[45] = 1
    // Row 5
    mask[54] = 1
    mask[55] = 1

    const selection: SelectionRect = {
      x: 100,
      y: 100,
      w,
      h,
      mask,
      maskType: MaskType.BINARY,
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
    expect(selection.mask!.length).toBe(4)
  })

  it('handles an entirely empty mask by setting dimensions to zero', () => {
    const w = 10
    const h = 10
    const mask = new Uint8Array(w * h)

    const selection: SelectionRect = {
      x: 10,
      y: 10,
      w,
      h,
      mask,
      maskType: MaskType.BINARY,
    }

    trimRectBounds(
      selection,
      { x: 0, y: 0, w: 100, h: 100 },
    )

    expect(selection.w).toBe(0)
    expect(selection.h).toBe(0)
  })
  it('covers empty intersection and zeroed mask', () => {
    const mask = new Uint8Array(100)
    const selection: SelectionRect = {
      x: 500, // Way outside 0-100 range
      y: 500,
      w: 10,
      h: 10,
      mask,
      maskType: MaskType.BINARY,
    }

    const container = {
      x: 0,
      y: 0,
      w: 100,
      h: 100,
    }

    trimRectBounds(selection, container)

    expect(selection.w).toBe(0)
    expect(selection.mask!.length).toBe(0)
  })
})
