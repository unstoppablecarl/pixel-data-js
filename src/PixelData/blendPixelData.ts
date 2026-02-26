import { type Color32, MaskType, type PixelBlendOptions } from '../_types'
import { BlendMode } from '../BlendModes/blend-modes'
import { FAST_BLEND_MODES } from '../BlendModes/blend-modes-fast'
import type { PixelData } from './PixelData'

/**
 * Blits source PixelData into a destination PixelData using 32-bit integer bitwise blending.
 * This function bypasses standard ImageData limitations by operating directly on
 * Uint32Array views. It supports various blend modes, binary/alpha masking, and
 * automatic clipping of both source and destination bounds.
 * @example
 *
 * const dst = new PixelData(ctx.getImageData(0,0,100,100))
 * blendImageData32(dst, sprite, {
 *   blendFn: COLOR_32_BLEND_MODES.multiply,
 *   mask: brushMask,
 *   maskType: MaskType.ALPHA
 * });
 */
export function blendPixelData(
  dst: PixelData,
  src: PixelData,
  opts: PixelBlendOptions,
) {
  const {
    x: targetX = 0,
    y: targetY = 0,
    sx: sourceX = 0,
    sy: sourceY = 0,
    w: width = src.width,
    h: height = src.height,
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
  let sx = sourceX
  let sy = sourceY
  let w = width
  let h = height

  // 1. Source Clipping
  if (sx < 0) {
    x -= sx
    w += sx
    sx = 0
  }
  if (sy < 0) {
    y -= sy
    h += sy
    sy = 0
  }
  w = Math.min(w, src.width - sx)
  h = Math.min(h, src.height - sy)

  // 2. Destination Clipping
  if (x < 0) {
    sx -= x
    w += x
    x = 0
  }
  if (y < 0) {
    sy -= y
    h += y
    y = 0
  }

  const actualW = Math.min(w, dst.width - x)
  const actualH = Math.min(h, dst.height - y)

  if (actualW <= 0 || actualH <= 0) return

  const dst32 = dst.data32
  const src32 = src.data32
  const dw = dst.width
  const sw = src.width
  const mPitch = mw ?? width
  const isAlphaMask = maskType === MaskType.ALPHA

  const dx = x - targetX
  const dy = y - targetY

  let dIdx = y * dw + x
  let sIdx = sy * sw + sx
  let mIdx = (my + dy) * mPitch + (mx + dx)

  const dStride = dw - actualW
  const sStride = sw - actualW
  const mStride = mPitch - actualW

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      const baseSrcColor = src32[sIdx] as Color32
      const baseSrcAlpha = (baseSrcColor >>> 24)

      // Early exit if source pixel is already transparent
      if (baseSrcAlpha === 0) {
        dIdx++
        sIdx++
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
            sIdx++
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
            sIdx++
            mIdx++
            continue
          }

          weight = globalAlpha
        }

        // Final safety check for weight (can be 0 if globalAlpha or alphaMask rounds down)
        if (weight === 0) {
          dIdx++
          sIdx++
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
          sIdx++
          mIdx++
          continue
        }

        currentSrcColor = ((baseSrcColor & 0x00ffffff) | (currentSrcAlpha << 24)) >>> 0 as Color32
      }

      dst32[dIdx] = blendFn(currentSrcColor, dst32[dIdx] as Color32)

      dIdx++
      sIdx++
      mIdx++
    }

    dIdx += dStride
    sIdx += sStride
    mIdx += mStride
  }
}
