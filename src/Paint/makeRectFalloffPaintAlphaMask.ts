import { MaskType, type PaintAlphaMask } from '../_types'
import { _macro_halfAndFloor } from '../Internal/macros'

export function makeRectFalloffPaintAlphaMask(
  width: number,
  height: number,
  fallOff: (d: number) => number = (d) => d,
): PaintAlphaMask {
  const fPx = Math.floor(width / 2)
  const fPy = Math.floor(height / 2)

  const invHalfW = 2 / width
  const invHalfH = 2 / height

  const offX = (width % 2 === 0) ? 0.5 : 0
  const offY = (height % 2 === 0) ? 0.5 : 0

  const area = width * height
  const data = new Uint8Array(area)

  for (let y = 0; y < height; y++) {
    const dy = Math.abs((y - fPy) + offY) * invHalfH
    const rowOffset = y * width

    for (let x = 0; x < width; x++) {
      const dx = Math.abs((x - fPx) + offX) * invHalfW

      // Chebyshev distance (square/rect shape)
      const dist = dx > dy ? dx : dy
      // Pass 1.0 at center, 0.0 at edge
      const strength = fallOff(1 - dist)
      if (strength > 0) {
        const intensity = (strength * 255) | 0
        data[rowOffset + x] = Math.max(0, Math.min(255, intensity))
      }
    }
  }

  return {
    type: MaskType.ALPHA,
    data: data,
    w: width,
    h: height,
    centerOffsetX: -_macro_halfAndFloor(width),
    centerOffsetY: -_macro_halfAndFloor(height),
  }
}
