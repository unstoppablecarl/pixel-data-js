import { type AlphaMask, type AnyMask, type ApplyMaskOptions, MaskType } from '../_types'

/**
 * Merges a source mask into a destination AlphaMask using rounding-corrected multiplication.
 * This function treats masks as transparency layers, where the resulting destination
 * pixel is the intersection (multiplication) of the existing alpha and the incoming
 * mask value.
 *
 * @param dst - The destination AlphaMask (Uint8Array) to modify.
 * @param dstWidth - The physical width (pitch) of the destination buffer.
 * @param src - The source mask to merge from.
 * @param opts - Options to control positioning, clipping, inversion, and global opacity.
 * @remarks
 * - **Rounding Correction**: Uses `(a * b + 128) >> 8` to minimize transparency drift.
 * - **Identity Logic**: If `dst` is 255, the result is exactly the incoming weight.
 * If the incoming weight is 255, `dst` remains unchanged.
 * - **Clipping**: Automatically clips the operation to the bounds of both the
 * destination and source coordinate systems.
 * - **Mask Types**:
 * - `MaskType.ALPHA`: Performs a soft multiply (intersection).
 * - `MaskType.BINARY`: Acts as a hard gate, clearing `dst` where `src` is 0.
 * @example
 * ```typescript
 * // Combine a circular mask with a linear gradient mask
 * mergeMasks(globalMask, 1024, circleMask, {
 * x: 100,
 * y: 100,
 * w: 500,
 * h: 500,
 * alpha: 255,
 * maskType: MaskType.ALPHA
 * });
 * ```
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

    // Vertical Clipping
    if (dy < 0 || sy < 0) {
      continue
    }

    for (let ix = 0; ix < width; ix++) {
      const dx = targetX + ix
      const sx = mx + ix

      // Horizontal Clipping & Destination Bounds Check
      if (dx < 0 || dx >= dstWidth || sx < 0 || sx >= sPitch) {
        continue
      }

      const dIdx = dy * dstWidth + dx
      const sIdx = sy * sPitch + sx

      const mVal = src[sIdx]
      const effectiveM = invertMask
        ? 255 - mVal
        : mVal

      // If source is fully transparent after inversion, result is always 0
      if (effectiveM === 0) {
        dst[dIdx] = 0
        continue
      }

      // Calculate the weight of the incoming mask (Mask * GlobalAlpha)
      let weight = globalAlpha

      if (isAlpha) {
        if (globalAlpha === 255) {
          weight = effectiveM
        } else if (effectiveM < 255) {
          weight = (effectiveM * globalAlpha + 128) >> 8
        }
      } else {
        // Binary Mask ignores soft values but respects global alpha
        weight = globalAlpha
      }

      // If the final calculated weight is 0, clear the destination
      if (weight === 0) {
        dst[dIdx] = 0
        continue
      }

      const da = dst[dIdx]

      // Standard Alpha multiplication for merging
      if (da === 0) {
        // Destination is already transparent, stay transparent
      } else if (weight === 255) {
        // Identity: Incoming is opaque, keep existing destination value
      } else if (da === 255) {
        // Identity: Destination is opaque, result is just the weight
        dst[dIdx] = weight
      } else {
        // Rounding-corrected multiplication of two partial alphas
        dst[dIdx] = (da * weight + 128) >> 8
      }
    }
  }
}
