import type { Color32 } from '../Color/_color-types'
import type { BinaryMask } from '../Mask/_mask-types'
import type { PixelData32 } from './_pixelData-types'

/**
 * Fills the target PixelData with a color based on a binary mask.
 *
 * @param target - The target to modify.
 * @param color - The color to apply.
 * @param mask - The binary mask determining where to fill.
 * @param x - Horizontal offset to place the mask.
 * @param y - Vertical offset to place the mask.
 * @returns true if any pixels were actually modified.
 */
export function fillPixelDataBinaryMask(
  target: PixelData32,
  color: Color32,
  mask: BinaryMask,
  x = 0,
  y = 0,
): boolean {
  const targetW = target.w
  const targetH = target.h
  const maskW = mask.w
  const maskH = mask.h

  // Inline clipping logic
  let dstX = x
  let dstY = y
  let actualW = maskW
  let actualH = maskH

  if (dstX < 0) {
    actualW += dstX
    dstX = 0
  }

  if (dstY < 0) {
    actualH += dstY
    dstY = 0
  }

  actualW = Math.min(actualW, targetW - dstX)
  actualH = Math.min(actualH, targetH - dstY)

  if (actualW <= 0 || actualH <= 0) return false

  const maskData = mask.data
  const dst32 = target.data

  // Calculate offsets for the mask based on clipping
  const mx = dstX - x
  const my = dstY - y

  let hasChanged = false

  // Stride-based loop for performance
  let dIdx = dstY * targetW + dstX
  let mIdx = my * maskW + mx

  const dStride = targetW - actualW
  const mStride = maskW - actualW

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      if (maskData[mIdx]) {
        if (dst32[dIdx] !== color) {
          dst32[dIdx] = color
          hasChanged = true
        }
      }
      dIdx++
      mIdx++
    }
    dIdx += dStride
    mIdx += mStride
  }

  return hasChanged
}
