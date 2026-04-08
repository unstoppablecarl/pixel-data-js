
import { _macro_halfAndFloor } from '../Internal/macros'
import { type AlphaMask, type BinaryMask, MaskType } from '../Mask/_mask-types'
import { type PaintAlphaMask, type PaintBinaryMask, PaintMaskOutline } from './_paint-types'

export function makePaintBinaryMask(
  mask: BinaryMask,
): PaintBinaryMask {
  return {
    type: MaskType.BINARY,
    outlineType: PaintMaskOutline.MASKED,
    data: mask.data,
    w: mask.w,
    h: mask.h,
    centerOffsetX: -_macro_halfAndFloor(mask.w),
    centerOffsetY: -_macro_halfAndFloor(mask.h),
  }
}

export function makePaintAlphaMask(
  mask: AlphaMask,
): PaintAlphaMask {
  return {
    type: MaskType.ALPHA,
    outlineType: PaintMaskOutline.MASKED,
    data: mask.data,
    w: mask.w,
    h: mask.h,
    centerOffsetX: -_macro_halfAndFloor(mask.w),
    centerOffsetY: -_macro_halfAndFloor(mask.h),
  }
}
