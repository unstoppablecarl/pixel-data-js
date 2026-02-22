import type { Rect } from '../_types'

/**
 * Copies a pixel buffer into a specific region of an {@link ImageData} object.
 *
 * This function performs a direct memory copy from a {@link Uint8ClampedArray}
 * into the target {@link ImageData} buffer. It supports both {@link Rect}
 * objects and discrete coordinates.
 *
 * @param imageData - The target {@link ImageData} to write into. Must match the rect width/height.
 * @param data - The source pixel data (RGBA).
 * @param rect - A {@link Rect} object defining the destination region.
 */
export function writeImageDataPixels(
  imageData: ImageData,
  data: Uint8ClampedArray,
  rect: Rect,
): void
/**
 * @param imageData - The target {@link ImageData} to write into.
 * @param data - The source pixel data (RGBA). Must match the width/height.
 * @param x - The starting horizontal coordinate in the target.
 * @param y - The starting vertical coordinate in the target.
 * @param w - The width of the region to write.
 * @param h - The height of the region to write.
 */
export function writeImageDataPixels(
  imageData: ImageData,
  data: Uint8ClampedArray,
  x: number,
  y: number,
  w: number,
  h: number,
): void
export function writeImageDataPixels(
  imageData: ImageData,
  data: Uint8ClampedArray,
  _x: Rect | number,
  _y?: number,
  _w?: number,
  _h?: number,
): void {
  const { x, y, w, h } = typeof _x === 'object'
    ? _x
    : { x: _x, y: _y!, w: _w!, h: _h! }

  const { width: dstW, height: dstH, data: dst } = imageData

  // 1. Calculate the intersection of the patch and the canvas
  const x0 = Math.max(0, x)
  const y0 = Math.max(0, y)
  const x1 = Math.min(dstW, x + w)
  const y1 = Math.min(dstH, y + h)

  // If the intersection is empty, do nothing
  if (x1 <= x0 || y1 <= y0) return

  const rowLen = (x1 - x0) * 4
  const srcCol = x0 - x
  const srcYOffset = y0 - y
  const actualH = y1 - y0

  for (let row = 0; row < actualH; row++) {
    // Target index
    const dstStart = ((y0 + row) * dstW + x0) * 4

    // Source data index (must account for the offset if the rect was partially OOB)
    const srcRow = srcYOffset + row
    const o = (srcRow * w + srcCol) * 4

    dst.set(data.subarray(o, o + rowLen), dstStart)
  }
}
