import { type AlphaMask, type ApplyMaskToPixelDataOptions, type Color32, type IPixelData } from '../_types'

/**
 * Directly applies a mask to a region of PixelData,
 * modifying the destination's alpha channel in-place.
 * @returns true if any pixels were actually modified.
 */
export function applyAlphaMaskToPixelData(
  dst: IPixelData,
  mask: AlphaMask,
  opts: ApplyMaskToPixelDataOptions = {},
): boolean {
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: width = dst.width,
    h: height = dst.height,
    alpha: globalAlpha = 255,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  if (globalAlpha === 0) return false

  // 1. Initial Destination Clipping
  let x = targetX
  let y = targetY
  let w = width
  let h = height

  if (x < 0) {
    w += x
    x = 0
  }

  if (y < 0) {
    h += y
    y = 0
  }

  w = Math.min(w, dst.width - x)
  h = Math.min(h, dst.height - y)

  if (w <= 0) return false
  if (h <= 0) return false

  // 2. Determine Source Dimensions
  const mPitch = mask.w
  if (mPitch <= 0) return false

  // 3. Source Bounds Clipping
  // Calculate where we would start reading in the mask
  const startX = mx + (x - targetX)
  const startY = my + (y - targetY)

  // Find the safe overlap between the requested region and the mask bounds
  const sX0 = Math.max(0, startX)
  const sY0 = Math.max(0, startY)
  const sX1 = Math.min(mPitch, startX + w)
  const sY1 = Math.min(mask.h, startY + h)

  const finalW = sX1 - sX0
  const finalH = sY1 - sY0

  // This is where your failing tests are now caught
  if (finalW <= 0) return false
  if (finalH <= 0) return false

  // 4. Align Destination with Source Clipping
  // If the source was clipped on the top/left, we must shift the destination start
  const xShift = sX0 - startX
  const yShift = sY0 - startY

  const dst32 = dst.data32
  const dw = dst.width
  const dStride = dw - finalW
  const mStride = mPitch - finalW
  const maskData = mask.data

  let dIdx = (y + yShift) * dw + (x + xShift)
  let mIdx = sY0 * mPitch + sX0

  let didChange = false
  for (let iy = 0; iy < h; iy++) {
    for (let ix = 0; ix < w; ix++) {
      const mVal = maskData[mIdx]
      // Unified logic branch inside the hot path
      const effectiveM = invertMask ? 255 - mVal : mVal

      let weight = 0

      if (effectiveM === 0) {
        weight = 0
      } else if (effectiveM === 255) {
        weight = globalAlpha
      } else if (globalAlpha === 255) {
        weight = effectiveM
      } else {
        weight = (effectiveM * globalAlpha + 128) >> 8
      }

      if (weight === 0) {
        // Clear alpha channel
        dst32[dIdx] = (dst32[dIdx] & 0x00ffffff) >>> 0
        didChange = true
      } else if (weight !== 255) {
        // Merge alpha channel
        const d = dst32[dIdx]
        const da = d >>> 24

        if (da !== 0) {
          const finalAlpha = da === 255 ? weight : (da * weight + 128) >> 8

          const current = dst32[dIdx] as Color32
          const next = ((d & 0x00ffffff) | (finalAlpha << 24)) >>> 0
          if (current !== next) {
            dst32[dIdx] = next
            didChange = true
          }
        }
      }

      dIdx++
      mIdx++
    }

    dIdx += dStride
    mIdx += mStride
  }
  return didChange
}
