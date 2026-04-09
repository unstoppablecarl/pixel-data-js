import type { Rect } from '../Rect/_rect-types'
import { makeClippedBlit } from '../Rect/resolveClipping'
import type { ImageDataLike } from './_ImageData-types'

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
  if (w <= 0) return new Uint8ClampedArray(0)
  if (h <= 0) return new Uint8ClampedArray(0)

  const srcW = imageData.width
  const srcH = imageData.height
  const src = imageData.data

  const outLen = w * h * 4
  const out = new Uint8ClampedArray(outLen)

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

  if (copyW <= 0) return out
  if (copyH <= 0) return out

  // 2. Perform high-speed block copy
  // Attempt to use a 32-bit view if the buffer is memory-aligned.
  // This reduces loop iterations and arithmetic by 4x.
  const isAligned = src.byteOffset % 4 === 0

  if (isAligned) {
    const srcLen32 = src.byteLength / 4
    const src32 = new Uint32Array(src.buffer, src.byteOffset, srcLen32)
    const out32 = new Uint32Array(out.buffer)

    for (let row = 0; row < copyH; row++) {
      const srcStart = (srcY + row) * srcW + srcX
      const dstStart = (dstY + row) * w + dstX
      const chunk = src32.subarray(srcStart, srcStart + copyW)

      out32.set(chunk, dstStart)
    }
  } else {
    // Fallback for unaligned data
    const rowLen = copyW * 4

    for (let row = 0; row < copyH; row++) {
      const srcStart = ((srcY + row) * srcW + srcX) * 4
      const dstStart = ((dstY + row) * w + dstX) * 4
      const chunk = src.subarray(srcStart, srcStart + rowLen)

      out.set(chunk, dstStart)
    }
  }

  return out
}
