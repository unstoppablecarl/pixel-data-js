import { type AnyMask, type ApplyMaskOptions, MaskType } from '../_types'
import type { PixelData } from '../PixelData'

/**
 * Directly applies a mask to a region of PixelData,
 * modifying the destination's alpha channel in-place.
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
    alpha: globalAlpha = 255,
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

  // Clipping Logic
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

  if (actualW <= 0 || actualH <= 0 || globalAlpha === 0) {
    return
  }

  const dst32 = dst.data32
  const dw = dst.width
  const mPitch = mw ?? width
  const isAlpha = maskType === MaskType.ALPHA
  const dx = x - targetX
  const dy = y - targetY

  let dIdx = y * dw + x
  let mIdx = (my + dy) * mPitch + (mx + dx)

  const dStride = dw - actualW
  const mStride = mPitch - actualW

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      const mVal = mask[mIdx]
      let weight = globalAlpha

      if (isAlpha) {
        const effectiveM = invertMask
          ? 255 - mVal
          : mVal

        // Short-circuit: if source is 0, destination alpha becomes 0
        if (effectiveM === 0) {
          dst32[dIdx] = (dst32[dIdx] & 0x00ffffff) >>> 0
          dIdx++
          mIdx++
          continue
        }

        weight = globalAlpha === 255
          ? effectiveM
          : (effectiveM * globalAlpha + 128) >> 8
      } else {
        // Strict Binary 1/0 Logic
        const isHit = invertMask
          ? mVal === 0
          : mVal === 1

        if (!isHit) {
          dst32[dIdx] = (dst32[dIdx] & 0x00ffffff) >>> 0
          dIdx++
          mIdx++
          continue
        }

        weight = globalAlpha
      }

      // If calculated weight is 0, clear alpha
      if (weight === 0) {
        dst32[dIdx] = (dst32[dIdx] & 0x00ffffff) >>> 0
      } else {
        const d = dst32[dIdx]
        const da = (d >>> 24)

        let finalAlpha = da

        if (da === 0) {
          // Already transparent
        } else if (weight === 255) {
          // Identity: keep original da
        } else if (da === 255) {
          // Identity: result is just the weight
          finalAlpha = weight
        } else {
          finalAlpha = (da * weight + 128) >> 8
        }

        dst32[dIdx] = ((d & 0x00ffffff) | (finalAlpha << 24)) >>> 0
      }

      dIdx++
      mIdx++
    }

    dIdx += dStride
    mIdx += mStride
  }
}
