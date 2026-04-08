import { MaskType, type NullableBinaryMaskRect } from '../Mask/_mask-types'
import { getRectsBounds } from '../Rect/getRectsBounds'

export function merge2BinaryMaskRects(
  a: NullableBinaryMaskRect,
  b: NullableBinaryMaskRect,
): NullableBinaryMaskRect {
  const bounds = getRectsBounds([a, b])

  // If both are fully selected, check if they form a perfect, gapless rectangle
  if (
    (a.data === null || a.data === undefined)
    && (b.data === null || b.data === undefined)
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
        data: null,
        type: null,
      }
    }
  }

  const maskData = new Uint8Array(bounds.w * bounds.h)

  // --- Write A's contribution ---
  const aOffY = a.y - bounds.y
  const aOffX = a.x - bounds.x

  if (a.data === undefined || a.data === null) {
    for (let ay = 0; ay < a.h; ay++) {
      const destRow = (aOffY + ay) * bounds.w + aOffX
      maskData.fill(1, destRow, destRow + a.w)
    }
  } else {
    for (let ay = 0; ay < a.h; ay++) {
      const srcRow = ay * a.w
      const destRow = (aOffY + ay) * bounds.w + aOffX
      maskData.set(a.data.subarray(srcRow, srcRow + a.w), destRow)
    }
  }

  // --- OR B's contribution ---
  const bOffY = b.y - bounds.y
  const bOffX = b.x - bounds.x

  if (b.data === undefined || b.data === null) {
    for (let by = 0; by < b.h; by++) {
      const destRow = (bOffY + by) * bounds.w + bOffX
      maskData.fill(1, destRow, destRow + b.w)
    }
  } else {
    for (let by = 0; by < b.h; by++) {
      const srcRow = by * b.w
      const destRow = (bOffY + by) * bounds.w + bOffX

      for (let bx = 0; bx < b.w; bx++) {
        maskData[destRow + bx] |= b.data[srcRow + bx]
      }
    }
  }

  return {
    ...bounds,
    data: maskData,
    type: MaskType.BINARY,
  }
}
