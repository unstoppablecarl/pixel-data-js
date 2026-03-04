import type { Rect } from '../_types'
import type { PixelData } from './PixelData'

/**
 * Extracts a rectangular region of pixels from PixelData.
 * Returns a new Uint32Array containing the extracted pixels.
 */
export function extractPixelDataBuffer(source: PixelData, rect: Rect): Uint32Array
export function extractPixelDataBuffer(source: PixelData, x: number, y: number, w: number, h: number): Uint32Array
export function extractPixelDataBuffer(
  source: PixelData,
  _x: Rect | number,
  _y?: number,
  _w?: number,
  _h?: number,
): Uint32Array {
  const { x, y, w, h } = typeof _x === 'object'
    ? _x
    : { x: _x, y: _y!, w: _w!, h: _h! }

  const srcW = source.width
  const srcH = source.height
  const srcData = source.data32

  // Safety check for empty or invalid dimensions
  if (w <= 0 || h <= 0) {
    return new Uint32Array(0)
  }

  // Create a new ImageData to get a clean, aligned buffer
  const dstImageData = new ImageData(w, h)
  const dstData = new Uint32Array(dstImageData.data.buffer)

  const x0 = Math.max(0, x)
  const y0 = Math.max(0, y)
  const x1 = Math.min(srcW, x + w)
  const y1 = Math.min(srcH, y + h)

  // Return empty buffer if no intersection
  if (x1 <= x0 || y1 <= y0) {
    return dstData
  }

  const copyWidth = x1 - x0
  const copyHeight = y1 - y0

  for (let row = 0; row < copyHeight; row++) {
    const srcRow = y0 + row
    const srcStart = srcRow * srcW + x0

    const dstRow = (y0 - y) + row
    const dstCol = (x0 - x)
    const dstStart = dstRow * w + dstCol

    // Perform the high-speed 32-bit bulk copy
    const chunk = srcData.subarray(srcStart, srcStart + copyWidth)
    dstData.set(chunk, dstStart)
  }

  return dstData
}
