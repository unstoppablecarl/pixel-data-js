
import { type BinaryMask, MaskType } from './_mask-types'

/**
 * Creates a Binary Mask
 * @param w - width
 * @param h - height
 * @param data - values 0-1
 */
export function makeBinaryMask(w: number, h: number, data?: Uint8Array): BinaryMask {
  return {
    type: MaskType.BINARY,
    data: data ?? new Uint8Array(w * h),
    w,
    h,
  }
}
