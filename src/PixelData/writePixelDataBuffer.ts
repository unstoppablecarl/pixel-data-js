import type { Rect } from '../Rect/_rect-types'
import type { PixelData32 } from './_pixelData-types'

/**
 * Copies a pixel buffer into a specific region of a {@link PixelData32} object.
 * @param target - The target to write into.
 * @param data - The source pixel data (Uint32Array).
 * @param rect - A rect defining the destination region.
 */
export function writePixelDataBuffer(
  target: PixelData32,
  data: Uint32Array,
  rect: Rect,
): void
/**
 * @param target - The target to write into.
 * @param data - The source pixel data (Uint32Array).
 * @param x - The starting horizontal coordinate in the target.
 * @param y - The starting vertical coordinate in the target.
 * @param w - The width of the region to write.
 * @param h - The height of the region to write.
 */
export function writePixelDataBuffer(
  target: PixelData32,
  data: Uint32Array,
  x: number,
  y: number,
  w: number,
  h: number,
): void
export function writePixelDataBuffer(
  target: PixelData32,
  data: Uint32Array,
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

  if (w <= 0 || h <= 0) return

  const dstW = target.w
  const dstH = target.h
  const dstData = target.data

  // Inline clipping logic
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

  if (copyW <= 0 || copyH <= 0) return

  for (let row = 0; row < copyH; row++) {
    const dstStart = (dstY + row) * dstW + dstX
    const srcStart = (srcY + row) * w + srcX
    const chunk = data.subarray(srcStart, srcStart + copyW)

    dstData.set(chunk, dstStart)
  }
}
