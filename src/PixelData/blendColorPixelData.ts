import { type Color32, type ColorBlendOptions, MaskType } from '../_types'
import { sourceOverFast } from '../BlendModes/blend-modes-fast'
import type { PixelData } from './PixelData'

/**
 * Fills a rectangle in the destination PixelData with a single color,
 * supporting blend modes, global alpha, and masking.
 */
export function blendColorPixelData(
  dst: PixelData,
  color: Color32,
  opts: ColorBlendOptions = {},
) {
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: width = dst.width,
    h: height = dst.height,
    alpha: globalAlpha = 255,
    blendFn = sourceOverFast,
    mask,
    maskType = MaskType.ALPHA,
    mw,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  if (globalAlpha === 0) return

  const baseSrcAlpha = (color >>> 24)
  const isOverwrite = blendFn.isOverwrite
  if (baseSrcAlpha === 0 && !isOverwrite) return

  let x = targetX
  let y = targetY
  let w = width
  let h = height

  // Destination Clipping
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

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
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
        // if mask or global alpha are 0 we bail even if we are overwriting
        if (weight === 0) {
          dIdx++
          mIdx++
          continue
        }
      }

      let currentSrcColor = color

      if (weight < 255) {
        let currentSrcAlpha = baseSrcAlpha

        if (baseSrcAlpha === 255) {
          currentSrcAlpha = weight
        } else {
          currentSrcAlpha = (baseSrcAlpha * weight + 128) >> 8
        }

        if (!isOverwrite && currentSrcAlpha === 0) {
          dIdx++
          mIdx++
          continue
        }

        currentSrcColor = ((color & 0x00ffffff) | (currentSrcAlpha << 24)) >>> 0 as Color32
      }

      dst32[dIdx] = blendFn(currentSrcColor, dst32[dIdx] as Color32)

      dIdx++
      mIdx++
    }

    dIdx += dStride
    mIdx += mStride
  }
}
