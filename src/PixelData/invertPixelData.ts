import { type IPixelData32, type PixelMutateOptions } from '../_types'
import { makeClippedRect, resolveRectClipping } from '../Internal/resolveClipping'

const SCRATCH_RECT = makeClippedRect()

export function invertPixelData(
  pixelData: IPixelData32,
  opts: PixelMutateOptions = {},
): boolean {
  const dst = pixelData
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: width = pixelData.width,
    h: height = pixelData.height,
    mask,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  const clip = resolveRectClipping(targetX, targetY, width, height, dst.width, dst.height, SCRATCH_RECT)

  if (!clip.inBounds) return false

  const {
    x,
    y,
    w: actualW,
    h: actualH,
  } = clip

  const dst32 = dst.data32
  const dw = dst.width
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
