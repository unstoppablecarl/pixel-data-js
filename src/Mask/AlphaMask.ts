
import { type AlphaMask, MaskType } from './_mask-types'

/**
 * Creates an Alpha Mask
 * @param w - width
 * @param h - height
 * @param data - values 0-255
 */
export function makeAlphaMask(w: number, h: number, data?: Uint8Array): AlphaMask {
  return {
    type: MaskType.ALPHA,
    data: data ?? new Uint8Array(w * h),
    w,
    h,
  }
}
