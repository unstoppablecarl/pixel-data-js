import type { Rect } from '../_types'

export function getCircleBrushOrPencilBounds(
  centerX: number,
  centerY: number,
  brushSize: number,
  targetWidth: number,
  targetHeight: number,
  out?: Rect,
): Rect {
  const r = brushSize / 2

  const minOffset = -Math.ceil(r - 0.5)
  const maxOffset = Math.floor(r - 0.5)

  // start is inclusive, end is exclusive
  const startX = Math.floor(centerX + minOffset)
  const startY = Math.floor(centerY + minOffset)
  const endX = Math.floor(centerX + maxOffset) + 1
  const endY = Math.floor(centerY + maxOffset) + 1

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
