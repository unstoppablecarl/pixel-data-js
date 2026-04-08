import { type BinaryMask, MaskType } from '../_mask-types'

export function makeBinaryMaskOutline(
  mask: BinaryMask,
  scale = 1,
): BinaryMask {
  const w = mask.w
  const h = mask.h
  const maskData = mask.data

  const size = w * scale + 2
  const outData = new Uint8Array(size * size)

  for (let iy = 0; iy < h; iy++) {
    for (let ix = 0; ix < w; ix++) {
      const i = iy * w + ix
      if (maskData[i] === 0) continue

      const lx = ix * scale + 1
      const ly = iy * scale + 1

      const top = iy === 0 || maskData[i - w] === 0
      const bottom = iy === h - 1 || maskData[i + w] === 0
      const left = ix === 0 || maskData[i - 1] === 0
      const right = ix === w - 1 || maskData[i + 1] === 0

      const topLeft = iy === 0 || ix === 0 || maskData[i - w - 1] === 0
      const topRight = iy === 0 || ix === w - 1 || maskData[i - w + 1] === 0
      const bottomLeft = iy === h - 1 || ix === 0 || maskData[i + w - 1] === 0
      const bottomRight = iy === h - 1 || ix === w - 1 || maskData[i + w + 1] === 0

      if (top) {
        for (let sx = 0; sx < scale; sx++) {
          const outIdx = (ly - 1) * size + (lx + sx)
          outData[outIdx] = 1
        }
      }

      if (bottom) {
        for (let sx = 0; sx < scale; sx++) {
          const outIdx = (ly + scale) * size + (lx + sx)
          outData[outIdx] = 1
        }
      }

      if (left) {
        for (let sy = 0; sy < scale; sy++) {
          const outIdx = (ly + sy) * size + (lx - 1)
          outData[outIdx] = 1
        }
      }

      if (right) {
        for (let sy = 0; sy < scale; sy++) {
          const outIdx = (ly + sy) * size + (lx + scale)
          outData[outIdx] = 1
        }
      }

      if (topLeft) {
        const outIdx = (ly - 1) * size + (lx - 1)
        outData[outIdx] = 1
      }

      if (topRight) {
        const outIdx = (ly - 1) * size + (lx + scale)
        outData[outIdx] = 1
      }

      if (bottomLeft) {
        const outIdx = (ly + scale) * size + (lx - 1)
        outData[outIdx] = 1
      }

      if (bottomRight) {
        const outIdx = (ly + scale) * size + (lx + scale)
        outData[outIdx] = 1
      }
    }
  }

  return {
    type: MaskType.BINARY,
    w: size,
    h: size,
    data: outData,
  }
}
