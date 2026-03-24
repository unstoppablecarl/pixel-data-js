import type { Rect } from '../_types'

export function getCircleBrushOrPencilStrokeBounds(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  brushSize: number,
  result: Rect,
): Rect {
  const r = Math.ceil(brushSize / 2)

  const minX = Math.min(x0, x1) - r
  const minY = Math.min(y0, y1) - r
  const maxX = Math.max(x0, x1) + r
  const maxY = Math.max(x0, y1) + r

  result.x = Math.floor(minX)
  result.y = Math.floor(minY)
  result.w = Math.ceil(maxX - minX)
  result.h = Math.ceil(maxY - minY)

  return result
}
