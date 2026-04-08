import { type ApplyMaskToPixelDataOptions, type PixelData32 } from '../_types'
import type { AlphaMask } from '../Mask/_mask-types'

/**
 * Directly applies a mask to a region of PixelData,
 * modifying the destination's alpha channel in-place.
 * @returns true if any pixels were actually modified.
 */
export function applyAlphaMaskToPixelData(
  target: PixelData32,
  mask: AlphaMask,
  opts?: ApplyMaskToPixelDataOptions,
): boolean {
  const targetX = opts?.x ?? 0
  const targetY = opts?.y ?? 0
  const width = opts?.w ?? target.w
  const height = opts?.h ?? target.h
  const globalAlpha = opts?.alpha ?? 255
  const mx = opts?.mx ?? 0
  const my = opts?.my ?? 0
  const invertMask = opts?.invertMask ?? false

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

  w = Math.min(w, target.w - x)
  h = Math.min(h, target.h - y)

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

  const dst32 = target.data
  const dw = target.w
  const dStride = dw - finalW
  const mStride = mPitch - finalW
  const maskData = mask.data

  let dIdx = (y + yShift) * dw + (x + xShift)
  let mIdx = sY0 * mPitch + sX0

  let didChange = false
  if (invertMask) {
    for (let iy = 0; iy < finalH; iy++) {
      for (let ix = 0; ix < finalW; ix++) {
        const effectiveM = 255 - maskData[mIdx]

        if (effectiveM === 0) {
          const current = dst32[dIdx]
          const next = (current & 0x00ffffff) >>> 0

          if (current !== next) {
            dst32[dIdx] = next
            didChange = true
          }
        } else {
          const t1 = effectiveM * globalAlpha + 128
          const weight = (t1 + (t1 >> 8)) >> 8

          if (weight < 255) {
            const current = dst32[dIdx]
            const da = current >>> 24

            if (da !== 0) {
              const t2 = da * weight + 128
              const finalAlpha = (t2 + (t2 >> 8)) >> 8
              const next = ((current & 0x00ffffff) | (finalAlpha << 24)) >>> 0

              if (current !== next) {
                dst32[dIdx] = next
                didChange = true
              }
            }
          }
        }

        dIdx++
        mIdx++
      }
      dIdx += dStride
      mIdx += mStride
    }
  } else {
    for (let iy = 0; iy < finalH; iy++) {
      for (let ix = 0; ix < finalW; ix++) {
        const effectiveM = maskData[mIdx]

        if (effectiveM === 0) {
          const current = dst32[dIdx]
          const next = (current & 0x00ffffff) >>> 0

          if (current !== next) {
            dst32[dIdx] = next
            didChange = true
          }
        } else {
          const t1 = effectiveM * globalAlpha + 128
          const weight = (t1 + (t1 >> 8)) >> 8

          if (weight < 255) {
            const current = dst32[dIdx]
            const da = current >>> 24

            if (da !== 0) {
              const t2 = da * weight + 128
              const finalAlpha = (t2 + (t2 >> 8)) >> 8
              const next = ((current & 0x00ffffff) | (finalAlpha << 24)) >>> 0

              if (current !== next) {
                dst32[dIdx] = next
                didChange = true
              }
            }
          }
        }

        dIdx++
        mIdx++
      }
      dIdx += dStride
      mIdx += mStride
    }
  }
  return didChange
}
