import type { NullableBinaryMaskRect } from '../Mask/_mask-types'
import { merge2BinaryMaskRects } from './merge2BinaryMaskRects'

export function mergeBinaryMaskRects(current: NullableBinaryMaskRect[], adding: NullableBinaryMaskRect[]): NullableBinaryMaskRect[] {
  const rects = [...current, ...adding]

  let changed = true
  while (changed) {
    changed = false
    const next: NullableBinaryMaskRect[] = []

    for (const r of rects) {
      let merged = false

      for (let i = 0; i < next.length; i++) {
        const n = next[i]

        const overlap =
          r.x <= n.x + n.w &&
          r.x + r.w >= n.x &&
          r.y <= n.y + n.h &&
          r.y + r.h >= n.y

        if (overlap) {
          next[i] = merge2BinaryMaskRects(n, r)
          merged = true
          changed = true
          break
        }
      }

      if (!merged) next.push(r)
    }

    rects.splice(0, rects.length, ...next)
  }

  return rects
}
