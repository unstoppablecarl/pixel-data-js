import type { BinaryMask, Color32, IPixelData } from '../_types'
import { makeClippedRect, resolveRectClipping } from '../Internal/resolveClipping'

const SCRATCH_RECT = makeClippedRect()

/**
 * Fills a region of the {@link IPixelData} buffer with a solid color using a mask.
 * @param dst - The target to modify.
 * @param color - The color to apply.
 * @param mask - The mask defining the area to fill.
 * @param alpha - The overall opacity of the fill (0-255).
 * @param x - Starting horizontal coordinate for the mask placement.
 * @param y - Starting vertical coordinate for the mask placement.
 */
export function fillPixelDataBinaryMask(
  dst: IPixelData,
  color: Color32,
  mask: BinaryMask,
  alpha = 255,
  x = 0,
  y = 0,
): boolean {
  if (alpha === 0) return false

  const maskW = mask.w
  const maskH = mask.h

  const clip = resolveRectClipping(
    x,
    y,
    maskW,
    maskH,
    dst.width,
    dst.height,
    SCRATCH_RECT,
  )

  if (!clip.inBounds) return false

  const {
    x: finalX,
    y: finalY,
    w: actualW,
    h: actualH,
  } = clip

  const maskData = mask.data
  const dst32 = dst.data32
  const dw = dst.width

  // Pre-calculate the alpha-adjusted color once outside the loop
  let finalCol = color

  if (alpha < 255) {
    const baseSrcAlpha = color >>> 24
    const colorRGB = color & 0x00ffffff
    const a = (baseSrcAlpha * alpha + 128) >> 8

    finalCol = ((colorRGB | (a << 24)) >>> 0) as Color32
  }

  let hasChanged = false

  for (let iy = 0; iy < actualH; iy++) {
    const currentY = finalY + iy
    const maskY = currentY - y
    const maskOffset = maskY * maskW

    const dstRowOffset = currentY * dw

    for (let ix = 0; ix < actualW; ix++) {
      const currentX = finalX + ix
      const maskX = currentX - x
      const maskIndex = maskOffset + maskX

      if (maskData[maskIndex]) {
        const current = dst32[dstRowOffset + currentX]
        if (current !== finalCol) {
          dst32[dstRowOffset + currentX] = finalCol
          hasChanged = true
        }
      }
    }
  }

  return hasChanged
}
