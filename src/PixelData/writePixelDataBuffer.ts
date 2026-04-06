import { type PixelData32, type Rect } from '../_types'
import { makeClippedBlit, resolveBlitClipping } from '../Rect/resolveClipping'

const SCRATCH_BLIT = makeClippedBlit()

/**
 * Copies a pixel buffer into a specific region of a {@link PixelData32} object.
 *
 * This function performs a direct memory copy from a {@link Uint32Array}
 * into the target buffer.
 */
export function writePixelDataBuffer(
  target: PixelData32,
  data: Uint32Array,
  rect: Rect,
): void
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
  const { x, y, w, h } = typeof _x === 'object'
    ? _x
    : {
      x: _x,
      y: _y!,
      w: _w!,
      h: _h!,
    }

  const dstW = target.w
  const dstH = target.h
  const dstData = target.data

  // treat the source buffer as a Source Image starting at 0,0 with size w,h
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

  for (let row = 0; row < copyH; row++) {
    const dstStart = (dstY + row) * dstW + dstX
    const srcStart = (srcY + row) * w + srcX

    dstData.set(data.subarray(srcStart, srcStart + copyW), dstStart)
  }
}
