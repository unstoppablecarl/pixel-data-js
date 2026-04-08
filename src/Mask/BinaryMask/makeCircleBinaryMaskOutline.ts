import { type BinaryMask, MaskType } from '../_mask-types'

export function makeCircleBinaryMaskOutline(size: number, scale: number): BinaryMask {
  const outSize = size * scale + 2
  const outArea = outSize * outSize
  const data = new Uint8Array(outArea)

  const radius = size / 2
  const r2 = radius * radius

  let prevMinX = -1
  let prevMaxX = -1

  let currMinX = -1
  let currMaxX = -1

  const initialDy = 0 - radius + 0.5
  const initialDy2 = initialDy * initialDy

  if (initialDy2 <= r2) {
    const dx = Math.sqrt(r2 - initialDy2)
    currMinX = Math.ceil(radius - 0.5 - dx)
    currMaxX = Math.floor(radius - 0.5 + dx)
  }

  for (let iy = 0; iy < size; iy++) {
    let nextMinX = -1
    let nextMaxX = -1

    if (iy + 1 < size) {
      const ny = (iy + 1) - radius + 0.5
      const ny2 = ny * ny

      if (ny2 <= r2) {
        const dx = Math.sqrt(r2 - ny2)
        nextMinX = Math.ceil(radius - 0.5 - dx)
        nextMaxX = Math.floor(radius - 0.5 + dx)
      }
    }

    if (currMinX !== -1) {
      for (let ix = currMinX; ix <= currMaxX; ix++) {
        // Offset by 1 to leave room for the top/left outline edges
        const sx = ix * scale + 1
        const sy = iy * scale + 1

        const isTop = prevMinX === -1 || ix < prevMinX || ix > prevMaxX
        const isBottom = nextMinX === -1 || ix < nextMinX || ix > nextMaxX
        const isLeft = ix === currMinX
        const isRight = ix === currMaxX

        if (isTop) {
          const leftOut = prevMinX === -1 || (ix - 1) < prevMinX || (ix - 1) > prevMaxX
          const rightOut = prevMinX === -1 || (ix + 1) < prevMinX || (ix + 1) > prevMaxX
          const startX = leftOut ? sx - 1 : sx
          const endX = rightOut ? sx + scale : sx + scale - 1

          for (let x = startX; x <= endX; x++) {
            const index = (sy - 1) * outSize + x
            data[index] = 1
          }
        }

        if (isBottom) {
          const leftOut = nextMinX === -1 || (ix - 1) < nextMinX || (ix - 1) > nextMaxX
          const rightOut = nextMinX === -1 || (ix + 1) < nextMinX || (ix + 1) > nextMaxX
          const startX = leftOut ? sx - 1 : sx
          const endX = rightOut ? sx + scale : sx + scale - 1

          for (let x = startX; x <= endX; x++) {
            const index = (sy + scale) * outSize + x
            data[index] = 1
          }
        }

        if (isLeft) {
          for (let y = sy; y < sy + scale; y++) {
            const index = y * outSize + (sx - 1)
            data[index] = 1
          }
        }

        if (isRight) {
          for (let y = sy; y < sy + scale; y++) {
            const index = y * outSize + (sx + scale)
            data[index] = 1
          }
        }
      }
    }

    prevMinX = currMinX
    prevMaxX = currMaxX
    currMinX = nextMinX
    currMaxX = nextMaxX
  }

  return {
    type: MaskType.BINARY,
    w: outSize,
    h: outSize,
    data,
  }
}
