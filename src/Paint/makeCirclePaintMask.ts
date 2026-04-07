import { MaskType } from '../_types'
import { _macro_paintCircleCenterOffset } from '../Internal/macros'
import { type PaintAlphaMask, type PaintBinaryMask, PaintMaskOutline } from './_paint-types'

export function makeCirclePaintAlphaMask(size: number, fallOff: (d: number) => number = (d) => d): PaintAlphaMask<PaintMaskOutline.CIRCLE> {
  const area = size * size
  const data = new Uint8Array(area)
  const radius = size / 2
  const invR = 1 / radius

  const centerOffset = _macro_paintCircleCenterOffset(radius)

  for (let y = 0; y < size; y++) {
    const rowOffset = y * size
    const dy = y - radius + 0.5
    const dy2 = dy * dy

    for (let x = 0; x < size; x++) {
      const dx = x - radius + 0.5
      const distSqr = dx * dx + dy2

      if (distSqr <= (radius * radius)) {
        const dist = Math.sqrt(distSqr) * invR

        // Pass 1.0 at center, 0.0 at edge
        const strength = fallOff(1 - dist)
        if (strength > 0) {
          const intensity = (strength * 255) | 0
          data[rowOffset + x] = Math.max(0, Math.min(255, intensity))
        }
      }
    }
  }

  return {
    type: MaskType.ALPHA,
    outlineType: PaintMaskOutline.CIRCLE,
    data,
    w: size,
    h: size,
    centerOffsetX: centerOffset,
    centerOffsetY: centerOffset,
  }
}

export function makeCirclePaintBinaryMask(size: number): PaintBinaryMask<PaintMaskOutline.CIRCLE> {
  const area = size * size
  const data = new Uint8Array(area)
  const radius = size / 2
  const r2 = radius * radius

  const centerOffset = _macro_paintCircleCenterOffset(radius)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - radius + 0.5
      const dy = y - radius + 0.5
      const distSqr = dx * dx + dy * dy
      if (distSqr <= r2) {
        data[y * size + x] = 1
      }
    }
  }

  return {
    type: MaskType.BINARY,
    outlineType: PaintMaskOutline.CIRCLE,
    data,
    w: size,
    h: size,
    centerOffsetX: centerOffset,
    centerOffsetY: centerOffset,
  }
}
