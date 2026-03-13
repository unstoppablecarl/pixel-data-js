import { type Color32, MaskType, type PixelBlendOptions } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import { makeClippedBlit, resolveBlitClipping } from '../Internal/resolveClipping'
import type { PixelData } from './PixelData'

const SCRATCH_BLIT = makeClippedBlit()

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
    blendFn = sourceOverPerfect,
    mask,
    maskType = MaskType.ALPHA,
    mw,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  if (globalAlpha === 0) return

  const clip = resolveBlitClipping(
    targetX, targetY,
    sourceX, sourceY,
    width, height,
    dst.width, dst.height,
    src.width, src.height,
    SCRATCH_BLIT,
  )

  if (!clip.inBounds) return

  const {
    x,
    y,
    sx,
    sy,
    w: actualW,
    h: actualH,
  } = clip

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

  const isOverwrite = blendFn.isOverwrite

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      const baseSrcColor = src32[sIdx] as Color32
      const baseSrcAlpha = (baseSrcColor >>> 24)

      // In Overwrite, we process even if baseSrcAlpha is 0
      if (baseSrcAlpha === 0 && !isOverwrite) {
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
        // if mask or global alpha are 0 we bail even if we are overwriting
        if (weight === 0) {
          dIdx++
          sIdx++
          mIdx++
          continue
        }
      }

      // Apply Weight to Source Alpha
      let currentSrcColor = baseSrcColor

      if (weight < 255) {
        let currentSrcAlpha = baseSrcAlpha

        if (baseSrcAlpha === 255) {
          currentSrcAlpha = weight
        } else {
          currentSrcAlpha = (baseSrcAlpha * weight + 128) >> 8
        }

        if (!isOverwrite && currentSrcAlpha === 0) {
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
