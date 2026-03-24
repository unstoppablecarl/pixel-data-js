import type { Rect } from '../_types'

export function getRectBrushOrPencilBounds(
  centerX: number,
  centerY: number,
  brushWidth: number,
  brushHeight: number,
  targetWidth: number,
  targetHeight: number,
  out?: Rect,
): Rect {
  const startX = Math.floor(centerX - brushWidth / 2)
  const startY = Math.floor(centerY - brushHeight / 2)
  const endX = startX + brushWidth
  const endY = startY + brushHeight

  const res = out ?? {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  const cStartX = Math.max(0, startX)
  const cStartY = Math.max(0, startY)
  const cEndX = Math.min(targetWidth, endX)
  const cEndY = Math.min(targetHeight, endY)

  const w = cEndX - cStartX
  const h = cEndY - cStartY

  res.x = cStartX
  res.y = cStartY
  res.w = w < 0 ? 0 : w
  res.h = h < 0 ? 0 : h

  return res
}
