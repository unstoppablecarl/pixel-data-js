import { type Mask } from '../_types'

/**
 * Creates a new copy of a mask.
 * Uses the underlying buffer's slice method for high-performance memory copying.
 */
export function copyMask<T extends Mask>(src: T): T {
  return {
    type: src.type,
    data: src.data.slice(),
    w: src.w,
    h: src.h,
  } as T
}
