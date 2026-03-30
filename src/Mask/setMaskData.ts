import type { Mask } from '../_types'

export function setMaskData(mask: Mask, width: number, height: number, data: Uint8Array): void {
  ;(mask as any).w = width
  ;(mask as any).h = height
  ;(mask as any).data = data
}
