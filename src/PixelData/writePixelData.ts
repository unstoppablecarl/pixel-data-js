import type { PixelData32 } from './_pixelData-types'

/**
 * Writes PixelData from a source to a target.
 * @param target - The destination to write to.
 * @param source - The source to read from.
 * @param x - The x-coordinate in the target where drawing starts.
 * @param y - The y-coordinate in the target where drawing starts.
 */
export function writePixelData(
  target: PixelData32,
  source: PixelData32,
  x = 0,
  y = 0,
): void {
  const dstW = target.w
  const dstH = target.h
  const dst = target.data

  const srcW = source.w
  const srcH = source.h
  const src = source.data

  let dstX = x
  let dstY = y
  let srcX = 0
  let srcY = 0
  let copyW = srcW
  let copyH = srcH

  if (dstX < 0) {
    srcX = -dstX
    copyW += dstX
    dstX = 0
  }

  if (dstY < 0) {
    srcY = -dstY
    copyH += dstY
    dstY = 0
  }

  copyW = Math.min(copyW, dstW - dstX)
  copyH = Math.min(copyH, dstH - dstY)

  if (copyW <= 0 || copyH <= 0) return

  for (let row = 0; row < copyH; row++) {
    const dstStart = (dstY + row) * dstW + dstX
    const srcStart = (srcY + row) * srcW + srcX
    const chunk = src.subarray(srcStart, srcStart + copyW)

    dst.set(chunk, dstStart)
  }
}
