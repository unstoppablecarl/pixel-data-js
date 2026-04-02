import { type Rect } from '../_types'

export function trimRectBounds(
  x: number,
  y: number,
  w: number,
  h: number,
  targetWidth: number,
  targetHeight: number,
  out?: Rect,
): Rect {
  const res = out ?? {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  const left = Math.max(0, x)
  const top = Math.max(0, y)
  const right = Math.min(targetWidth, x + w)
  const bottom = Math.min(targetHeight, y + h)

  res.x = left
  res.y = top
  res.w = Math.max(0, right - left)
  res.h = Math.max(0, bottom - top)

  return res
}
