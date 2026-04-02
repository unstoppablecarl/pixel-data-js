import { MaskType, type PaintAlphaMask } from '../_types'

export function makeCirclePaintAlphaMask(size: number, fallOff: (d: number) => number = (d) => d): PaintAlphaMask {
  const area = size * size
  const data = new Uint8Array(area)
  const radius = size / 2
  const invR = 1 / radius

  const centerOffset = -Math.ceil(radius - 0.5)

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
    data,
    w: size,
    h: size,
    centerOffsetX: centerOffset,
    centerOffsetY: centerOffset
  }
}
