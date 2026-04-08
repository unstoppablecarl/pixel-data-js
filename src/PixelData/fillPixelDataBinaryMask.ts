import type { Color32 } from '../_types'
import type { BinaryMask } from '../Mask/_mask-types'
import { makeClippedRect, resolveRectClipping } from '../Rect/resolveClipping'
import type { PixelData32 } from './_pixelData-types'

const SCRATCH_RECT = makeClippedRect()

/**
 * Fills a region of the {@link PixelData32} buffer with a solid color using a mask.
 * @param target - The target to modify.
 * @param color - The color to apply.
 * @param mask - The mask defining the area to fill.
 * @param x - Starting horizontal coordinate for the mask placement.
 * @param y - Starting vertical coordinate for the mask placement.
 */
export function fillPixelDataBinaryMask(
  target: PixelData32,
  color: Color32,
  mask: BinaryMask,
  x = 0,
  y = 0,
): boolean {

  const maskW = mask.w
  const maskH = mask.h

  const clip = resolveRectClipping(
    x,
    y,
    maskW,
    maskH,
    target.w,
    target.h,
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
  const dst32 = target.data
  const dw = target.w

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
        if (current !== color) {
          dst32[dstRowOffset + currentX] = color
          hasChanged = true
        }
      }
    }
  }

  return hasChanged
}
