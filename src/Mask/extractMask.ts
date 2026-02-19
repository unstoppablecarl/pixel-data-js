import type { Rect } from '../_types'

export function extractMask(
  mask: Uint8Array,
  maskWidth: number,
  rect: Rect,
): Uint8Array

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
