import type { Rect } from '../_types'

/**
 * Extracts a rectangular region from a 1D {@link Uint8Array} mask.
 * This utility calculates the necessary offsets based on the `maskWidth` to
 * slice out a specific area.
 *
 * @param mask - The source 1D array representing the full 2D mask.
 * @param maskWidth - The width of the original source mask (stride).
 * @param rect - A {@link Rect} object defining the region to extract.
 * @returns A new {@link Uint8Array} containing the extracted region.
 */
export function extractMask(
  mask: Uint8Array,
  maskWidth: number,
  rect: Rect,
): Uint8Array
/**
 * @param mask - The source 1D array representing the full 2D mask.
 * @param maskWidth - The width of the original source mask (stride).
 * @param x - The starting horizontal coordinate.
 * @param y - The starting vertical coordinate.
 * @param w - The width of the region to extract.
 * @param h - The height of the region to extract.
 * @returns A new {@link Uint8Array} containing the extracted region.
 */
export function extractMask(
  mask: Uint8Array,
  maskWidth: number,
  x: number,
  y: number,
  w: number,
  h: number,
): Uint8Array
export function extractMask(
  mask: Uint8Array,
  maskWidth: number,
  xOrRect: number | Rect,
  y?: number,
  w?: number,
  h?: number,
): Uint8Array {
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

  const out = new Uint8Array(finalW * finalH)
  const srcH = mask.length / maskWidth

  for (let row = 0; row < finalH; row++) {
    const currentSrcY = finalY + row

    if (currentSrcY < 0 || currentSrcY >= srcH) {
      continue
    }

    const start = Math.max(0, finalX)
    const end = Math.min(maskWidth, finalX + finalW)

    if (start < end) {
      const srcOffset = currentSrcY * maskWidth + start
      const dstOffset = (row * finalW) + (start - finalX)
      const count = end - start

      out.set(
        mask.subarray(srcOffset, srcOffset + count),
        dstOffset,
      )
    }
  }

  return out
}
