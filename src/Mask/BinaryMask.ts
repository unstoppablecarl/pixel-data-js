import { type BinaryMask, MaskType } from '../_types'

export function makeBinaryMask(w: number, h: number): BinaryMask {
  const result: BinaryMask = {
    type: MaskType.BINARY,
    data: new Uint8Array(w * h) as Uint8Array,
    w,
    h,
    set(data, width: number, height: number): void {
      ;(result as any).data = data
      ;(result as any).w = width
      ;(result as any).h = height
    },
  }

  return result
}
