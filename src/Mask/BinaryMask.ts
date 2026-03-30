import { type BinaryMask, MaskType } from '../_types'

export function makeBinaryMask(w: number, h: number, data?: Uint8Array): BinaryMask {
  const result: BinaryMask = {
    type: MaskType.BINARY,
    data: data ?? new Uint8Array(w * h) as Uint8Array,
    w,
    h,
    set(width: number, height: number, data: Uint8Array): void {
      ;(result as any).w = width
      ;(result as any).h = height
      ;(result as any).data = data
    },
  }

  return result
}
