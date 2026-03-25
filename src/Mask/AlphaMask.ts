import { type AlphaMask, MaskType } from '../_types'

export function makeAlphaMask(w: number, h: number): AlphaMask {
  const result: AlphaMask = {
    type: MaskType.ALPHA,
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
