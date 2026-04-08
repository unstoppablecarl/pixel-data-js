import { type PixelMutateOptions } from '../_types'
import { makeClippedRect, resolveRectClipping } from '../Rect/resolveClipping'
import type { PixelData32 } from './_pixelData-types'

const SCRATCH_RECT = makeClippedRect()

export function invertPixelData(
  target: PixelData32,
  opts?: PixelMutateOptions,
): boolean {
  const mask = opts?.mask
  const targetX = opts?.x ?? 0
  const targetY = opts?.y ?? 0
  const mx = opts?.mx ?? 0
  const my = opts?.my ?? 0
  const width = opts?.w ?? target.w
  const height = opts?.h ?? target.h
  const invertMask = opts?.invertMask ?? false

  const clip = resolveRectClipping(targetX, targetY, width, height, target.w, target.h, SCRATCH_RECT)

  if (!clip.inBounds) return false

  const {
    x,
    y,
    w: actualW,
    h: actualH,
  } = clip

  const dst32 = target.data
  const dw = target.w
  const mPitch = mask?.w ?? width

  const dx = x - targetX
  const dy = y - targetY

  let dIdx = y * dw + x
  let mIdx = (my + dy) * mPitch + (mx + dx)

  const dStride = dw - actualW
  const mStride = mPitch - actualW

  // Optimization: Split loops to avoid checking `if (mask)` for every pixel.
  if (mask) {
    const maskData = mask.data
    for (let iy = 0; iy < actualH; iy++) {
      for (let ix = 0; ix < actualW; ix++) {
        const mVal = maskData[mIdx]
        const isHit = invertMask
          ? mVal === 0
          : mVal === 1

        if (isHit) {
          // XOR with 0x00FFFFFF flips RGB bits and ignores Alpha (the top 8 bits)
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
