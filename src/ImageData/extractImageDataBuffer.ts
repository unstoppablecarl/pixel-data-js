import type { ImageDataLike, Rect } from '../_types'
import { makeClippedBlit, resolveBlitClipping } from '../Internal/resolveClipping'

const SCRATCH_BLIT = makeClippedBlit()

/**
 * Extracts a specific rectangular region of pixels from a larger {@link ImageDataLike}
 * source into a new {@link Uint8ClampedArray}.
 *
 * This is a "read-only" operation that returns a copy of the pixel data.
 *
 * @param imageData - The source image data to read from.
 * @param rect - A rect defining the region to extract.
 * @returns A buffer containing the RGBA pixel data of the region.
 */
export function extractImageDataBuffer(
  imageData: ImageDataLike,
  rect: Rect,
): Uint8ClampedArray
/**
 * @param imageData - The source image data to read from.
 * @param x - The starting horizontal coordinate.
 * @param y - The starting vertical coordinate.
 * @param w - The width of the region to extract.
 * @param h - The height of the region to extract.
 * @returns A buffer containing the RGBA pixel data of the region.
 */
export function extractImageDataBuffer(
  imageData: ImageDataLike,
  x: number,
  y: number,
  w: number,
  h: number,
): Uint8ClampedArray
export function extractImageDataBuffer(
  imageData: ImageDataLike,
  _x: Rect | number,
  _y?: number,
  _w?: number,
  _h?: number,
): Uint8ClampedArray {
  const { x, y, w, h } = typeof _x === 'object'
    ? _x
    : { x: _x, y: _y!, w: _w!, h: _h! }

  const { width: srcW, height: srcH, data: src } = imageData
  // Safety check for invalid dimensions
  if (w <= 0 || h <= 0) return new Uint8ClampedArray(0)
  const out = new Uint8ClampedArray(w * h * 4)

  const clip = resolveBlitClipping(
    0,
    0,
    x,
    y,
    w,
    h,
    w,
    h,
    srcW,
    srcH,
    SCRATCH_BLIT,
  )

  if (!clip.inBounds) return out

  const { x: dstX, y: dstY, sx: srcX, sy: srcY, w: copyW, h: copyH } = clip
  const rowLen = copyW * 4

  for (let row = 0; row < copyH; row++) {
    const srcStart = ((srcY + row) * srcW + srcX) * 4
    const dstStart = ((dstY + row) * w + dstX) * 4

    // Perform the high-speed bulk copy
    out.set(src.subarray(srcStart, srcStart + rowLen), dstStart)
  }

  return out
}
