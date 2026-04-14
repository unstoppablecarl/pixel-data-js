import type { Rect } from '../Rect/_rect-types'
import type { MutablePixelData, PixelData, PixelData32 } from './_pixelData-types'
import { cropPixelData } from './cropPixelData'

export function getPixelDataTransparentTrimmedBounds(target: PixelData32): Rect | null {
  let minX = target.w
  let minY = target.h
  let maxX = -1
  let maxY = -1

  for (let y = 0; y < target.h; y++) {
    for (let x = 0; x < target.w; x++) {
      const alpha = target.data[y * target.w + x] >>> 24
      if (alpha !== 0) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }

  if (maxX === -1) return null

  return {
    x: minX,
    y: minY,
    w: maxX - minX + 1,
    h: maxY - minY + 1,
  }
}

export function trimTransparentPixelData(target: PixelData32): PixelData {
  const r = getPixelDataTransparentTrimmedBounds(target)
  if (!r) {
    throw new Error('PixelData is fully transparent — no crop bounds found')
  }

  return cropPixelData(target, r.x, r.y, r.w, r.h)
}

export function trimTransparentPixelDataInPlace(target: MutablePixelData) {
  const r = getPixelDataTransparentTrimmedBounds(target)
  if (!r) {
    throw new Error('PixelData is fully transparent — no crop bounds found')
  }

  cropPixelData(target, r.x, r.y, r.w, r.h, target)
}
