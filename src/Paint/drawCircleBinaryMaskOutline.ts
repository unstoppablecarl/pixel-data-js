import { type BinaryMask } from '../_types'
import { type PaintBinaryMask, PaintMaskOutline } from './_paint-types'

export function drawCirclePaintBinaryMaskOutline(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  mask: PaintBinaryMask<PaintMaskOutline.CIRCLE>,
  cssColor: string,
  x = 0,
  y = 0,
  scale = 1,
) {
  drawCircleBinaryMaskOutline(ctx, mask, cssColor, x + mask.centerOffsetX, y + mask.centerOffsetY, scale)
}

export function drawCircleBinaryMaskOutline(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  mask: BinaryMask,
  cssColor: string,
  x = 0,
  y = 0,
  scale = 1,
): void {
  const size = mask.w
  const radius = size / 2
  const r2 = radius * radius

  ctx.fillStyle = cssColor
  ctx.beginPath()

  let prevMinX = -1
  let prevMaxX = -1

  let currMinX = -1
  let currMaxX = -1

  const initialDy = 0 - radius + 0.5
  const initialDy2 = initialDy * initialDy

  // Pre-calculate the starting row
  if (initialDy2 <= r2) {
    const dx = Math.sqrt(r2 - initialDy2)
    currMinX = Math.ceil(radius - 0.5 - dx)
    currMaxX = Math.floor(radius - 0.5 + dx)
  }

  for (let iy = 0; iy < size; iy++) {
    let nextMinX = -1
    let nextMaxX = -1

    // Peek ahead to calculate the next row
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
        const px = (x + ix) * scale
        const py = (y + iy) * scale

        const isTop = prevMinX === -1 || ix < prevMinX || ix > prevMaxX
        const isBottom = nextMinX === -1 || ix < nextMinX || ix > nextMaxX
        const isLeft = ix === currMinX
        const isRight = ix === currMaxX

        if (isTop) {
          ctx.rect(
            px,
            py - 1,
            scale,
            1,
          )
        }

        if (isBottom) {
          ctx.rect(
            px,
            py + scale,
            scale,
            1,
          )
        }

        if (isLeft) {
          ctx.rect(
            px - 1,
            py,
            1,
            scale,
          )
        }

        if (isRight) {
          ctx.rect(
            px + scale,
            py,
            1,
            scale,
          )
        }
      }
    }

    // Shift the window down for the next iteration
    prevMinX = currMinX
    prevMaxX = currMaxX
    currMinX = nextMinX
    currMaxX = nextMaxX
  }

  ctx.fill()
}
