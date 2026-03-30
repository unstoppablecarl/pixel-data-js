import { type CircleBrushAlphaMask, MaskType } from '../_types'

export function makeCircleBrushAlphaMask(size: number, fallOff: (d: number) => number = () => 1): CircleBrushAlphaMask {
  const area = size * size
  const data = new Uint8Array(area)
  const radius = size / 2
  const invR = 1 / radius

  const minOffset = -Math.ceil(radius - 0.5)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - radius + 0.5
      const dy = y - radius + 0.5
      const distSqr = dx * dx + dy * dy
      if (distSqr <= (radius * radius)) {
        const dist = Math.sqrt(distSqr)
        data[y * size + x] = (fallOff(1 - (dist * invR)) * 255) | 0
      }
    }
  }

  return {
    type: MaskType.ALPHA,
    data,
    w: size,
    h: size,
    radius,
    size,
    minOffset,
  }
}
