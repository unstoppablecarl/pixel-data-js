import type { Rect } from '../_types'

export function drawRectOutline(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cssColor: string,
  scale = 1,
  thickness = 1,
): void {
  ctx.fillStyle = cssColor

  const rx = x * scale
  const ry = y * scale
  const rw = w * scale
  const rh = h * scale
  const t = thickness

  // top
  ctx.fillRect(rx - t, ry - t, rw + t * 2, t)
  // bottom
  ctx.fillRect(rx - t, ry + rh, rw + t * 2, t)
  // left
  ctx.fillRect(rx - t, ry, t, rh)
  // right
  ctx.fillRect(rx + rw, ry, t, rh)
}

export function drawRectObjOutline(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  rect: Rect,
  cssColor: string,
  scale = 1,
  thickness = 1,
): void {
  ctx.fillStyle = cssColor

  const rx = rect.x * scale
  const ry = rect.y * scale
  const rw = rect.w * scale
  const rh = rect.h * scale
  const t = thickness

  // top
  ctx.fillRect(rx - t, ry - t, rw + t * 2, t)
  // bottom
  ctx.fillRect(rx - t, ry + rh, rw + t * 2, t)
  // left
  ctx.fillRect(rx - t, ry, t, rh)
  // right
  ctx.fillRect(rx + rw, ry, t, rh)
}
