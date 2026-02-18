import { type AnyMask, type ApplyMaskOptions, MaskType } from '../_types'
import type { PixelData } from '../PixelData'

/**
 * Directly applies a mask to a region of PixelData,
 * modifying the destination's alpha channel.
 */
export function applyMaskToPixelData(
  dst: PixelData,
  mask: AnyMask,
  opts: ApplyMaskOptions,
): void {
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: width = dst.width,
    h: height = dst.height,
    maskType = MaskType.ALPHA,
    mw,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  let x = targetX
  let y = targetY
  let w = width
  let h = height

  // 1. Destination Clipping
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
  const mPitch = mw ?? width
  const isAlphaMask = maskType === MaskType.ALPHA

  const dx = x - targetX
  const dy = y - targetY

  let dIdx = y * dw + x
  let mIdx = (my + dy) * mPitch + (mx + dx)

  const dStride = dw - actualW
  const mStride = mPitch - actualW

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      const mVal = mask[mIdx]
      const effectiveM = invertMask
        ? 255 - mVal
        : mVal

      let d = dst32[dIdx]
      let da = (d >>> 24)

      if (isAlphaMask) {
        // Multiply existing alpha by mask value
        da = (da * effectiveM + 128) >> 8
      } else {
        // Binary mask: if mask is 0, alpha becomes 0
        if (effectiveM === 0) {
          da = 0
        }
      }

      // Re-pack the pixel with the new alpha
      dst32[dIdx] = ((d & 0x00ffffff) | (da << 24)) >>> 0

      dIdx++
      mIdx++
    }

    dIdx += dStride
    mIdx += mStride
  }
}
