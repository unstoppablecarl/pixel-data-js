import type { Color32 } from '../_types'
import type { Rect } from '../Rect/_rect-types'
import { makeClippedRect, resolveRectClipping } from '../Rect/resolveClipping'
import type { PixelData32 } from './_pixelData-types'

const SCRATCH_RECT = makeClippedRect()

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

  const clip = resolveRectClipping(
    x,
    y,
    w,
    h,
    dst.w,
    dst.h,
    SCRATCH_RECT,
  )

  if (!clip.inBounds) return false

  const {
    x: finalX,
    y: finalY,
    w: actualW,
    h: actualH,
  } = clip

  const dst32 = dst.data
  const dw = dst.w
  let hasChanged = false

  for (let iy = 0; iy < actualH; iy++) {
    const rowOffset = (finalY + iy) * dw
    const start = rowOffset + finalX
    const end = start + actualW

    for (let i = start; i < end; i++) {
      if (dst32[i] !== color) {
        dst32[i] = color
        hasChanged = true
      }
    }
  }

  return hasChanged
}
