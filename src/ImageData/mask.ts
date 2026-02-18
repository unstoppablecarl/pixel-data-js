import type { AlphaMask, BinaryMask, ImageDataLike } from '../_types'

export type ApplyMaskOptions = {
  /**
   * The x-coordinate in the destination image where the mask begins.
   * @default 0
   */
  dx?: number

  /**
   * The y-coordinate in the destination image where the mask begins.
   * @default 0
   */
  dy?: number

  /**
   * The x-coordinate of the top-left corner of the sub-rectangle
   * of the source image to extract.
   * @default 0
   */
  sx?: number

  /**
   * The y-coordinate of the top-left corner of the sub-rectangle
   * of the source image to extract.
   * @default 0
   */
  sy?: number

  /**
   * The width of the sub-rectangle of the source image to extract.
   * Defaults to the full remaining width of the source.
   */
  sw?: number

  /**
   * The height of the sub-rectangle of the source image to extract.
   * Defaults to the full remaining height of the source.
   */
  sh?: number;
}

/**
 * Applies a binary (on/off) mask to an RGBA buffer.
 * If mask value is 0, pixel becomes transparent.
 */
export function applyBinaryMask(
  dst: ImageDataLike,
  mask: BinaryMask,
  opts: ApplyMaskOptions = {},
) {
  const { width: maskWidth, height: maskHeight } = mask

  const { dx = 0, dy = 0, sx = 0, sy = 0, sw = maskWidth, sh = maskHeight } = opts

  // 1. Calculate intersection boundaries
  const x0 = Math.max(0, dx, dx + (0 - sx))
  const y0 = Math.max(0, dy, dy + (0 - sy))
  const x1 = Math.min(dst.width, dx + sw, dx + (maskWidth - sx))
  const y1 = Math.min(dst.height, dy + sh, dy + (maskHeight - sy))

  if (x1 <= x0 || y1 <= y0) return

  const { data: dstData, width: dstW } = dst

  for (let y = y0; y < y1; y++) {
    const maskY = y - dy + sy
    const dstRowOffset = y * dstW * 4
    const maskRowOffset = maskY * maskWidth

    for (let x = x0; x < x1; x++) {
      const maskX = x - dx + sx
      const mIdx = maskRowOffset + maskX

      // Binary check: If mask is 0, kill the alpha
      if (mask.data[mIdx] === 0) {
        const aIdx = dstRowOffset + (x * 4) + 3
        dstData[aIdx] = 0
      }
    }
  }

  return dst
}

/**
 * Applies a smooth alpha mask to an RGBA buffer.
 * Multiplies existing Alpha by (maskValue / 255).
 */
export function applyAlphaMask(
  dst: ImageData,
  mask: AlphaMask,
  opts: ApplyMaskOptions = {},
): void {
  let { dx = 0, dy = 0, sx = 0, sy = 0, sw = mask.width, sh = mask.height } = opts

  // 1. Clipping Logic
  if (dx < 0) {
    sx -= dx
    sw += dx
    dx = 0
  }
  if (dy < 0) {
    sy -= dy
    sh += dy
    dy = 0
  }
  if (sx < 0) {
    dx -= sx
    sw += sx
    sx = 0
  }
  if (sy < 0) {
    dy -= sy
    sh += sy
    sy = 0
  }
  const actualW = Math.min(sw, dst.width - dx, mask.width - sx)
  const actualH = Math.min(sh, dst.height - dy, mask.height - sy)

  if (actualW <= 0 || actualH <= 0) return

  const dData = dst.data
  const mData = mask.data
  const dW = dst.width
  const mW = mask.width

  for (let y = 0; y < actualH; y++) {
    const dOffset = ((dy + y) * dW + dx) << 2
    const mOffset = (sy + y) * mW + sx

    for (let x = 0; x < actualW; x++) {
      const mVal = mData[mOffset + x]

      if (mVal === 255) continue

      const aIdx = dOffset + (x << 2) + 3

      // --- BRANCH: Zero Alpha ---
      if (mVal === 0) {
        dData[aIdx] = 0
        continue
      }

      // To get 101 from 200 * 128, we use the bias (a * m + 257) >> 8
      // 25600 + 257 = 25857. 25857 >> 8 = 101.
      dData[aIdx] = (dData[aIdx] * mVal + 257) >> 8
    }
  }
}
