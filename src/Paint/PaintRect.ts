import { _macro_paintRectCenterOffset } from '../Internal/macros'
import { PaintMaskOutline, type PaintRect } from './_paint-types'

export function makePaintRect(w: number, h: number): PaintRect {
  return {
    type: null,
    outlineType: PaintMaskOutline.RECT,
    data: null,
    w,
    h,
    centerOffsetX: _macro_paintRectCenterOffset(w),
    centerOffsetY: _macro_paintRectCenterOffset(h),
  }
}
