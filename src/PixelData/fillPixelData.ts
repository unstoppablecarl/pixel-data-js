import type { Color32, Rect } from '../_types'
import type { PixelData } from '../PixelData'

/**
 * A high-performance solid fill for PixelData.
 */
export function fillPixelData(
  dst: PixelData,
  color: Color32,
  rect?: Partial<Rect>,
): void {
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: width = dst.width,
    h: height = dst.height,
  } = rect || {}

  let x = targetX
  let y = targetY
  let w = width
  let h = height

  // Destination Clipping
  if (x < 0) {
    w += x
    x = 0
  }
  if (y < 0) {
    h += y
    y = 0
  }

  const actualW = Math.min(w, dst.width - x)
  const actualH = Math.min(h, dst.height - y)

  if (actualW <= 0 || actualH <= 0) {
    return
  }

  const dst32 = dst.data32
  const dw = dst.width

  // Optimization: If filling the entire buffer, use the native .fill()
  if (actualW === dw && actualH === dst.height && x === 0 && y === 0) {
    dst32.fill(color)
    return
  }

  // Row-by-row fill for partial rectangles
  for (let iy = 0; iy < actualH; iy++) {
    const start = (y + iy) * dw + x
    const end = start + actualW
    dst32.fill(color, start, end)
  }
}
