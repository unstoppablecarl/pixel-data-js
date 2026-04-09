import type { Color32 } from '../_types'
import type { Rect } from '../Rect/_rect-types'
import type { PixelData32 } from './_pixelData-types'

/**
 * Fills a region or the {@link PixelData32} buffer with a solid color.
 * This function is faster than {@link fillPixelData} but does not
 * return a boolean value indicating changes were made.
 *
 * @param target - The target to modify.
 * @param color - The color to apply.
 * @param rect - Defines the area to fill. If omitted, the entire
 * buffer is filled.
 */
export function fillPixelDataFast(
  target: PixelData32,
  color: Color32,
  rect?: Partial<Rect>,
): void
/**
 * @param dst - The target to modify.
 * @param color - The color to apply.
 * @param x - Starting horizontal coordinate.
 * @param y - Starting vertical coordinate.
 * @param w - Width of the fill area.
 * @param h - Height of the fill area.
 */
export function fillPixelDataFast(
  dst: PixelData32,
  color: Color32,
  x: number,
  y: number,
  w: number,
  h: number,
): void
export function fillPixelDataFast(
  dst: PixelData32,
  color: Color32,
  _x?: Partial<Rect> | number,
  _y?: number,
  _w?: number,
  _h?: number,
): void {
  const dstW = dst.w
  const dstH = dst.h

  let x: number
  let y: number
  let w: number
  let h: number

  if (typeof _x === 'object') {
    x = _x.x ?? 0
    y = _x.y ?? 0
    w = _x.w ?? dst.w
    h = _x.h ?? dst.h
  } else if (typeof _x === 'number') {
    x = _x
    y = _y!
    w = _w!
    h = _h!
  } else {
    x = 0
    y = 0
    w = dst.w
    h = dst.h
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

  if (fillW <= 0) return
  if (fillH <= 0) return

  const dst32 = dst.data
  const dw = dst.w

  // Optimization: If filling the entire buffer, use the native .fill()
  if (fillW === dw && fillH === dst.h && dstX === 0 && dstY === 0) {
    dst32.fill(color)
    return
  }

  // Row-by-row fill for partial rectangles
  for (let iy = 0; iy < fillH; iy++) {
    const start = (dstY + iy) * dw + dstX
    const end = start + fillW
    dst32.fill(color, start, end)
  }
}
