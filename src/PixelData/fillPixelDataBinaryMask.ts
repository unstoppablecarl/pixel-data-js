import type { BinaryMask, BinaryMaskRect, Color32, IPixelData, Rect } from '../_types'
import { makeClippedRect, resolveRectClipping } from '../Internal/resolveClipping'
import type { PixelData } from './PixelData'

const SCRATCH_RECT = makeClippedRect()

/**
 * Fills a region or the {@link PixelData} buffer with a solid color.
 * @param dst - The target {@link PixelData} to modify.
 * @param color - The {@link Color32} value to apply.
 * @param mask - The {@link BinaryMaskRect} defining the area to fill.
 * @param rect - A {@link Rect} defining the area to fill.
 */
export function fillPixelDataBinaryMask(
  dst: IPixelData,
  color: Color32,
  mask: BinaryMask,
  rect?: Partial<Rect>,
): void

/**
 * @param dst - The target {@link PixelData} to modify.
 * @param color - The {@link Color32} value to apply.
 * @param mask - The {@link Rect} defining the area to fill.
 * @param x - Starting horizontal coordinate.
 * @param y - Starting vertical coordinate.
 * @param w - Width of the fill area.
 * @param h - Height of the fill area.
 */
export function fillPixelDataBinaryMask(
  dst: IPixelData,
  color: Color32,
  mask: BinaryMask,
  x?: number,
  y?: number,
  w?: number,
  h?: number,
): void
export function fillPixelDataBinaryMask(
  dst: IPixelData,
  color: Color32,
  mask: BinaryMask,
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

  const clip = resolveRectClipping(x, y, w, h, dst.width, dst.height, SCRATCH_RECT)

  if (!clip.inBounds) return

  // Use the clipped values
  const {
    x: finalX,
    y: finalY,
    w: actualW,
    h: actualH,
  } = clip

  const maskData = mask.data
  const dst32 = dst.data32
  const dw = dst.width

  // Optimization: If filling the entire buffer, use the native .fill()
  if (actualW === dw && actualH === dst.height && finalX === 0 && finalY === 0) {
    dst32.fill(color)
    return
  }

  for (let iy = 0; iy < actualH; iy++) {
    const currentY = finalY + iy
    const maskY = currentY - y
    const maskOffset = maskY * w

    for (let ix = 0; ix < actualW; ix++) {
      const currentX = finalX + ix
      const maskX = currentX - x
      const maskIndex = maskOffset + maskX
      const isMasked = maskData[maskIndex]

      if (isMasked) {
        const dstIndex = currentY * dw + currentX
        dst32[dstIndex] = color
      }
    }
  }
}
