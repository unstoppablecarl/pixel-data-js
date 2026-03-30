import type { NullableBinaryMaskRect } from '../_types'
import { getRectsBounds } from '../Rect/getRectsBounds'
import { makeBinaryMask } from './BinaryMask'

export function mergeBinaryMaskSelectionRects(
  a: NullableBinaryMaskRect,
  b: NullableBinaryMaskRect,
): NullableBinaryMaskRect {
  const bounds = getRectsBounds([a, b])

  // If both are fully selected, check if they form a perfect, gapless rectangle
  if (
    (a.mask === null || a.mask === undefined)
    && (b.mask === null || b.mask === undefined)
  ) {
    const ix = Math.max(a.x, b.x)
    const iy = Math.max(a.y, b.y)
    const ir = Math.min(a.x + a.w, b.x + b.w)
    const ib = Math.min(a.y + a.h, b.y + b.h)

    const iw = Math.max(0, ir - ix)
    const ih = Math.max(0, ib - iy)

    const intersectionArea = iw * ih
    const areaA = a.w * a.h
    const areaB = b.w * b.h
    const boundsArea = bounds.w * bounds.h

    if (boundsArea === areaA + areaB - intersectionArea) {
      return {
        ...bounds,
        mask: null,
      }
    }
  }

  const mask = makeBinaryMask(bounds.w, bounds.h)

  // --- Write A's contribution ---
  const aOffY = a.y - bounds.y
  const aOffX = a.x - bounds.x

  if (!a.mask) {
    for (let ay = 0; ay < a.h; ay++) {
      const destRow = (aOffY + ay) * bounds.w + aOffX
      mask.data.fill(1, destRow, destRow + a.w)
    }
  } else {
    for (let ay = 0; ay < a.h; ay++) {
      const srcRow = ay * a.w
      const destRow = (aOffY + ay) * bounds.w + aOffX
      mask.data.set(a.mask.data.subarray(srcRow, srcRow + a.w), destRow)
    }
  }

  // --- OR B's contribution ---
  const bOffY = b.y - bounds.y
  const bOffX = b.x - bounds.x

  if (!b.mask) {
    for (let by = 0; by < b.h; by++) {
      const destRow = (bOffY + by) * bounds.w + bOffX
      mask.data.fill(1, destRow, destRow + b.w)
    }
  } else {
    for (let by = 0; by < b.h; by++) {
      const srcRow = by * b.w
      const destRow = (bOffY + by) * bounds.w + bOffX

      for (let bx = 0; bx < b.w; bx++) {
        mask.data[destRow + bx] |= b.mask.data[srcRow + bx]
      }
    }
  }

  return {
    ...bounds,
    mask,
  }
}
