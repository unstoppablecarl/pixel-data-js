import type { Rect } from '../_types'

export function getRectBrushOrPencilStrokeBounds(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  brushWidth: number,
  brushHeight: number,
  result: Rect,
): Rect {
  const halfW = brushWidth / 2
  const halfH = brushHeight / 2

  const minX = Math.min(x0, x1) - halfW
  const minY = Math.min(y0, y1) - halfH
  const maxX = Math.max(x0, x1) + halfW
  const maxY = Math.max(y0, y1) + halfH

  result.x = Math.floor(minX)
  result.y = Math.floor(minY)
  result.w = Math.ceil(maxX - minX)
  result.h = Math.ceil(maxY - minY)

  return result
}
