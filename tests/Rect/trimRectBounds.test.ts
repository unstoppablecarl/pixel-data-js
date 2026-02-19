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
})
