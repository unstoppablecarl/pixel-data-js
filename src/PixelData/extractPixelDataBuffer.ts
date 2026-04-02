import type { IPixelData32, Rect } from '../_types'
import { makeClippedBlit, resolveBlitClipping } from '../Internal/resolveClipping'

const SCRATCH_BLIT = makeClippedBlit()

/**
 * Extracts a rectangular region of pixels from PixelData.
 * Returns a new Uint32Array containing the extracted pixels.
 */
export function extractPixelDataBuffer(source: IPixelData32, rect: Rect): Uint32Array
export function extractPixelDataBuffer(source: IPixelData32, x: number, y: number, w: number, h: number): Uint32Array
export function extractPixelDataBuffer(
  source: IPixelData32,
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

  const dstData = new Uint32Array(w * h)

  // We map from Source (srcW, srcH) at (x,y)
  // To Dest (w, h) at (0,0)
  // Note: resolveBlitClipping usually takes (dstX, dstY, srcX, srcY...)
  // Here we are "blitting" FROM x,y TO 0,0.
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

  if (!clip.inBounds) return dstData

  const {
    x: dstX,
    y: dstY,
    sx: srcX,
    sy: srcY,
    w: copyW,
    h: copyH,
  } = clip

  for (let row = 0; row < copyH; row++) {
    const srcStart = (srcY + row) * srcW + srcX
    const dstStart = (dstY + row) * w + dstX

    // Perform the high-speed 32-bit bulk copy
    const chunk = srcData.subarray(srcStart, srcStart + copyW)
    dstData.set(chunk, dstStart)
  }

  return dstData
}
