import { makePaintRect, PaintMaskOutline } from '@/index'
import { describe, expect, it } from 'vitest'

describe('makePaintRect', () => {
  it('create', () => {
    const w = 4
    const h = 5

    // copied from _macro_paintRectCenterOffset
    const paintRectCenterOffset = (size: number) => -((size - 1) >> 1)
    const rect = makePaintRect(w, h)

    expect(rect).toEqual({
      type: null,
      outlineType: PaintMaskOutline.RECT,
      data: null,
      w,
      h,
      centerOffsetX: paintRectCenterOffset(w),
      centerOffsetY: paintRectCenterOffset(h),
    })
  })
})
