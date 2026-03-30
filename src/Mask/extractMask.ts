import { type Mask, type Rect } from '../_types'

/**
 * Extracts a rectangular region from a 1D {@link Uint8Array} mask.
 * This utility calculates the necessary offsets based on the `maskWidth` to
 * slice out a specific area.
 *
 * @param mask - The target mask.
 * @param rect - A rect defining the region to extract.
 * @returns A new mask containing the extracted region.
 */
export function extractMask<T extends Mask>(
  mask: T,
  rect: Rect,
): T

/**
 * @param mask - The target mask.
 * @param x - The starting horizontal coordinate.
 * @param y - The starting vertical coordinate.
 * @param w - The width of the region to extract.
 * @param h - The height of the region to extract.
 * @returns A new {@link Uint8Array} containing the extracted region.
 */
export function extractMask<T extends Mask>(
  mask: T,
  x: number,
  y: number,
  w: number,
  h: number,
): T
export function extractMask<T extends Mask>(
  mask: T,
  xOrRect: number | Rect,
  y?: number,
  w?: number,
  h?: number,
): T {
  let finalX: number
  let finalY: number
  let finalW: number
  let finalH: number

  if (typeof xOrRect === 'object') {
    finalX = xOrRect.x
    finalY = xOrRect.y
    finalW = xOrRect.w
    finalH = xOrRect.h
  } else {
    finalX = xOrRect
    finalY = y!
    finalW = w!
    finalH = h!
  }

  const out = {
    type: mask.type,
    w: finalW,
    h: finalH,
    data: new Uint8Array(finalW * finalH),
  } as T

  // Calculate the total height of the source mask based on the buffer size
  const srcH = mask.h
  const stride = mask.w

  for (let row = 0; row < finalH; row++) {
    const currentSrcY = finalY + row

    // Safety Check: If the requested row is outside the source mask, skip it (leave as 0)
    if (currentSrcY < 0 || currentSrcY >= srcH) continue

    // Calculate valid horizontal range within the source stride
    // We only copy if srcX is within the actual bounds of the source width
    const start = Math.max(0, finalX)
    const end = Math.min(stride, finalX + finalW)

    if (start < end) {
      const srcOffset = currentSrcY * stride + start
      const dstOffset = row * finalW + (start - finalX)
      const count = end - start

      out.data.set(mask.data.subarray(srcOffset, srcOffset + count), dstOffset)
    }
  }

  return out
}
