import type { Color32 } from '../_types'
import type { Rect } from '../Rect/_rect-types'
import type { PixelData32 } from './_pixelData-types'

/**
 * Fills a region or the {@link PixelData32} buffer with a solid color.
 *
 * @param dst - The target to modify.
 * @param color - The color to apply.
 * @param rect - Defines the area to fill. If omitted, the entire
 * @returns true if any pixels were actually modified.
 */
export function fillPixelData(
  dst: PixelData32,
  color: Color32,
  rect?: Partial<Rect>,
): boolean
/**
 * @param dst - The target to modify.
 * @param color - The color to apply.
 * @param x - Starting horizontal coordinate.
 * @param y - Starting vertical coordinate.
 * @param w - Width of the fill area.
 * @param h - Height of the fill area.
 */
export function fillPixelData(
  dst: PixelData32,
  color: Color32,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean
export function fillPixelData(
  dst: PixelData32,
  color: Color32,
  _x?: Partial<Rect> | number,
  _y?: number,
  _w?: number,
  _h?: number,
): boolean {
  const dstW = dst.w
  const dstH = dst.h

  let x: number
  let y: number
  let w: number
  let h: number

  if (typeof _x === 'object') {
    x = _x.x ?? 0
    y = _x.y ?? 0
    w = _x.w ?? dstW
    h = _x.h ?? dstH
  } else if (typeof _x === 'number') {
    x = _x
    y = _y!
    w = _w!
    h = _h!
  } else {
    x = 0
    y = 0
    w = dstW
    h = dstH
  }

  // Inline bounds clipping
  let dstX = x
  let dstY = y
  let fillW = w
  let fillH = h

  if (dstX < 0) {
    fillW += dstX
    dstX = 0
  }

  if (dstY < 0) {
    fillH += dstY
    dstY = 0
  }

  fillW = Math.min(fillW, dstW - dstX)
  fillH = Math.min(fillH, dstH - dstY)

  if (fillW <= 0 || fillH <= 0) return false

  const dst32 = dst.data
  let hasChanged = false

  // Fast-path: If the area spans the full width, we can treat it as a contiguous 1D array
  if (dstX === 0 && fillW === dstW) {
    const start = dstY * dstW
    const end = start + fillW * fillH

    for (let i = start; i < end; i++) {
      if (dst32[i] !== color) {
        dst32[i] = color
        hasChanged = true
      }
    }

    return hasChanged
  }

  // Standard path: row-by-row
  for (let iy = 0; iy < fillH; iy++) {
    const rowOffset = (dstY + iy) * dstW
    const start = rowOffset + dstX
    const end = start + fillW

    for (let i = start; i < end; i++) {
      if (dst32[i] !== color) {
        dst32[i] = color
        hasChanged = true
      }
    }
  }

  return hasChanged
}
