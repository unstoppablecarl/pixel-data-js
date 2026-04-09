import type { Rect } from '../Rect/_rect-types'
import type { PixelData32 } from './_pixelData-types'

/**
 * Extracts a rectangular region of pixels from PixelData.
 * Returns a new Uint32Array containing the extracted pixels.
 */
export function extractPixelDataBuffer(
  source: PixelData32,
  rect: Rect,
): Uint32Array
export function extractPixelDataBuffer(
  source: PixelData32,
  x: number,
  y: number,
  w: number,
  h: number,
): Uint32Array
export function extractPixelDataBuffer(
  source: PixelData32,
  _x: Rect | number,
  _y?: number,
  _w?: number,
  _h?: number,
): Uint32Array {
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

  const srcW = source.w
  const srcH = source.h
  const srcData = source.data

  if (w <= 0 || h <= 0) return new Uint32Array(0)

  const dstData = new Uint32Array(w * h)

  // Inline clipping logic to avoid object allocations
  let srcX = x
  let srcY = y
  let dstX = 0
  let dstY = 0
  let copyW = w
  let copyH = h

  if (srcX < 0) {
    dstX = -srcX
    copyW += srcX
    srcX = 0
  }

  if (srcY < 0) {
    dstY = -srcY
    copyH += srcY
    srcY = 0
  }

  copyW = Math.min(copyW, srcW - srcX)
  copyH = Math.min(copyH, srcH - srcY)

  if (copyW <= 0 || copyH <= 0) return dstData

  for (let row = 0; row < copyH; row++) {
    const srcStart = (srcY + row) * srcW + srcX
    const dstStart = (dstY + row) * w + dstX
    const chunk = srcData.subarray(srcStart, srcStart + copyW)

    dstData.set(chunk, dstStart)
  }

  return dstData
}
