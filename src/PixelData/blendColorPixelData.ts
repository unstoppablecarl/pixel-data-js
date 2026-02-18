import { type Color32, type ColorBlendOptions, MaskType } from '../_types'
import { sourceOverColor32 } from '../blend-modes'
import type { PixelData } from '../PixelData'

/**
 * Fills a rectangle in the destination PixelData with a single color,
 * supporting blend modes, global alpha, and masking.
 */
export function blendColorPixelData(
  dst: PixelData,
  color: Color32,
  opts: ColorBlendOptions,
): void {
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: width = dst.width,
    h: height = dst.height,
    alpha: globalAlpha = 255,
    blendFn = sourceOverColor32,
    mask,
    maskType = MaskType.ALPHA,
    mw,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  if (globalAlpha === 0) return

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

  if (actualW <= 0 || actualH <= 0) return

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

  // Pre-calculate the source color with global alpha
  let baseSrcColor = color
  const baseSrcAlpha = (baseSrcColor >>> 24)

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      let weight = globalAlpha
      let currentSrcColor = baseSrcColor
      let currentSrcAlpha = baseSrcAlpha

      if (currentSrcAlpha === 0) {
        dIdx++
        mIdx++
        continue
      }

      if (mask) {
        const mVal = mask[mIdx]
        const effectiveM = invertMask
          ? 255 - mVal
          : mVal

        if (effectiveM === 0) {
          dIdx++
          mIdx++
          continue
        }

        // only perform math if the mask is actually reducing opacity
        if (isAlphaMask && effectiveM < 255) {
          weight = (effectiveM * weight + 128) >> 8

          if (weight === 0) {
            dIdx++
            mIdx++
            continue
          }
        }
      }

      // Apply the weight (mask + globalAlpha) to the source color alpha
      if (weight < 255) {
        currentSrcAlpha = (currentSrcAlpha * weight + 128) >> 8
        if (currentSrcAlpha === 0) {
          dIdx++
          mIdx++
          continue
        }

        currentSrcColor = ((baseSrcColor & 0x00ffffff) | (currentSrcAlpha << 24)) >>> 0 as Color32
      }

      dst32[dIdx] = blendFn(currentSrcColor, dst32[dIdx] as Color32)

      dIdx++
      mIdx++
    }

    dIdx += dStride
    mIdx += mStride
  }
}
