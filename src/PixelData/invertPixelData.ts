import { type PixelMutateOptions } from '../_types'
import type { PixelData32 } from './_pixelData-types'

/**
 * Inverts the RGB color data of the target PixelData, optionally controlled by a mask.
 * @param target - The target to modify.
 * @param opts - Options defining the area, mask, and offsets.
 * @returns true if the operation was performed within bounds.
 */
export function invertPixelData(
  target: PixelData32,
  opts?: PixelMutateOptions,
): boolean {
  const targetW = target.w
  const targetH = target.h

  const mask = opts?.mask
  const invertMask = opts?.invertMask ?? false

  const targetX = opts?.x ?? 0
  const targetY = opts?.y ?? 0
  const mx = opts?.mx ?? 0
  const my = opts?.my ?? 0
  const w = opts?.w ?? targetW
  const h = opts?.h ?? targetH

  // Inline clipping logic
  let x = targetX
  let y = targetY
  let actualW = w
  let actualH = h

  if (x < 0) {
    actualW += x
    x = 0
  }

  if (y < 0) {
    actualH += y
    y = 0
  }

  actualW = Math.min(actualW, targetW - x)
  actualH = Math.min(actualH, targetH - y)

  if (actualW <= 0 || actualH <= 0) return false

  const dst32 = target.data
  const dw = targetW

  // Calculate relative movement for the mask coordinate
  const dx = x - targetX
  const dy = y - targetY

  let dIdx = y * dw + x
  const dStride = dw - actualW

  if (mask) {
    const maskData = mask.data
    const mPitch = mask.w
    let mIdx = (my + dy) * mPitch + (mx + dx)
    const mStride = mPitch - actualW

    for (let iy = 0; iy < actualH; iy++) {
      for (let ix = 0; ix < actualW; ix++) {
        const mVal = maskData[mIdx]
        const isHit = invertMask
          ? mVal === 0
          : mVal === 1

        if (isHit) {
          // XOR with 0x00FFFFFF flips RGB bits and ignores Alpha
          dst32[dIdx] = dst32[dIdx] ^ 0x00FFFFFF
        }
        dIdx++
        mIdx++
      }
      dIdx += dStride
      mIdx += mStride
    }
  } else {
    for (let iy = 0; iy < actualH; iy++) {
      for (let ix = 0; ix < actualW; ix++) {
        dst32[dIdx] = dst32[dIdx] ^ 0x00FFFFFF
        dIdx++
      }
      dIdx += dStride
    }
  }

  return true
}
