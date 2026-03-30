import { type AlphaMask, MaskType } from '../_types'

export function makeAlphaMask(w: number, h: number, data?: Uint8Array): AlphaMask {
  const result: AlphaMask = {
    type: MaskType.ALPHA,
    data: data ?? new Uint8Array(w * h),
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
