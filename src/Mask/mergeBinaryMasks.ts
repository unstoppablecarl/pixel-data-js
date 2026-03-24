import type { BinaryMask, MergeAlphaMasksOptions } from '../_types'

export function mergeBinaryMasks(
  dst: BinaryMask,
  dstWidth: number,
  src: BinaryMask,
  srcWidth: number,
  opts: MergeAlphaMasksOptions,
): void {
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: width = 0,
    h: height = 0,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts
  if (dstWidth <= 0) return
  if (srcWidth <= 0) return

  const dstHeight = (dst.length / dstWidth) | 0
  const srcHeight = (src.length / srcWidth) | 0

  // 1. Destination Clipping
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

  w = Math.min(w, dstWidth - x)
  h = Math.min(h, dstHeight - y)

  if (w <= 0) return
  if (h <= 0) return

  // 2. Source Bounds Clipping (Double Clipping)
  const startX = mx + (x - targetX)
  const startY = my + (y - targetY)

  const sX0 = Math.max(0, startX)
  const sY0 = Math.max(0, startY)
  const sX1 = Math.min(srcWidth, startX + w)
  const sY1 = Math.min(srcHeight, startY + h)

  const finalW = sX1 - sX0
  const finalH = sY1 - sY0

  if (finalW <= 0) return
  if (finalH <= 0) return

  // 3. Coordinate Alignment
  const xShift = sX0 - startX
  const yShift = sY0 - startY

  const dStride = dstWidth - finalW
  const sStride = srcWidth - finalW

  let dIdx = (y + yShift) * dstWidth + (x + xShift)
  let sIdx = sY0 * srcWidth + sX0

  for (let iy = 0; iy < finalH; iy++) {
    for (let ix = 0; ix < finalW; ix++) {
      const mVal = src[sIdx]
      // Determine if the source pixel effectively "clears" the destination
      const isMaskedOut = invertMask ? mVal !== 0 : mVal === 0

      if (isMaskedOut) {
        dst[dIdx] = 0
      }

      dIdx++
      sIdx++
    }

    dIdx += dStride
    sIdx += sStride
  }
}
