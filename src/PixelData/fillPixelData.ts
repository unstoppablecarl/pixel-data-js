import type { BinaryMask, BinaryMaskRect, Color32, IPixelData } from '../_types'
import { makeClippedRect, resolveRectClipping } from '../Internal/resolveClipping'
import type { PixelData } from './PixelData'

const SCRATCH_RECT = makeClippedRect()

/**
 * Fills a region or the {@link PixelData} buffer with a solid color.
 *
 * @param dst - The target {@link PixelData} to modify.
 * @param color - The {@link Color32} value to apply.
 * @param rect - A {@link BinaryMaskRect} defining the area to fill.
 */
export function fillPixelData(
  dst: IPixelData,
  color: Color32,
  rect?: Partial<BinaryMaskRect>,
): void
/**
 * @param dst - The target {@link PixelData} to modify.
 * @param color - The {@link Color32} value to apply.
 * @param x - Starting horizontal coordinate.
 * @param y - Starting vertical coordinate.
 * @param w - Width of the fill area.
 * @param h - Height of the fill area.
 * @param mask - A {@link BinaryMaskRect} defining the area to fill
 */
export function fillPixelData(
  dst: IPixelData,
  color: Color32,
  x: number,
  y: number,
  w: number,
  h: number,
  mask?: BinaryMask,
): void
export function fillPixelData(
  dst: IPixelData,
  color: Color32,
  _x?: Partial<BinaryMaskRect> | number,
  _y?: number,
  _w?: number,
  _h?: number,
  _mask?: BinaryMask,
): void {
  let x: number
  let y: number
  let w: number
  let h: number
  let mask: BinaryMask | undefined

  if (typeof _x === 'object') {
    x = _x.x ?? 0
    y = _x.y ?? 0
    w = _x.w ?? dst.width
    h = _x.h ?? dst.height
    mask = _x.mask

  } else if (typeof _x === 'number') {
    x = _x
    y = _y!
    w = _w!
    h = _h!
    mask = _mask
  } else {
    x = 0
    y = 0
    w = dst.width
    h = dst.height
  }

  const clip = resolveRectClipping(x, y, w, h, dst.width, dst.height, SCRATCH_RECT)

  if (!clip.inBounds) return

  // Use the clipped values
  const {
    x: finalX,
    y: finalY,
    w: actualW,
    h: actualH,
  } = clip

  const dst32 = dst.data32
  const dw = dst.width

  // Optimization: If filling the entire buffer, use the native .fill()
  if (actualW === dw && actualH === dst.height && finalX === 0 && finalY === 0) {
    dst32.fill(color)
    return
  }

  if (mask) {
    for (let iy = 0; iy < actualH; iy++) {
      const currentY = finalY + iy
      const maskY = currentY - y
      const maskOffset = maskY * w

      for (let ix = 0; ix < actualW; ix++) {
        const currentX = finalX + ix
        const maskX = currentX - x
        const maskIndex = maskOffset + maskX
        const isMasked = mask[maskIndex]

        if (isMasked) {
          const dstIndex = currentY * dw + currentX
          dst32[dstIndex] = color
        }
      }
    }
  } else {
    // Row-by-row fill for partial rectangles
    for (let iy = 0; iy < actualH; iy++) {
      const start = (finalY + iy) * dw + finalX
      const end = start + actualW
      dst32.fill(color, start, end)
    }
  }
}
