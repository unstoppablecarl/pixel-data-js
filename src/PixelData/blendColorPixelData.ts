import { type Color32, type ColorBlendOptions, MaskType } from '../_types'
import { BlendMode } from '../BlendModes/blend-modes'
import { FAST_BLEND_MODES } from '../BlendModes/blend-modes-fast'
import type { PixelData } from './PixelData'

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
    blendFn = FAST_BLEND_MODES[BlendMode.sourceOver],
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
  const baseSrcColor = color
  const baseSrcAlpha = (baseSrcColor >>> 24)

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {

      // Early exit if source pixel is already transparent
      if (baseSrcAlpha === 0) {
        dIdx++
        mIdx++
        continue
      }

      let weight = globalAlpha

      if (mask) {
        const mVal = mask[mIdx]

        if (isAlphaMask) {
          const effectiveM = invertMask
            ? 255 - mVal
            : mVal

          // If mask is transparent, skip
          if (effectiveM === 0) {
            dIdx++
            mIdx++
            continue
          }

          // globalAlpha is not a factor
          if (globalAlpha === 255) {
            weight = effectiveM
            // mask is not a factor
          } else if (effectiveM === 255) {
            weight = globalAlpha
          } else {
            // use rounding-corrected multiplication
            weight = (effectiveM * globalAlpha + 128) >> 8
          }
        } else {
          const isHit = invertMask
            ? mVal === 0
            : mVal === 1

          if (!isHit) {
            dIdx++
            mIdx++
            continue
          }

          weight = globalAlpha
        }

        // Final safety check for weight (can be 0 if globalAlpha or alphaMask rounds down)
        if (weight === 0) {
          dIdx++
          mIdx++
          continue
        }
      }

      // Apply Weight to Source Alpha
      let currentSrcAlpha = baseSrcAlpha
      let currentSrcColor = baseSrcColor

      if (weight < 255) {
        if (baseSrcAlpha === 255) {
          currentSrcAlpha = weight
        } else {
          currentSrcAlpha = (baseSrcAlpha * weight + 128) >> 8
        }

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
