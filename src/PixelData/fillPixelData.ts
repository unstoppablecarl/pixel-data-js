import type { Color32, Rect } from '../_types'
import type { PixelData } from '../PixelData'

/**
 * Fills a region or the {@link PixelData} buffer with a solid color.
 *
 * @param dst - The target {@link PixelData} to modify.
 * @param color - The {@link Color32} value to apply.
 * @param rect - A {@link Rect} defining the area to fill. If omitted, the entire
 * buffer is filled.
 */
export function fillPixelData(
  dst: PixelData,
  color: Color32,
  rect?: Partial<Rect>,
): void
/**
 * @param dst - The target {@link PixelData} to modify.
 * @param color - The {@link Color32} value to apply.
 * @param x - Starting horizontal coordinate.
 * @param y - Starting vertical coordinate.
 * @param w - Width of the fill area.
 * @param h - Height of the fill area.
 */
export function fillPixelData(
  dst: PixelData,
  color: Color32,
  x: number,
  y: number,
  w: number,
  h: number,
): void
export function fillPixelData(
  dst: PixelData,
  color: Color32,
  _x?: Partial<Rect> | number,
  _y?: number,
  _w?: number,
  _h?: number,
): void {
  let x: number
  let y: number
  let w: number
  let h: number

  if (typeof _x === 'object') {
    x = _x.x ?? 0
    y = _x.y ?? 0
    w = _x.w ?? dst.width
    h = _x.h ?? dst.height
  } else if (typeof _x === 'number') {
    x = _x
    y = _y!
    w = _w!
    h = _h!
  } else {
    x = 0
    y = 0
    w = dst.width
    h = dst.height
  }

  // Destination Clipping
  if (x < 0) {
    w += x
    x = 0
  }
  if (y < 0) {
    h += y
    y = 0
  }

  const actualW = Math.min(w, dst.width - x)
  const actualH = Math.min(h, dst.height - y)

  if (actualW <= 0 || actualH <= 0) {
    return
  }

  const dst32 = dst.data32
  const dw = dst.width

  // Optimization: If filling the entire buffer, use the native .fill()
  if (actualW === dw && actualH === dst.height && x === 0 && y === 0) {
    dst32.fill(color)
    return
  }

  // Row-by-row fill for partial rectangles
  for (let iy = 0; iy < actualH; iy++) {
    const start = (y + iy) * dw + x
    const end = start + actualW
    dst32.fill(color, start, end)
  }
}
