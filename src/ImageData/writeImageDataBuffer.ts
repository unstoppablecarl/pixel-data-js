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
  const { x, y, w, h } = typeof _x === 'object'
    ? _x
    : { x: _x, y: _y!, w: _w!, h: _h! }

  const { width: dstW, height: dstH, data: dst } = target

  const clip = resolveBlitClipping(
    x,
    y,
    0,
    0,
    w,
    h,
    dstW,
    dstH,
    w,
    h,
    SCRATCH_BLIT,
  )

  if (!clip.inBounds) return

  const {
    x: dstX,
    y: dstY,
    sx: srcX,
    sy: srcY,
    w: copyW,
    h: copyH,
  } = clip

  const rowLen = copyW * 4

  for (let row = 0; row < copyH; row++) {
    const dstStart = ((dstY + row) * dstW + dstX) * 4
    const srcStart = ((srcY + row) * w + srcX) * 4

    dst.set(data.subarray(srcStart, srcStart + rowLen), dstStart)
  }
}
