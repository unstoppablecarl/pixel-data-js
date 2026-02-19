import type { ImageDataLike, Rect } from '../_types'

export function extractImageData(
  imageData: ImageDataLike,
  rect: Rect,
): Uint8ClampedArray
export function extractImageData(
  imageData: ImageDataLike,
  x: number,
  y: number,
  w: number,
  h: number,
): Uint8ClampedArray
export function extractImageData(
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

  const x0 = Math.max(0, x)
  const y0 = Math.max(0, y)
  const x1 = Math.min(srcW, x + w)
  const y1 = Math.min(srcH, y + h)

  // If no intersection, return the empty
  if (x1 <= x0 || y1 <= y0) return out

  for (let row = 0; row < (y1 - y0); row++) {
    // Where to read from the source canvas
    const srcRow = y0 + row
    const srcStart = (srcRow * srcW + x0) * 4
    const rowLen = (x1 - x0) * 4

    // Where to write into the 'out' patch
    const dstRow = (y0 - y) + row
    const dstCol = (x0 - x)
    const dstStart = (dstRow * w + dstCol) * 4

    // Perform the high-speed bulk copy
    out.set(src.subarray(srcStart, srcStart + rowLen), dstStart)
  }

  return out
}
