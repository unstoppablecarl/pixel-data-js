import {
  type AnyMask,
  type AlphaMask,
  type ApplyMaskOptions,
  MaskType,
} from '../_types'

/**
 * Merges a source mask into a destination AlphaMask.
 */
export function mergeMasks(
  dst: AlphaMask,
  dstWidth: number,
  src: AnyMask,
  opts: ApplyMaskOptions,
): void {
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: width = 0,
    h: height = 0,
    alpha: globalAlpha = 255,
    maskType = MaskType.ALPHA,
    mw,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  if (width <= 0 || height <= 0 || globalAlpha === 0) {
    return
  }

  const sPitch = mw ?? width
  const isAlpha = maskType === MaskType.ALPHA

  for (let iy = 0; iy < height; iy++) {
    const dy = targetY + iy
    const sy = my + iy

    if (dy < 0 || sy < 0) {
      continue
    }

    for (let ix = 0; ix < width; ix++) {
      const dx = targetX + ix
      const sx = mx + ix

      if (dx < 0 || dx >= dstWidth || sx < 0 || sx >= sPitch) {
        continue
      }

      const dIdx = dy * dstWidth + dx
      const sIdx = sy * sPitch + sx
      const mVal = src[sIdx]
      let weight = globalAlpha

      if (isAlpha) {
        const effectiveM = invertMask
          ? 255 - mVal
          : mVal

        if (effectiveM === 0) {
          dst[dIdx] = 0
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
          dst[dIdx] = 0
          continue
        }

        // If binary hit, weight is just the global alpha
        weight = globalAlpha
      }

      if (weight === 0) {
        dst[dIdx] = 0
        continue
      }

      const da = dst[dIdx]

      if (da === 0) {
        // Already transparent
      } else if (weight === 255) {
        // Identity: keep da
      } else if (da === 255) {
        // Identity: result is weight
        dst[dIdx] = weight
      } else {
        dst[dIdx] = (da * weight + 128) >> 8
      }
    }
  }
}
