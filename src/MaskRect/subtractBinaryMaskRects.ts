
import { MaskType, type NullableBinaryMaskRect } from '../Mask/_mask-types'

export function subtractBinaryMaskRects(
  current: NullableBinaryMaskRect[],
  subtracting: NullableBinaryMaskRect[],
): NullableBinaryMaskRect[] {
  let result = [...current]

  for (const sub of subtracting) {
    const next: NullableBinaryMaskRect[] = []

    for (const r of result) {
      const ix = Math.max(r.x, sub.x)
      const iy = Math.max(r.y, sub.y)
      const ix2 = Math.min(r.x + r.w, sub.x + sub.w)
      const iy2 = Math.min(r.y + r.h, sub.y + sub.h)

      if (ix >= ix2 || iy >= iy2) {
        next.push(r)
        continue
      }

      // Split r into up to 4 pieces around the intersection.
      // Extract directly from r.mask — no intermediate copy, no mutation.
      //
      //   ┌──────────────┐
      //   │     TOP      │  r.y .. iy      (full width)
      //   ├────┬─────┬───┤
      //   │LEFT│ sub │RGT│  iy .. iy2      (side strips)
      //   ├────┴─────┴───┤
      //   │    BOTTOM    │  iy2 .. r.y+r.h (full width)
      //   └──────────────┘

      if (r.y < iy) pushPiece(next, r, r.x, r.y, r.w, iy - r.y)
      if (iy2 < r.y + r.h) pushPiece(next, r, r.x, iy2, r.w, r.y + r.h - iy2)
      if (r.x < ix) pushPiece(next, r, r.x, iy, ix - r.x, iy2 - iy)
      if (ix2 < r.x + r.w) pushPiece(next, r, ix2, iy, r.x + r.w - ix2, iy2 - iy)
    }

    result = next
  }

  return result
}

/**
 * Extract sub-region (x, y, w, h) in global coords from r's mask and push
 * onto dest. If r.mask is null (fully selected) the piece is also null —
 * zero allocations on the happy path.
 */
function pushPiece(
  dest: NullableBinaryMaskRect[],
  r: NullableBinaryMaskRect,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  if (r.data === null || r.data === undefined) {
    dest.push({ x, y, w, h, data: null, type: null })
    return
  }

  // Coords local to r.mask
  const lx = x - r.x
  const ly = y - r.y

  const data = new Uint8Array(w * h)
  for (let row = 0; row < h; row++) {
    data.set(
      r.data.subarray(
        (ly + row) * r.w + lx,
        (ly + row) * r.w + lx + w,
      ),
      row * w,
    )
  }

  dest.push({ x, y, w, h, data, type: MaskType.BINARY })
}
