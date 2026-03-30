import { type CircleBrushBinaryMask, MaskType } from '../_types'

export function makeCircleBrushBinaryMask(size: number): CircleBrushBinaryMask {
  const area = size * size
  const data = new Uint8Array(area)
  const radius = size / 2

  const minOffset = -Math.ceil(radius - 0.5)

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - radius + 0.5
      const dy = y - radius + 0.5
      const distSqr = dx * dx + dy * dy
      if (distSqr <= (radius * radius)) {
        data[y * size + x] = 1
      }
    }
  }

  return {
    type: MaskType.BINARY,
    data,
    w: size,
    h: size,
    radius,
    size,
    minOffset,
  }
}
