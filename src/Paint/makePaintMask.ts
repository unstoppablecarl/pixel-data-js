import { type AlphaMask, type BinaryMask, MaskType, type PaintAlphaMask, type PaintBinaryMask } from '../_types'
import { macro_halfAndFloor } from '../Internal/helpers'

export function makePaintBinaryMask(
  mask: BinaryMask,
): PaintBinaryMask {
  return {
    type: MaskType.BINARY,
    data: mask.data,
    w: mask.w,
    h: mask.h,
    centerOffsetX: -macro_halfAndFloor(mask.w),
    centerOffsetY: -macro_halfAndFloor(mask.h),
  }
}

export function makePaintAlphaMask(
  mask: AlphaMask,
): PaintAlphaMask {
  return {
    type: MaskType.ALPHA,
    data: mask.data,
    w: mask.w,
    h: mask.h,
    centerOffsetX: -macro_halfAndFloor(mask.w),
    centerOffsetY: -macro_halfAndFloor(mask.h),
  }
}
