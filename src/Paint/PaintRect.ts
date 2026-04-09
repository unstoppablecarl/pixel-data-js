import { _macro_paintRectCenterOffset } from '../Internal/macros'
import type { PaintRect } from './_paint-types'

export function makePaintRect(w: number, h: number): PaintRect {
  return {
    w,
    h,
    centerOffsetX: _macro_paintRectCenterOffset(w),
    centerOffsetY: _macro_paintRectCenterOffset(h),
  }
}
