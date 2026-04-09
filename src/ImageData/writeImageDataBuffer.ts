import type { Rect } from '../Rect/_rect-types'
import { makeClippedBlit, resolveBlitClipping } from '../Rect/resolveClipping'

const SCRATCH_BLIT = makeClippedBlit()

/**
 * Copies a pixel buffer into a specific region of an {@link ImageData} object.
 *
 * This function performs a direct memory copy from a {@link Uint8ClampedArray}
 * into the target {@link ImageData} buffer. It supports both {@link Rect}
 * objects and discrete coordinates.
 *
 * @param target - The target to write into. Must match the rect width/height.
 * @param data - The source pixel data (RGBA).
 * @param rect - A rect defining the destination region.
 */
export function writeImageDataBuffer(
  target: ImageData,
  data: Uint8ClampedArray,
  rect: Rect,
): void
/**
 * @param target - The target to write into.
 * @param data - The source pixel data (RGBA). Must match the width/height.
 * @param x - The starting horizontal coordinate in the target.
 * @param y - The starting vertical coordinate in the target.
 * @param w - The width of the region to write.
 * @param h - The height of the region to write.
 */
export function writeImageDataBuffer(
  target: ImageData,
  data: Uint8ClampedArray,
  x: number,
  y: number,
  w: number,
  h: number,
): void
export function writeImageDataBuffer(
  target: ImageData,
  data: Uint8ClampedArray,
  _x: Rect | number,
  _y?: number,
  _w?: number,
  _h?: number,
): void {
  let x: number
  let y: number
  let w: number
  let h: number

  if (typeof _x === 'object') {
    x = _x.x
    y = _x.y
    w = _x.w
    h = _x.h
  } else {
    x = _x
    y = _y!
    w = _w!
    h = _h!
  }

  if (w <= 0) return
  if (h <= 0) return

  const dstW = target.width
  const dstH = target.height
  const dst = target.data

  // Inline clipping logic for destination boundaries
  let dstX = x
  let dstY = y
  let srcX = 0
  let srcY = 0
  let copyW = w
  let copyH = h

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

  if (copyW <= 0) return
  if (copyH <= 0) return

  // Fast-path: Both arrays must be 4-byte aligned to use Uint32Array safely
  const isDstAligned = dst.byteOffset % 4 === 0
  const isSrcAligned = data.byteOffset % 4 === 0

  if (isDstAligned && isSrcAligned) {
    const dstLen32 = dst.byteLength / 4
    const dst32 = new Uint32Array(dst.buffer, dst.byteOffset, dstLen32)

    const srcLen32 = data.byteLength / 4
    const src32 = new Uint32Array(data.buffer, data.byteOffset, srcLen32)

    for (let row = 0; row < copyH; row++) {
      const dstStart = (dstY + row) * dstW + dstX
      const srcStart = (srcY + row) * w + srcX
      const chunk = src32.subarray(srcStart, srcStart + copyW)

      dst32.set(chunk, dstStart)
    }
  } else {
    // Fallback for unaligned data arrays
    const rowLen = copyW * 4

    for (let row = 0; row < copyH; row++) {
      const dstStart = ((dstY + row) * dstW + dstX) * 4
      const srcStart = ((srcY + row) * w + srcX) * 4
      const chunk = data.subarray(srcStart, srcStart + rowLen)

      dst.set(chunk, dstStart)
    }
  }
}
