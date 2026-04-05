import { type ApplyMaskToPixelDataOptions, type BinaryMask, type PixelData32 } from '../_types'

/**
 * Directly applies a mask to a region of PixelData,
 * modifying the destination's alpha channel in-place.
 * @returns true if any pixels were actually modified.
 */
export function applyBinaryMaskToPixelData(
  target: PixelData32,
  mask: BinaryMask,
  opts?: ApplyMaskToPixelDataOptions,
): boolean {
  const targetX = opts?.x ?? 0
  const targetY = opts?.y ?? 0
  const width = opts?.w ?? target.width
  const height = opts?.h ?? target.height
  const globalAlpha = opts?.alpha ?? 255
  const mx = opts?.mx ?? 0
  const my = opts?.my ?? 0
  const invertMask = opts?.invertMask ?? false

  if (globalAlpha === 0) return false

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

  w = Math.min(w, target.width - x)
  h = Math.min(h, target.height - y)

  if (w <= 0 || h <= 0) return false

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

  if (finalW <= 0 || finalH <= 0) {
    return false
  }

  // 4. Align Destination with Source Clipping
  // If the source was clipped on the top/left, we must shift the destination start
  const xShift = sX0 - startX
  const yShift = sY0 - startY

  const dst32 = target.data32
  const dw = target.width
  const dStride = dw - finalW
  const mStride = mPitch - finalW
  const maskData = mask.data

  let dIdx = (y + yShift) * dw + (x + xShift)
  let mIdx = sY0 * mPitch + sX0
  let didChange = false

  for (let iy = 0; iy < finalH; iy++) {
    for (let ix = 0; ix < finalW; ix++) {
      const mVal = maskData[mIdx]
      const isMaskedOut = invertMask ? mVal !== 0 : mVal === 0

      if (isMaskedOut) {
        const current = dst32[dIdx]
        const next = (current & 0x00ffffff) >>> 0
        if (current !== next) {
          dst32[dIdx] = next
          didChange = true
        }
      } else if (globalAlpha !== 255) {
        const d = dst32[dIdx]
        const da = d >>> 24

        if (da !== 0) {
          const finalAlpha = da === 255 ? globalAlpha : (da * globalAlpha + 128) >> 8
          const next = ((d & 0x00ffffff) | (finalAlpha << 24)) >>> 0
          if (d !== next) {
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
